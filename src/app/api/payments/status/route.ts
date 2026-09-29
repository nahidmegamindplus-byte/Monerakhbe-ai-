import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/payments/status?orderId=...
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        plan: true,
        invoice: true,
        transactions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership (unless Admin)
    if (order.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Not your order" }, { status: 403 });
    }

    // Also check user's active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: order.userId, status: "ACTIVE" },
      include: { plan: true },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        providerTransactionId: order.providerTransactionId || order.transactionId,
        paidAt: order.paidAt,
        planName: order.plan?.name,
      },
      invoice: order.invoice ? { id: order.invoice.id, invoiceNumber: order.invoice.invoiceNumber } : null,
      subscription: activeSub ? { id: activeSub.id, planId: activeSub.planId, status: activeSub.status, expiresAt: activeSub.expiresAt } : null,
      isPaid: order.status === "PAID",
      isPending: order.status === "PENDING" || order.status === "PROCESSING",
      isFailed: order.status === "FAILED" || order.status === "CANCELLED",
    });
  } catch (error: any) {
    console.error("[Payment Status API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payment status" }, { status: 500 });
  }
}
