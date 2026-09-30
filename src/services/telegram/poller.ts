import { handleTelegramUpdate } from "./handlers";
import { getTelegramBotToken } from "./bot";

let isPollerRunning = false;
let lastUpdateOffset = 0;
let consecutiveErrors = 0;

/**
 * Universal Auto-Poller for Telegram Bot
 * Fetches updates directly from Telegram API when Webhook is not active or when running locally.
 */
export function startTelegramAutoPoller() {
  if (isPollerRunning) return;
  isPollerRunning = true;

  console.log("🤖 [MoneRakhbe Telegram Bot Poller] Started in background...");

  const runLoop = async () => {
    try {
      const token = await getTelegramBotToken();
      if (!token) {
        setTimeout(runLoop, 3000);
        return;
      }

      const base = `https://api.telegram.org/bot${token}`;
      const url = `${base}/getUpdates?offset=${lastUpdateOffset}&timeout=10`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        consecutiveErrors = 0;
        for (const update of data.result) {
          lastUpdateOffset = update.update_id + 1;
          console.log(`📥 [Telegram Inbound Update ${update.update_id}] Received. Processing...`);

          try {
            await handleTelegramUpdate(update);
            console.log(`✅ [Telegram Update ${update.update_id}] Processed and responded successfully.`);
          } catch (handlerErr: any) {
            console.error(`❌ [Telegram Update ${update.update_id} Handler Error]`, handlerErr);
          }
        }
      } else if (data.description?.includes("webhook is active") || data.error_code === 409) {
        // Webhook is active on a live domain, sleep longer to avoid hammering Telegram
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        consecutiveErrors++;
        if (consecutiveErrors > 5) {
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    } catch (err: any) {
      // Network or timeout glitch
      await new Promise((r) => setTimeout(r, 2000));
    }

    setTimeout(runLoop, 400);
  };

  runLoop();
}
