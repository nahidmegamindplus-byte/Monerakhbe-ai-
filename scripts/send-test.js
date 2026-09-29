require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

async function sendTest() {
  console.log("Sending test message to Telegram user 1839701795...");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: 1839701795,
      text: "🤖 <b>MoneRakhbe AI বট এখন সম্পূর্ণ সক্রিয় ও প্রস্তুত!</b>\n\nআপনি আমাকে যেকোনো বার্তা পাঠাতে পারেন। যেমন:\n• <i>\"কাল সকাল ৯টায় মিটিং মনে করিয়ে দিও\"</i>\n• <i>\"১২ ডিসেম্বর ভাইয়ের জন্মদিন, মনে রেখো\"</i>",
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  console.log("Telegram sendMessage response:", data);
}

sendTest();
