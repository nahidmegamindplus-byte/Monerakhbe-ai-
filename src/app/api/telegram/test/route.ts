import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendTelegramMessage } from "@/services/telegram/bot";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const customToken = body.token || process.env.TELEGRAM_BOT_TOKEN;

    if (!customToken) {
      return NextResponse.json({ error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি।" }, { status: 400 });
    }

    // 1. Test Bot API Token
    const getMeRes = await fetch(`https://api.telegram.org/bot${customToken}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json({
        success: false,
        error: "বট টোকেনটি সঠিক নয় বা Telegram API এর সাথে কানেক্ট করা যায়নি।",
        telegramError: getMeData.description,
      }, { status: 400 });
    }

    const botInfo = getMeData.result;

    // 2. Check if the current user has a connected Telegram account
    const connection = await prisma.telegramConnection.findFirst({
      where: { userId: session.id, isConnected: true },
    });

    let messageSent = false;
    let messageResult = null;

    if (connection && connection.chatId) {
      const testText = `🔔 <b>MoneRakhbe AI — টেস্ট নোটিফিকেশন</b>\n\n✅ অভিনন্দন <b>${session.name || "ইউজার"}</b>! আপনার টেলিগ্রাম বট সফলভাবে কানেক্ট হয়েছে এবং প্রস্তুত রয়েছে।\n\n📌 <i>আপনি এখন আমাকে যেকোনো টেক্সট, ভয়েস নোট বা ছবি পাঠিয়ে রিমাইন্ডার ও মেমোরি সেট করতে পারেন।</i>\n\n⏰ টেস্ট টাইম: ${new Date().toLocaleTimeString("bn-BD")}`;

      messageResult = await sendTelegramMessage({
        chatId: connection.chatId,
        text: testText,
      });

      messageSent = messageResult?.ok || false;
    }

    return NextResponse.json({
      success: true,
      botValid: true,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
      userConnected: Boolean(connection?.isConnected),
      messageSent,
      message: messageSent
        ? `টেস্ট সফল! @${botInfo.username} থেকে আপনার টেলিগ্রামে একটি টেস্ট মেসেজ পাঠানো হয়েছে। 🎉`
        : connection?.isConnected
        ? `বট সক্রিয় (@${botInfo.username})! কিন্তু টেলিগ্রামে টেস্ট মেসেজ পাঠাতে সমস্যা হয়েছে।`
        : `বট (@${botInfo.username}) সক্রিয় ও তৈরি! নিচে 'Connect Telegram Now' বাটনে ক্লিক করে একাউন্ট লিঙ্ক করুন।`,
    });
  } catch (err: any) {
    console.error("[Telegram Test Route Error]", err);
    return NextResponse.json({ error: "টেস্ট করতে সমস্যা হয়েছে: " + err.message }, { status: 500 });
  }
}
