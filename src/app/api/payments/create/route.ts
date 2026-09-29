import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
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
      return NextResponse.json({ error: "প্ল্যান এবং পেমেন্ট মেথড নির্বাচন করুন" }, { status: 400 });
    }

    const cleanMethod = String(paymentMethod).trim().toLowerCase();

    // Verify method is configured in database or is standard method
    const methodConfig = await prisma.paymentMethodConfig.findFirst({
      where: {
        code: cleanMethod,
        isActive: true,
      },
    });

    if (!methodConfig && !["bkash", "nagad", "rocket"].includes(cleanMethod)) {
      return NextResponse.json({ error: "নির্বাচিত পেমেন্ট মেথডটি বর্তমানে সক্রিয় নয়।" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";

    const { order, gatewayResult } = await paymentService.createOrder({
      userId: session.id,
      planId,
      billingCycle,
      paymentMethod: cleanMethod as any,
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
    return NextResponse.json({ error: error.message || "পেমেন্ট শুরু করতে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
