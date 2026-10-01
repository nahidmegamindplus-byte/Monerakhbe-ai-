import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendTelegramMessage, getTelegramBotToken } from "@/services/telegram/bot";
import { autoSyncTelegramWebhook } from "@/services/telegram/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    autoSyncTelegramWebhook(req).catch(() => {});
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
        { error: "টেলিগ্রাম বট টোকেন পাওয়া যায়নি। দয়া করে আগে বটের টোকেন দিয়ে কানেক্ট করুন।" },
        { status: 400 }
      );
    }

    // 1. Verify Bot API Token with Telegram API
    const getMeRes = await fetch(`https://api.telegram.org/bot${customToken}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "বট টোকেনটি সঠিক নয়: " + (getMeData.description || ""),
          telegramError: getMeData.description,
        },
        { status: 400 }
      );
    }

    const botInfo = getMeData.result;

    // 2. Lookup existing connected Telegram account for this user
    let connection = await prisma.telegramConnection.findFirst({
      where: { userId: session.id },
    });

    let targetChatId = connection?.chatId ? String(connection.chatId).trim() : "";

    // 3. Smart Auto-Discovery: Check recent updates from Telegram to automatically grab chat ID
    if (!targetChatId) {
      try {
        const updatesRes = await fetch(`https://api.telegram.org/bot${customToken}/getUpdates?limit=20`);
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
                username: fromUser?.username || botInfo.username,
                firstName: fromUser?.first_name || session.name,
                isConnected: true,
                connectedAt: new Date(),
              },
              update: {
                telegramUserId: String(fromUser?.id || targetChatId),
                chatId: targetChatId,
                username: fromUser?.username || connection?.username || botInfo.username,
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

    // 4. If still no Chat ID found:
    if (!targetChatId) {
      return NextResponse.json(
        {
          success: false,
          botValid: true,
          botName: botInfo.first_name,
          botUsername: botInfo.username,
          messageSent: false,
          needsStart: true,
          error: `বট (@${botInfo.username}) সংযুক্ত রয়েছে! কিন্তু টেস্ট মেসেজটি ফোনে পেতে টেলিগ্রাম অ্যাপে @${botInfo.username} বটে গিয়ে শুধু একবার 'START' বাটনে চাপ দিন, তারপর এখানে 'টেস্ট মেসেজ পাঠান' বাটনে ১-ক্লিক করুন।`,
          deepLink: `https://t.me/${botInfo.username}`,
        },
        { status: 400 }
      );
    }

    // 5. Send Live Test Message to Telegram
    const testText = `🔔 <b>MoneRakhbe AI — টেস্ট নোটিফিকেশন</b>\n\n✅ অভিনন্দন <b>${session.name || "ইউজার"}</b>!\nআপনার টেলিগ্রাম বট সফলভাবে কানেক্ট হয়েছে এবং ১-ক্লিক টেস্ট মেসেজ সফলভাবে পৌঁছেছে।\n\n📌 <i>এখন থেকে আপনি আমাকে যেকোনো কাজের কথা, মিটিংয়ের রিমাইন্ডার, মেমোরি নোট, ছবি বা ভয়েস রেকর্ড পাঠাতে পারেন। আমি স্বয়ংক্রিয়ভাবে মনে রাখব!</i>\n\n⏰ টেস্ট টাইম: ${new Date().toLocaleTimeString("bn-BD")}`;

    let messageResult = await sendTelegramMessage({
      chatId: targetChatId,
      text: testText,
    });

    // If initial delivery failed, try auto-discovering the latest active chat from Telegram updates
    if (!messageResult || !messageResult.ok) {
      try {
        const updatesRes = await fetch(`https://api.telegram.org/bot${customToken}/getUpdates?limit=20`);
        const updatesData = await updatesRes.json();
        if (updatesData.ok && Array.isArray(updatesData.result) && updatesData.result.length > 0) {
          const latestMsg = [...updatesData.result].reverse().find((u: any) => u.message?.chat?.id);
          if (latestMsg && latestMsg.message) {
            const freshChatId = String(latestMsg.message.chat.id);
            const freshUser = latestMsg.message.from;
            if (freshChatId !== targetChatId) {
              targetChatId = freshChatId;
              messageResult = await sendTelegramMessage({
                chatId: targetChatId,
                text: testText,
              });
              if (connection) {
                await prisma.telegramConnection.update({
                  where: { id: connection.id },
                  data: {
                    chatId: targetChatId,
                    telegramUserId: String(freshUser?.id || targetChatId),
                    username: freshUser?.username || connection.username,
                    firstName: freshUser?.first_name || connection.firstName,
                    isConnected: true,
                    connectedAt: new Date(),
                  },
                }).catch(() => {});
              }
            }
          }
        }
      } catch (recoveryErr) {
        console.warn("[Telegram Auto-Recovery Error]", recoveryErr);
      }
    }

    if (!messageResult || !messageResult.ok) {
      const desc = messageResult?.description || "চ্যাট খুঁজে পাওয়া যায়নি";
      return NextResponse.json(
        {
          success: false,
          botValid: true,
          botUsername: botInfo.username,
          messageSent: false,
          error: `মেসেজ ডেলিভারি ব্যর্থ হয়েছে (${desc})। টেলিগ্রামের নিয়মানুযায়ী কোনো বট প্রথমে নিজে থেকে মেসেজ পাঠাতে পারে না—অনুগ্রহ করে টেলিগ্রামে @${botInfo.username} বটে গিয়ে একবার 'START' দিন।`,
          telegramError: desc,
          deepLink: `https://t.me/${botInfo.username}`,
        },
        { status: 400 }
      );
    }

    // Ensure connection is marked as connected with targetChatId
    if (connection && (!connection.isConnected || connection.chatId !== targetChatId)) {
      await prisma.telegramConnection.update({
        where: { id: connection.id },
        data: {
          chatId: targetChatId,
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
