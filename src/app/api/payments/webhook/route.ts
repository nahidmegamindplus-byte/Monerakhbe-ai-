import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment/paymentService";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const headersList: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersList[key.toLowerCase()] = val;
    });

    const providerName = req.nextUrl.searchParams.get("provider") || "GATEWAY";

    // Process webhook
    const result = await paymentService.processWebhook({
      providerName,
      payload,
      headers: headersList,
    });

    return NextResponse.json({
      success: true,
      processed: true,
      status: result.success ? "ACTIVATED" : "FAILED",
    });
  } catch (error: any) {
    console.error("[Payment Webhook Error]", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 400 }
    );
  }
}
