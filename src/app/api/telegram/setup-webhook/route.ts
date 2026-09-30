import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key";

    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is missing" }, { status: 400 });
    }

    if (!appUrl || !appUrl.startsWith("https://")) {
      return NextResponse.json({
        warning: "APP_URL must be an HTTPS URL to set Telegram webhook in production",
        currentUrl: appUrl,
        mode: "local_polling",
      });
    }

    const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}&secret_token=${encodeURIComponent(secret)}`;

    const response = await fetch(tgUrl);
    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
