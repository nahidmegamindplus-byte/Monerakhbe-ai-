import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { paymentService } from "@/services/payment/paymentService";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, billingCycle = "MONTHLY", paymentMethod, couponCode } = body;

    if (!planId || !paymentMethod) {
      return NextResponse.json({ error: "Plan and payment method are required" }, { status: 400 });
    }

    if (!["bkash", "nagad", "rocket"].includes(paymentMethod.toLowerCase())) {
      return NextResponse.json({ error: "Invalid payment method. Choose bKash, Nagad or Rocket." }, { status: 400 });
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";

    const { order, gatewayResult } = await paymentService.createOrder({
      userId: session.id,
      planId,
      billingCycle,
      paymentMethod,
      couponCode,
      callbackBaseUrl: origin,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        currency: order.currency,
        planId: order.planId,
        billingCycle: order.billingCycle,
        paymentMethod: order.paymentMethod,
      },
      redirectUrl: gatewayResult.redirectUrl,
      paymentId: gatewayResult.paymentId,
      clientData: gatewayResult.clientData,
    });
  } catch (error: any) {
    console.error("[Payment Create Error]", error);
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
  }
}
