import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/services/telegram/handlers";
import { TelegramWebhookUpdate } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (configuredSecret && secretHeader && secretHeader !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook token" }, { status: 401 });
    }

    const update = (await req.json()) as TelegramWebhookUpdate;
    if (!update || !update.update_id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Process asynchronously or await safely
    await handleTelegramUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook Route Error]", error);
    // Return 200 to Telegram so Telegram does not aggressively retry corrupted payloads
    return NextResponse.json({ ok: true, handledError: true });
  }
}
