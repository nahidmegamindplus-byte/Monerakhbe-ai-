require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

async function checkUpdates() {
  console.log("Checking getUpdates from Telegram...");
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = await res.json();
  console.log("Updates count:", data.result?.length || 0);
  console.log("Updates:", JSON.stringify(data.result, null, 2));
}

checkUpdates();
