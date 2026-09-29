require("dotenv").config();

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let offset = 0;

// 1. Poll incoming Telegram messages in real time
async function pollUpdates() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    setTimeout(pollUpdates, 2000);
    return;
  }

  const base = `https://api.telegram.org/bot${token}`;

  try {
    const res = await fetch(`${base}/getUpdates?offset=${offset}&timeout=15`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        console.log(`[Bot Poller] Received update ${update.update_id} from ${update.message?.from?.username || update.callback_query?.from?.username || "user"}`);

        try {
          const webhookRes = await fetch(`${appUrl}/api/telegram/webhook`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key",
            },
            body: JSON.stringify(update),
          });
          const webhookJson = await webhookRes.json();
          console.log(`[Bot Poller] Dispatched update ${update.update_id}:`, webhookJson);
        } catch (err) {
          console.error(`[Bot Poller] Error forwarding update ${update.update_id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[Bot Poller Error]", err.message);
    await new Promise((r) => setTimeout(r, 2000));
  }

  setTimeout(pollUpdates, 200);
}

// 2. Periodic Reminder Alert Worker (checks due notifications every 30 seconds)
async function triggerReminderWorker() {
  try {
    await fetch(`${appUrl}/api/cron/reminder-worker`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET || "monerakhbe_cron_secret_key"}`,
      },
    });
  } catch (e) {
    // ignore
  }
  setTimeout(triggerReminderWorker, 30000); // every 30s
}

console.log("🚀 MoneRakhbe Telegram Bot Poller & Reminder Alert Service is LIVE!");
pollUpdates();
triggerReminderWorker();
