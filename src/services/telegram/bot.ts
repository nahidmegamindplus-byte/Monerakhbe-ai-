import { formatFriendlyDate } from "@/lib/date-utils";
import { getReminderActionKeyboard, getFollowUpKeyboard } from "./keyboards";
import prisma from "@/lib/prisma";

export async function getTelegramBotToken(): Promise<string> {
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim()) {
    return process.env.TELEGRAM_BOT_TOKEN.trim();
  }
  try {
    const dbConfig = await prisma.paymentMethodConfig.findUnique({
      where: { code: "system_telegram_bot" },
    });
    if (dbConfig && dbConfig.accountNumber) {
      process.env.TELEGRAM_BOT_TOKEN = dbConfig.accountNumber;
      return dbConfig.accountNumber;
    }
  } catch (err) {
    // ignore
  }
  return "";
}

export async function sendTelegramMessage({
  chatId,
  text,
  replyMarkup,
  parseMode = "HTML",
}: {
  chatId: string | number;
  text: string;
  replyMarkup?: any;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}) {
  const token = await getTelegramBotToken();
  if (!token) {
    console.log(`[Telegram Mock Bot Output to ${chatId}]:\n${text}`);
    return { ok: true, mock: true };
  }

  const apiBase = `https://api.telegram.org/bot${token}`;

  try {
    const res = await fetch(`${apiBase}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    
    // If Telegram rejects due to HTML entity formatting errors, fallback to clean plain text
    if (!data.ok && parseMode && data.description?.includes("parse")) {
      console.warn(`[Telegram Send] HTML parse error: ${data.description}. Retrying with plain text fallback...`);
      const cleanText = text.replace(/<[^>]*>/g, ""); // strip HTML tags
      const fallbackRes = await fetch(`${apiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: cleanText,
          reply_markup: replyMarkup,
        }),
      });
      return await fallbackRes.json();
    }

    console.log(`[Telegram API sendMessage response to ${chatId}]:`, data);
    return data;
  } catch (error) {
    console.error("[Telegram Send Error]", error);
    return { ok: false, error };
  }
}

export async function sendTelegramMessageDirect(
  chatId: string | number,
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
) {
  return sendTelegramMessage({ chatId, text, parseMode });
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string) {
  const token = await getTelegramBotToken();
  if (!token) return { ok: true, mock: true };

  const apiBase = `https://api.telegram.org/bot${token}`;

  try {
    await fetch(`${apiBase}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || "গৃহীত হয়েছে!",
      }),
    });
  } catch (error) {
    console.error("[Telegram Callback Error]", error);
  }
}


export async function sendReminderTelegramAlert({
  chatId,
  reminder,
}: {
  chatId: string | number;
  reminder: { id: string; title: string; dueAt: Date; description?: string | null };
}) {
  const text = `🔔 <b>রিমাইন্ডার এলার্ট!</b>\n\n📌 <b>${reminder.title}</b>\n⏰ সময়: ${formatFriendlyDate(reminder.dueAt)}\n\n${reminder.description && reminder.description !== reminder.title ? `📝 ${reminder.description}\n\n` : ""}কাজটি কি সম্পন্ন হয়েছে?`;
  return sendTelegramMessage({
    chatId,
    text,
    replyMarkup: getReminderActionKeyboard(reminder.id),
  });
}

export async function sendOverdueTelegramFollowUp({
  chatId,
  reminder,
}: {
  chatId: string | number;
  reminder: { id: string; title: string; dueAt: Date };
}) {
  const text = `⚠️ <b>ফলো-আপ রিমাইন্ডার</b>\n\nআপনার <b>${reminder.title}</b> কাজটি এখনও সম্পূর্ণ হিসেবে চিহ্নিত করা হয়নি।\n\nকাজটি কি শেষ হয়েছে নাকি পরে মনে করিয়ে দেব?`;
  return sendTelegramMessage({
    chatId,
    text,
    replyMarkup: getFollowUpKeyboard(reminder.id),
  });
}

export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  const token = await getTelegramBotToken();
  if (!token) return null;

  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("[Telegram getFile Error]", fileData);
      return null;
    }

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    const res = await fetch(downloadUrl);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = filePath.split("/").pop() || "telegram_file.bin";
    const mimeType = res.headers.get("content-type") || "application/octet-stream";

    return { buffer, fileName, mimeType };
  } catch (err) {
    console.error("[Telegram Download Error]", err);
    return null;
  }
}



