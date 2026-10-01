import { NextRequest } from "next/server";
import { getTelegramBotToken } from "./bot";
import { startTelegramAutoPoller } from "./poller";

/**
 * Universal Auto-Sync for Telegram Bot
 * - If on public HTTPS (Vercel, custom domain): Sets Webhook automatically
 * - If on localhost: Starts background auto-poller automatically
 */
export async function autoSyncTelegramWebhook(req?: NextRequest, customToken?: string) {
  try {
    const token = customToken || (await getTelegramBotToken());
    if (!token || !token.trim()) return null;

    let liveUrl = "";
    if (req) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
      const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
      if (host && (proto === "https" || host.includes("vercel.app") || (!host.includes("localhost") && !host.includes("127.0.0.1")))) {
        liveUrl = `https://${host}`;
      }
    }

    if (!liveUrl) {
      const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      if (envAppUrl.startsWith("https://")) {
        liveUrl = envAppUrl;
      }
    }

    if (liveUrl.startsWith("https://")) {
      const webhookUrl = `${liveUrl.replace(/\/$/, "")}/api/telegram/webhook`;
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key";
      
      const res = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
          webhookUrl
        )}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=true`
      );
      const data = await res.json();
      return { isWebhook: true, webhookUrl, data };
    } else {
      // Local development or HTTP
      startTelegramAutoPoller();
      return { isWebhook: false, mode: "polling" };
    }
  } catch (err) {
    console.error("[autoSyncTelegramWebhook Error]", err);
    return null;
  }
}
