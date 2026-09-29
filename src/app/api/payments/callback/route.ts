import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment/paymentService";

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const paymentId = url.searchParams.get("paymentID") || url.searchParams.get("payment_ref_id") || url.searchParams.get("paymentId");
  const status = url.searchParams.get("status") || url.searchParams.get("payment_status");
  const trxId = url.searchParams.get("trxID") || url.searchParams.get("transaction_id");

  const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";

  if (!orderId) {
    return NextResponse.redirect(`${origin}/payment/failed?error=Missing+order+id`);
  }

  // If user cancelled on gateway
  if (status === "cancel" || status === "CANCELLED") {
    return NextResponse.redirect(`${origin}/payment/failed?orderId=${orderId}&error=Payment+was+cancelled`);
  }

  try {
    const result = await paymentService.verifyAndActivatePayment({
      orderId,
      paymentId: paymentId || undefined,
      trxId: trxId || undefined,
    });

    if (result.success && result.verified) {
      return NextResponse.redirect(`${origin}/payment/success?orderId=${orderId}`);
    } else {
      return NextResponse.redirect(
        `${origin}/payment/failed?orderId=${orderId}&error=${encodeURIComponent(result.error || "Verification failed")}`
      );
    }
  } catch (error: any) {
    console.error("[Payment Callback Error]", error);
    return NextResponse.redirect(
      `${origin}/payment/failed?orderId=${orderId}&error=${encodeURIComponent(error.message || "Server verification error")}`
    );
  }
}
