import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { paymentService } from "@/services/payment/paymentService";

// GET /api/admin/payments - List orders, transactions, and revenue analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (method && method !== "ALL") where.paymentMethod = method.toLowerCase();
    if (query) {
      where.OR = [
        { orderNumber: { contains: query } },
        { transactionId: { contains: query } },
        { providerTransactionId: { contains: query } },
        { user: { name: { contains: query } } },
        { user: { email: { contains: query } } },
      ];
    }

    const [total, orders, paidOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: true,
          transactions: true,
          invoice: true,
        },
      }),
      prisma.order.findMany({
        where: { status: "PAID" },
        select: { amount: true, paymentMethod: true, createdAt: true },
      }),
    ]);

    // Calculate Analytics
    let totalRevenue = 0;
    let bkashRevenue = 0;
    let nagadRevenue = 0;
    let rocketRevenue = 0;

    paidOrders.forEach((o) => {
      totalRevenue += o.amount;
      if (o.paymentMethod === "bkash") bkashRevenue += o.amount;
      else if (o.paymentMethod === "nagad") nagadRevenue += o.amount;
      else if (o.paymentMethod === "rocket") rocketRevenue += o.amount;
    });

    const [totalPaidCount, totalFailedCount, totalPendingCount] = await Promise.all([
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      analytics: {
        totalRevenue,
        bkashRevenue,
        nagadRevenue,
        rocketRevenue,
        totalPaidCount,
        totalFailedCount,
        totalPendingCount,
      },
    });
  } catch (error: any) {
    console.error("[Admin Payments GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/admin/payments - Admin actions (Manual Verification, Refund)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, orderId, trxId, providerTrxId, reason, amount } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (action === "MANUAL_VERIFY") {
      const result = await paymentService.verifyAndActivatePayment({
        orderId,
        trxId,
        providerTrxId,
        isManualAdminVerification: true,
      });

      if (result.success) {
        await logAudit({
          userId: session.id,
          action: "ADMIN_MANUAL_PAYMENT_VERIFIED",
          entityType: "ORDER",
          entityId: orderId,
          details: { verifiedBy: session.email, trxId: trxId || providerTrxId },
        });

        return NextResponse.json({
          success: true,
          message: "পেমেন্ট সফলভাবে ভেরিফাই ও সাবস্ক্রিপশন সক্রিয় করা হয়েছে!",
          order: result.order,
          subscription: result.subscription,
        });
      }

      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 });
    }

    if (action === "REFUND") {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { transactions: true },
      });

      if (!order || order.status !== "PAID") {
        return NextResponse.json({ error: "Only paid orders can be refunded" }, { status: 400 });
      }

      const refundAmount = amount ? parseFloat(amount) : order.amount;
      const primaryTx = order.transactions[0];

      await prisma.$transaction([
        prisma.refund.create({
          data: {
            orderId: order.id,
            paymentTransactionId: primaryTx ? primaryTx.id : order.id,
            userId: order.userId,
            amount: refundAmount,
            reason: reason || "Admin initiated refund",
            status: "COMPLETED",
            providerRefundId: `REF_${Date.now()}`,
            processedAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED" },
        }),
        prisma.subscription.updateMany({
          where: { orderId: order.id },
          data: { status: "CANCELLED" },
        }),
        prisma.user.update({
          where: { id: order.userId },
          data: { plan: "FREE" },
        }),
      ]);

      await logAudit({
        userId: session.id,
        action: "ADMIN_ORDER_REFUNDED",
        entityType: "ORDER",
        entityId: order.id,
        details: { refundAmount, reason, targetUser: order.userId },
      });

      return NextResponse.json({ success: true, message: "অর্ডার সফলভাবে রিফান্ড করা হয়েছে" });
    }

    if (action === "REJECT") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        }),
        prisma.paymentTransaction.updateMany({
          where: { orderId: orderId },
          data: { status: "FAILED", failureReason: reason || "Admin rejected transaction verification" },
        }),
      ]);

      await logAudit({
        userId: session.id,
        action: "ADMIN_ORDER_REJECTED",
        entityType: "ORDER",
        entityId: orderId,
        details: { reason: reason || "Invalid TrxID or unpaid", targetOrder: orderId },
      });

      return NextResponse.json({ success: true, message: "অর্ডারটি সফলভাবে বাতিল (Reject) করা হয়েছে" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Payments POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process payment action" }, { status: 500 });
  }
}
