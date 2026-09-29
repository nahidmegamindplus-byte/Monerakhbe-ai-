require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function check() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  console.log("\n--- TELEGRAM BOT CHECK ---");
  console.log("Token in .env:", token ? `${token.slice(0, 10)}...` : "None");

  if (!token) {
    console.log("❌ No Bot Token found.");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (data.ok) {
      console.log("✅ Telegram API Connection: SUCCESS");
      console.log(`🤖 Bot Name: ${data.result.first_name}`);
      console.log(`🔗 Bot Username: @${data.result.username}`);
      console.log(`🆔 Bot ID: ${data.result.id}`);
    } else {
      console.log("❌ Telegram API Error:", data.description);
    }
  } catch (err) {
    console.log("❌ Network Error connecting to Telegram API:", err.message);
  }

  console.log("\n--- DATABASE USER CONNECTION STATUS ---");
  const conns = await prisma.telegramConnection.findMany({
    include: { user: { select: { email: true, name: true } } },
  });

  if (conns.length === 0) {
    console.log("No user telegram connection records found.");
  } else {
    for (const c of conns) {
      console.log(`User: ${c.user.email} (${c.user.name})`);
      console.log(`Status: ${c.isConnected ? "CONNECTED ✅" : "NOT CONNECTED YET ⏳"}`);
      if (c.isConnected) {
        console.log(`Telegram User: @${c.username || "N/A"} (${c.firstName || "N/A"})`);
        console.log(`Chat ID: ${c.chatId}`);
      } else {
        console.log(`Pending Token: connect_${c.connectionToken}`);
      }
    }
  }
}

check().finally(() => prisma.$disconnect());
