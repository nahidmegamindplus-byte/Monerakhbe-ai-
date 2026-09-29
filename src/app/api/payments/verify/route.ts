import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { paymentService } from "@/services/payment/paymentService";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, trxId, providerTrxId, senderPhone } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true, invoice: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership (unless Admin)
    if (order.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Not your order" }, { status: 403 });
    }

    const result = await paymentService.verifyAndActivatePayment({
      orderId,
      paymentId,
      trxId: trxId || providerTrxId,
      providerTrxId: providerTrxId || trxId,
      senderPhone,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        verified: true,
        status: "PAID",
        order: result.order,
        subscription: result.subscription,
        invoice: result.invoice,
      });
    }

    return NextResponse.json({
      success: false,
      verified: false,
      error: result.error || "Payment verification failed",
    }, { status: 400 });
  } catch (error: any) {
    console.error("[Payment Verify Error]", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
