import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendTelegramMessage, getTelegramBotToken } from "@/services/telegram/bot";
import { startTelegramAutoPoller } from "@/services/telegram/poller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    startTelegramAutoPoller();
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let customToken = (body.token || "").trim();
    if (!customToken) {
      customToken = await getTelegramBotToken();
    }

    if (!customToken) {
      return NextResponse.json(
        { error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে আগে বটের টোকেন দিয়ে সেভ করুন।" },
        { status: 400 }
      );
    }

    // 1. Test Bot API Token validity with Telegram API
    const getMeRes = await fetch(`https://api.telegram.org/bot${customToken}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "বট টোকেনটি সঠিক নয় বা Telegram API এর সাথে কানেক্ট করা যায়নি: " + (getMeData.description || ""),
          telegramError: getMeData.description,
        },
        { status: 400 }
      );
    }

    const botInfo = getMeData.result;

    // 2. Lookup existing connected Telegram account
    let connection = await prisma.telegramConnection.findFirst({
      where: { userId: session.id },
    });

    let targetChatId = (body.chatId ? String(body.chatId).trim() : "") || (connection?.isConnected && connection?.chatId ? connection.chatId : "");

    // 3. Smart Auto-Discovery: If no Chat ID, check recent Telegram updates to find who messaged the bot
    if (!targetChatId) {
      try {
        const updatesRes = await fetch(`https://api.telegram.org/bot${customToken}/getUpdates?limit=10`);
        const updatesData = await updatesRes.json();
        if (updatesData.ok && Array.isArray(updatesData.result) && updatesData.result.length > 0) {
          const latestMsg = [...updatesData.result].reverse().find((u: any) => u.message?.chat?.id);
          if (latestMsg && latestMsg.message) {
            targetChatId = String(latestMsg.message.chat.id);
            const fromUser = latestMsg.message.from;

            // Auto-link this chat to current user
            connection = await prisma.telegramConnection.upsert({
              where: { userId: session.id },
              create: {
                userId: session.id,
                telegramUserId: String(fromUser?.id || targetChatId),
                chatId: targetChatId,
                username: fromUser?.username || null,
                firstName: fromUser?.first_name || session.name,
                isConnected: true,
                connectedAt: new Date(),
              },
              update: {
                telegramUserId: String(fromUser?.id || targetChatId),
                chatId: targetChatId,
                username: fromUser?.username || connection?.username || null,
                firstName: fromUser?.first_name || connection?.firstName || session.name,
                isConnected: true,
                connectedAt: new Date(),
              },
            });
          }
        }
      } catch (pollErr) {
        console.warn("[Telegram Auto-Discover Updates Warn]", pollErr);
      }
    }

    // 4. If still no Chat ID, advise user with clear instructions
    if (!targetChatId) {
      return NextResponse.json(
        {
          success: false,
          botValid: true,
          botName: botInfo.first_name,
          botUsername: botInfo.username,
          userConnected: false,
          messageSent: false,
          error: `আপনার টেলিগ্রাম অ্যাকাউন্ট এখনও কানেক্ট করা হয়নি। টেলিগ্রাম অ্যাপে @${botInfo.username} বটে গিয়ে 'START' বাটনে চাপ দিন অথবা নিচে আপনার Telegram Chat ID লিখে টেস্ট বাটনে ক্লিক করুন।`,
          deepLink: `https://t.me/${botInfo.username}?start=connect_${connection?.connectionToken || session.id.slice(0, 12)}`,
        },
        { status: 400 }
      );
    }

    // 5. Send Live Test Message to Telegram
    const testText = `🔔 <b>MoneRakhbe AI — টেস্ট নোটিফিকেশন</b>\n\n✅ অভিনন্দন <b>${session.name || "ইউজার"}</b>!\nআপনার টেলিগ্রাম বট সফলভাবে কানেক্ট হয়েছে এবং টেস্ট মেসেজ সফলভাবে এসেছে।\n\n📌 <i>এখন থেকে আপনি আমাকে যেকোনো কাজের কথা, মিটিংয়ের রিমাইন্ডার, মেমোরি নোট, ছবি বা ভয়েস রেকর্ড পাঠাতে পারেন। আমি স্বয়ংক্রিয়ভাবে মনে রাখব!</i>\n\n⏰ টেস্ট টাইম: ${new Date().toLocaleTimeString("bn-BD")}`;

    const messageResult = await sendTelegramMessage({
      chatId: targetChatId,
      text: testText,
    });

    if (!messageResult || !messageResult.ok) {
      const desc = messageResult?.description || "চ্যাট খুঁজে পাওয়া যায়নি";
      return NextResponse.json(
        {
          success: false,
          botValid: true,
          botUsername: botInfo.username,
          messageSent: false,
          error: `মেসেজ ডেলিভারি ব্যর্থ হয়েছে (${desc})। টেলিগ্রামের নিয়মানুযায়ী কোনো বট প্রথমে নিজে থেকে মেসেজ পাঠাতে পারে না—অনুগ্রহ করে আগে টেলিগ্রামে @${botInfo.username} বটে গিয়ে একবার 'START' দিন।`,
          telegramError: desc,
        },
        { status: 400 }
      );
    }

    // Ensure connection is marked as connected if test message succeeded
    if (connection && (!connection.isConnected || connection.chatId !== targetChatId)) {
      await prisma.telegramConnection.update({
        where: { id: connection.id },
        data: {
          chatId: targetChatId,
          isConnected: true,
          connectedAt: new Date(),
        },
      });
    } else if (!connection) {
      await prisma.telegramConnection.create({
        data: {
          userId: session.id,
          chatId: targetChatId,
          telegramUserId: targetChatId,
          isConnected: true,
          connectedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      botValid: true,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
      userConnected: true,
      messageSent: true,
      chatId: targetChatId,
      message: `🎉 টেস্ট মেসেজ সফল! @${botInfo.username} থেকে আপনার টেলিগ্রামে একটি টেস্ট নোটিফিকেশন পাঠানো হয়েছে। টেলিগ্রাম অ্যাপটি দেখুন!`,
    });
  } catch (err: any) {
    console.error("[Telegram Test Route Error]", err);
    return NextResponse.json({ error: "টেস্ট করতে সমস্যা হয়েছে: " + err.message }, { status: 500 });
  }
}
