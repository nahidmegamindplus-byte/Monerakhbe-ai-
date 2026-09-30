import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key";

    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is missing in environment" }, { status: 400 });
    }

    // 1. Determine the best public HTTPS domain
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || (req.nextUrl.protocol.replace(":", ""));
    const detectedUrl = host ? `${proto}://${host}` : "";

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    
    // Choose the active HTTPS URL (prefer detected live host if HTTPS, or envAppUrl)
    let targetBaseUrl = "";
    if (detectedUrl.startsWith("https://")) {
      targetBaseUrl = detectedUrl;
    } else if (envAppUrl.startsWith("https://")) {
      targetBaseUrl = envAppUrl;
    } else {
      targetBaseUrl = detectedUrl || envAppUrl;
    }

    if (!targetBaseUrl.startsWith("https://")) {
      return NextResponse.json({
        success: false,
        warning: "টেলিগ্রাম বটের জন্য HTTPS লাইভ ডোমেন প্রয়োজন। আপনার ডোমেনে SSL/HTTPS চালু করুন অথবা ডোমেন লিঙ্ক দিন।",
        currentUrl: targetBaseUrl,
        mode: "local_polling_required",
      });
    }

    const webhookUrl = `${targetBaseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=true`;

    const response = await fetch(tgUrl);
    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
      message: data.ok ? "টেলিগ্রাম বট সফলভাবে সক্রিয় করা হয়েছে! 🎉" : data.description,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customUrl = body.appUrl || body.url;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key";

    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is missing" }, { status: 400 });
    }

    let targetBaseUrl = customUrl || "";
    if (!targetBaseUrl) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
      const proto = req.headers.get("x-forwarded-proto") || (req.nextUrl.protocol.replace(":", ""));
      targetBaseUrl = `${proto}://${host}`;
    }

    if (!targetBaseUrl.startsWith("https://")) {
      return NextResponse.json({
        success: false,
        warning: "টেলিগ্রাম বটের ওয়েবহুকের জন্য HTTPS ডোমেন প্রয়োজন (যেমন https://yourdomain.com)।",
        currentUrl: targetBaseUrl,
      }, { status: 400 });
    }

    const webhookUrl = `${targetBaseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=true`;

    const response = await fetch(tgUrl);
    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
      message: data.ok ? "টেলিগ্রাম বট সফলভাবে সক্রিয় করা হয়েছে! 🎉" : data.description,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
