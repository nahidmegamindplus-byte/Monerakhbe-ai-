require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let offset = 0;

async function processAllPendingUpdates() {
  console.log("Fetching and processing updates from Telegram...");
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}`);
  const data = await res.json();

  if (!data.ok || !data.result) {
    console.error("Failed to get updates:", data);
    return;
  }

  console.log(`Found ${data.result.length} pending updates.`);

  for (const update of data.result) {
    offset = update.update_id + 1;
    console.log(`Processing update ${update.update_id}:`, update.message?.text);

    try {
      const webhookRes = await fetch(`${appUrl}/api/telegram/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET || "monerakhbe_webhook_secret_key",
        },
        body: JSON.stringify(update),
      });

      const resJson = await webhookRes.json();
      console.log(`Webhook response for ${update.update_id}:`, resJson);
    } catch (err) {
      console.error(`Error forwarding update ${update.update_id}:`, err);
    }
  }

  // Acknowledge updates with Telegram
  await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}`);
  console.log("Updates acknowledged. Next offset:", offset);
}

processAllPendingUpdates().finally(() => prisma.$disconnect());
