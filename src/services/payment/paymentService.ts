import prisma from "@/lib/prisma";
import { BKashProvider } from "./bKashProvider";
import { NagadProvider } from "./nagadProvider";
import { RocketProvider } from "./rocketProvider";
import {
  PaymentMethod,
  PaymentProvider,
  CreatePaymentResult,
  VerifyPaymentResult,
} from "./types";
import { logAudit } from "@/lib/audit";
import { sendTelegramMessageDirect } from "@/services/telegram/bot";

class PaymentService {
  private providers: Record<string, PaymentProvider> = {
    bkash: new BKashProvider(),
    nagad: new NagadProvider(),
    rocket: new RocketProvider(),
  };

  private getProvider(method: PaymentMethod): PaymentProvider {
    const provider = this.providers[method.toLowerCase()];
    if (!provider) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return provider;
  }

  // 1. Create a Secure Order on Backend
  async createOrder({
    userId,
    planId,
    billingCycle = "MONTHLY",
    paymentMethod,
    couponCode,
    callbackBaseUrl,
  }: {
    userId: string;
    planId: string;
    billingCycle?: "MONTHLY" | "YEARLY";
    paymentMethod: PaymentMethod;
    couponCode?: string;
    callbackBaseUrl: string;
  }) {
    // 1. Fetch user & plan from DB
    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!user) throw new Error("User not found");
    if (!plan || !plan.isActive) throw new Error("Selected plan is not available");

    // 2. Server-side price calculation
    const basePrice =
      billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

    if (basePrice <= 0) {
      throw new Error("Free plan cannot be checked out via payment gateway");
    }

    let discountAmount = 0;
    let appliedCoupon: any = null;

    if (couponCode && couponCode.trim()) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.active) {
        const isNotExpired = !coupon.expiresAt || new Date() <= coupon.expiresAt;
        const hasUsesLeft = coupon.usedCount < coupon.maxUses;
        const meetsMinAmount = basePrice >= coupon.minOrderAmount;

        if (isNotExpired && hasUsesLeft && meetsMinAmount) {
          appliedCoupon = coupon;
          if (coupon.type === "PERCENTAGE") {
            discountAmount = (basePrice * coupon.value) / 100;
          } else {
            discountAmount = coupon.value;
          }
          if (discountAmount > basePrice) discountAmount = basePrice;
        }
      }
    }

    const finalPayableAmount = Math.max(0, basePrice - discountAmount);

    // 3. Generate Unique Order Number & Internal Transaction ID
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `MNR-${datePrefix}-${randomSuffix}`;
    const transactionId = `TXN-${datePrefix}-${randomSuffix}`;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 mins window

    // 4. Create Order & PaymentTransaction in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        planId: plan.id,
        billingCycle,
        amount: finalPayableAmount,
        originalAmount: basePrice,
        discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        currency: "BDT",
        paymentMethod: paymentMethod.toLowerCase(),
        status: "PENDING",
        transactionId,
        expiresAt,
        transactions: {
          create: {
            userId,
            provider: paymentMethod.toUpperCase(),
            paymentMethod: paymentMethod.toLowerCase(),
            transactionId,
            amount: finalPayableAmount,
            currency: "BDT",
            status: "PENDING",
          },
        },
      },
      include: {
        plan: true,
        user: true,
        transactions: true,
      },
    });

    // 5. Initiate with Provider
    const provider = this.getProvider(paymentMethod);
    const callbackUrl = `${callbackBaseUrl}/api/payments/callback?orderId=${order.id}&method=${paymentMethod}`;
    const webhookUrl = `${callbackBaseUrl}/api/payments/webhook`;

    const gatewayResult = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: finalPayableAmount,
      currency: "BDT",
      paymentMethod,
      customerName: user.name,
      customerEmail: user.email,
      callbackUrl,
      webhookUrl,
    });

    if (gatewayResult.success && gatewayResult.paymentId) {
      await prisma.paymentTransaction.updateMany({
        where: { orderId: order.id },
        data: { providerPaymentId: gatewayResult.paymentId },
      });
    }

    return {
      order,
      gatewayResult,
    };
  }

  // 2. Server-Side Verification & Idempotent Subscription Activation
  async verifyAndActivatePayment({
    orderId,
    paymentId,
    trxId,
    providerTrxId,
    senderPhone,
    rawCallback,
    isManualAdminVerification = false,
  }: {
    orderId: string;
    paymentId?: string;
    trxId?: string;
    providerTrxId?: string;
    senderPhone?: string;
    rawCallback?: any;
    isManualAdminVerification?: boolean;
  }) {
    // 1. Fetch Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { include: { telegramConnection: true } },
        plan: true,
        transactions: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // IDEMPOTENCY CHECK: If already paid, return success immediately without duplicate activation
    if (order.status === "PAID") {
      const existingSub = await prisma.subscription.findFirst({
        where: { orderId: order.id },
      });
      return {
        success: true,
        alreadyProcessed: true,
        order,
        subscription: existingSub,
        message: "Payment was already verified and subscription is active",
      };
    }

    let verificationResult: VerifyPaymentResult;

    if (isManualAdminVerification) {
      verificationResult = {
        success: true,
        verified: true,
        orderId: order.id,
        paymentId: paymentId || order.transactionId || "",
        trxId: trxId || providerTrxId || `ADMIN_VERIFIED_${Date.now()}`,
        providerTrxId: providerTrxId || trxId,
        amount: order.amount,
        currency: "BDT",
        status: "PAID",
      };
    } else {
      const provider = this.getProvider(order.paymentMethod as PaymentMethod);
      verificationResult = await provider.verifyPayment({
        orderId: order.id,
        paymentId: paymentId || order.transactions[0]?.providerPaymentId || undefined,
        trxId,
        providerTrxId,
        rawCallback,
      });
    }

    if (!verificationResult.verified || verificationResult.status !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: verificationResult.status === "CANCELLED" ? "CANCELLED" : "FAILED",
        },
      });

      await prisma.paymentTransaction.updateMany({
        where: { orderId: order.id },
        data: {
          status: "FAILED",
          failureReason: verificationResult.errorMessage || "Payment verification failed",
        },
      });

      return {
        success: false,
        verified: false,
        error: verificationResult.errorMessage || "Verification failed with payment provider",
      };
    }

    // SERVER-SIDE AMOUNT VALIDATION: Reject if provider amount doesn't match order amount
    if (
      verificationResult.amount > 0 &&
      Math.abs(verificationResult.amount - order.amount) > 0.01
    ) {
      console.error(
        `[Payment Amount Mismatch] Order: ${order.amount}, Provider: ${verificationResult.amount}`
      );
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return {
        success: false,
        verified: false,
        error: "Security Alert: Payment amount mismatch. Transaction rejected.",
      };
    }

    // 2. Calculate Expiration & Renewal Duration
    const now = new Date();
    let startedAt = now;
    let expiresAt = new Date(now);

    const existingActiveSub = await prisma.subscription.findFirst({
      where: {
        userId: order.userId,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    const isSamePlanRenewal =
      existingActiveSub && existingActiveSub.planId === order.planId;

    if (isSamePlanRenewal && existingActiveSub.expiresAt) {
      // Option A: Extend from current expiry date seamlessly
      expiresAt = new Date(existingActiveSub.expiresAt);
      startedAt = existingActiveSub.startedAt;
    }

    if (order.billingCycle === "YEARLY") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const finalTrxId = verificationResult.providerTrxId || verificationResult.trxId || order.transactionId;

    // 3. Atomic Database Activation
    const [updatedOrder, subscription, invoice] = await prisma.$transaction(async (tx) => {
      // a) Update Order
      const uOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: now,
          providerTransactionId: finalTrxId,
        },
      });

      // b) Update Payment Transaction
      const existingRef = verificationResult.rawResponse || {};
      const updatedRef = {
        ...existingRef,
        senderPhone: senderPhone || undefined,
        verifiedTrxId: finalTrxId,
        submittedAt: now.toISOString(),
      };

      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id },
        data: {
          status: "SUCCESS",
          providerTrxId: finalTrxId,
          verifiedAt: now,
          rawReference: JSON.stringify(updatedRef),
        },
      });

      // c) Increment Coupon Count if applied
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // d) Mark existing subscriptions as EXPIRED/SUPERSEDED if upgrading
      if (!isSamePlanRenewal) {
        await tx.subscription.updateMany({
          where: { userId: order.userId, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });
      }

      // e) Create or Update Subscription
      const sub = await tx.subscription.create({
        data: {
          userId: order.userId,
          planId: order.planId,
          orderId: order.id,
          status: "ACTIVE",
          billingCycle: order.billingCycle,
          paymentMethod: order.paymentMethod,
          startedAt,
          expiresAt,
          validUntil: expiresAt,
        },
      });

      // f) Immediately update User plan
      await tx.user.update({
        where: { id: order.userId },
        data: { plan: order.planId },
      });

      // g) Generate Invoice
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          userId: order.userId,
          customerName: order.user.name,
          customerEmail: order.user.email,
          planName: order.plan.name,
          billingCycle: order.billingCycle,
          paymentMethod: order.paymentMethod,
          transactionId: finalTrxId || order.orderNumber,
          amount: order.amount,
          discountAmount: order.discountAmount,
          status: "PAID",
          subscriptionExpiresAt: expiresAt,
        },
      });

      return [uOrder, sub, inv];
    });

    // 4. Audit Log
    await logAudit({
      userId: order.userId,
      action: "SUBSCRIPTION_ACTIVATED_VIA_PAYMENT",
      entityType: "ORDER",
      entityId: order.id,
      details: {
        plan: order.planId,
        amount: order.amount,
        method: order.paymentMethod,
        trxId: finalTrxId,
        expiresAt: expiresAt.toISOString(),
      },
    });

    // 5. Telegram Notification
    if (order.user.telegramConnection?.chatId) {
      const tgMsg = `🎉 *পেমেন্ট সফল ও প্যাকেজ সক্রিয় হয়েছে!*\n\n` +
        `প্যাকেজ: *${order.plan.name} (${order.billingCycle})*\n` +
        `টাকা: *৳${order.amount}*\n` +
        `পেমেন্ট মেথড: *${order.paymentMethod.toUpperCase()}*\n` +
        `TrxID: \`${finalTrxId}\`\n` +
        `মেয়াদ উত্তীর্ণ: *${expiresAt.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}*\n\n` +
        `ধন্যবাদ MoneRakhbe AI ব্যবহার করার জন্য! 🚀`;

      await sendTelegramMessageDirect(order.user.telegramConnection.chatId, tgMsg).catch(() => {});
    }

    return {
      success: true,
      verified: true,
      order: updatedOrder,
      subscription,
      invoice,
    };
  }

  // 3. Process Webhook Event with Signature Check
  async processWebhook({
    providerName,
    payload,
    headers,
  }: {
    providerName: string;
    payload: any;
    headers: Record<string, string>;
  }) {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const signature = headers["x-webhook-signature"] || headers["signature"];

    if (webhookSecret && signature && signature !== webhookSecret) {
      throw new Error("Invalid webhook signature");
    }

    const orderId = payload.orderId || payload.order_id || payload.merchantInvoiceNumber;
    const paymentId = payload.paymentID || payload.paymentId || payload.payment_ref_id;
    const trxId = payload.trxID || payload.transaction_id || payload.issuerPaymentRefNo;

    if (!orderId) {
      throw new Error("Missing order reference in webhook payload");
    }

    return this.verifyAndActivatePayment({
      orderId,
      paymentId,
      trxId,
      rawCallback: payload,
    });
  }

  // 4. Check & Expire Overdue Subscriptions
  async checkAndExpireSubscriptions() {
    const now = new Date();

    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      include: { user: true },
    });

    for (const sub of expiredSubs) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        }),
        prisma.user.update({
          where: { id: sub.userId },
          data: { plan: "FREE" },
        }),
      ]);

      await logAudit({
        userId: sub.userId,
        action: "SUBSCRIPTION_AUTO_EXPIRED",
        entityType: "SUBSCRIPTION",
        entityId: sub.id,
        details: { plan: sub.planId, expiredAt: sub.expiresAt },
      });
    }

    return expiredSubs.length;
  }
}

export const paymentService = new PaymentService();
