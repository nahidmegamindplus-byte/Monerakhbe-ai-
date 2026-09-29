import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST /api/payments/submit-trx
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, senderPhone, trxId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    if (!senderPhone || !senderPhone.trim()) {
      return NextResponse.json({ error: "আপনার পেমেন্ট প্রেরক মোবাইল নম্বর লিখুন" }, { status: 400 });
    }
    if (!trxId || !trxId.trim()) {
      return NextResponse.json({ error: "ট্রানজেকশন আইডি (TrxID) লিখুন" }, { status: 400 });
    }

    const cleanTrx = trxId.trim().toUpperCase();
    const cleanPhone = senderPhone.trim();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update order with TrxID and ensure status is PENDING
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        providerTransactionId: cleanTrx,
        status: "PENDING",
      },
    });

    // Create or update PaymentTransaction record
    const existingTxn = await prisma.paymentTransaction.findFirst({
      where: { orderId: order.id },
    });

    const rawPayload = {
      senderPhone: cleanPhone,
      trxId: cleanTrx,
      submittedAt: new Date().toISOString(),
      method: order.paymentMethod,
      amount: order.amount,
      note: "User submitted manual payment details awaiting admin verification",
    };

    if (existingTxn) {
      await prisma.paymentTransaction.update({
        where: { id: existingTxn.id },
        data: {
          providerTrxId: cleanTrx,
          status: "PENDING",
          rawReference: JSON.stringify(rawPayload),
        },
      });
    } else {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          provider: order.paymentMethod.toUpperCase(),
          paymentMethod: order.paymentMethod,
          transactionId: `TXN-${Date.now()}`,
          providerTrxId: cleanTrx,
          amount: order.amount,
          currency: "BDT",
          status: "PENDING",
          rawReference: JSON.stringify(rawPayload),
        },
      });
    }

    await logAudit({
      userId: session.id,
      action: "USER_PAYMENT_TRX_SUBMITTED",
      entityType: "ORDER",
      entityId: order.id,
      details: { senderPhone: cleanPhone, trxId: cleanTrx, amount: order.amount },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: "PENDING",
      message: "পেমেন্ট তথ্য সফলভাবে জমা হয়েছে। অ্যাডমিন প্যানেল থেকে কনফার্ম করার জন্য অপেক্ষা করা হচ্ছে...",
      redirectUrl: `/payment/pending?orderId=${order.id}`,
    });
  } catch (error: any) {
    console.error("[Submit Trx Error]", error);
    return NextResponse.json({ error: error.message || "Failed to submit transaction details" }, { status: 500 });
  }
}
