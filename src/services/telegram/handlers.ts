import prisma from "@/lib/prisma";
import { TelegramWebhookUpdate } from "@/types";
import { sendTelegramMessage, answerTelegramCallbackQuery, downloadTelegramFile } from "./bot";
import { getQuickHelpKeyboard, getReminderActionKeyboard, getMultimodalConfirmationKeyboard, getConnectAccountKeyboard } from "./keyboards";
import { processUserMessage } from "@/services/ai";
import { processMemoryInput } from "@/services/ai/multimodal";
import { searchMemoriesAndAskAI } from "@/services/ai/semantic-search";
import { addHours, addDays } from "date-fns";
import { logAudit } from "@/lib/audit";
import { formatFriendlyDate } from "@/lib/date-utils";
export async function handleShowAllReminders(userId: string, chatId: string | number) {
  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { dueAt: "asc" },
  });

  if (reminders.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: "📋 <b>আপনার কোনো সক্রিয় রিমাইন্ডার নেই।</b>\n\nনতুন রিমাইন্ডার সেট করতে টেক্সট বা মুখে বলে ভয়েস নোট পাঠান, যেমন:\n<i>\"কাল বিকেল ৫টায় মিটিং মনে রেখো\"</i>",
      replyMarkup: getQuickHelpKeyboard(),
    });
    return;
  }

  const lines = reminders.map((r, i) => {
    const num = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"][i] || `${i + 1}`;
    const statusIcon = r.isSeen ? "👁️ দেখা হয়েছে" : "⏳ অপেক্ষমাণ";
    return `${num}️⃣ <b>${r.title}</b>\n   ⏰ <b>সময়:</b> ${formatFriendlyDate(r.dueAt)}\n   📌 <b>স্ট্যাটাস:</b> ${statusIcon}${r.categoryName ? ` | 🏷️ ${r.categoryName}` : ""}${r.description && r.description !== r.title ? `\n   📝 ${r.description}` : ""}`;
  });

  const messageText = `📋 <b>আপনার সব রিমাইন্ডারের তালিকা (${reminders.length}টি):</b>\n\n${lines.join("\n\n")}\n\n<i>যেকোনো কাজ শেষ হলে সংশ্লিষ্ট রিমাইন্ডারে রেসপন্স করুন অথবা 'Done' বলুন।</i>`;

  await sendTelegramMessage({
    chatId,
    text: messageText,
    replyMarkup: getQuickHelpKeyboard(),
  });
}

export async function handleShowTodayReminders(userId: string, chatId: string | number) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      deletedAt: null,
      dueAt: { gte: startOfToday, lte: endOfToday },
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { dueAt: "asc" },
  });

  if (reminders.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: "✨ <b>আজকের কোনো রিমাইন্ডার নেই!</b> 🎉\n\nআজকের জন্য আপনার কোনো পেন্ডিং শিডিউল নেই। সম্পূর্ণ দিন মুক্ত আছে!",
      replyMarkup: getQuickHelpKeyboard(),
    });
    return;
  }

  const lines = reminders.map((r, i) => {
    const num = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"][i] || `${i + 1}`;
    const timeStr = new Date(r.dueAt).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${num}️⃣ <b>${r.title}</b>\n   ⏰ সময়: <b>${timeStr}</b> (${formatFriendlyDate(r.dueAt)})\n   📌 অবস্থা: ${r.isSeen ? "👁️ দেখা হয়েছে" : "🔔 অ্যালার্ট বাকি"}${r.description && r.description !== r.title ? `\n   📝 ${r.description}` : ""}`;
  });

  const messageText = `📅 <b>আজকের রিমাইন্ডার সমূহ (${reminders.length}টি):</b>\n\n${lines.join("\n\n")}`;

  await sendTelegramMessage({
    chatId,
    text: messageText,
    replyMarkup: getQuickHelpKeyboard(),
  });
}

export async function handleShowTodayTasks(userId: string, chatId: string | number) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["TODO", "IN_PROGRESS"] },
      OR: [
        { dueDate: { gte: startOfToday, lte: endOfToday } },
        { dueDate: null },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (tasks.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: "📝 <b>আজকের কোনো কাজ (Tasks) তালিকাভুক্ত নেই!</b>\n\nনতুন কাজ যোগ করতে লিখুন, যেমন:\n<i>\"কাজ: অফিস প্রেজেন্টেশন তৈরি করা\"</i>",
      replyMarkup: getQuickHelpKeyboard(),
    });
    return;
  }

  const lines = tasks.map((t, i) => {
    const num = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"][i] || `${i + 1}`;
    const statusIcon = t.status === "IN_PROGRESS" ? "🔄 চলমান" : "⬜ বাকি";
    const prioIcon = t.priority === "HIGH" ? "🔥 High" : "📌 Normal";
    return `${num}️⃣ <b>${t.title}</b>\n   ${statusIcon} | প্রায়োরিটি: ${prioIcon} | ক্যাটাগরি: ${t.category}${t.description ? `\n   📝 ${t.description}` : ""}`;
  });

  const messageText = `📝 <b>আজকের সব কাজের তালিকা (${tasks.length}টি):</b>\n\n${lines.join("\n\n")}`;

  await sendTelegramMessage({
    chatId,
    text: messageText,
    replyMarkup: getQuickHelpKeyboard(),
  });
}

export async function handleShowMemories(userId: string, chatId: string | number) {
  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (memories.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: "🧠 আপনার কোনো সংরক্ষিত মেমোরি নেই। যেকোনো তথ্য মনে রাখতে আমাকে বলুন!",
      replyMarkup: getQuickHelpKeyboard(),
    });
    return;
  }

  const lines = memories.map((m, i) => `${i + 1}️⃣ <b>${m.key}:</b> ${m.value || m.summary || ""}`);
  await sendTelegramMessage({
    chatId,
    text: `🧠 <b>আপনার সাম্প্রতিক সংরক্ষিত মেমোরি:</b>\n\n${lines.join("\n\n")}`,
    replyMarkup: getQuickHelpKeyboard(),
  });
}

export async function handleTelegramUpdate(update: TelegramWebhookUpdate) {
  try {
    // 1. Handle Inline Keyboard Button Callbacks
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || "";
      const chatId = cq.message?.chat.id;
      const telegramUserId = String(cq.from.id);

      // Find User
      const conn = await prisma.telegramConnection.findFirst({
        where: { telegramUserId, isConnected: true },
        include: { user: true },
      });

      if (!conn) {
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: "⚠️ আপনার টেলিগ্রাম অ্যাকাউন্টটি MoneRakhbe AI এর সাথে কানেক্টেড নয়। নিচের বাটনে ক্লিক করে ওয়েবসাইট থেকে সহজে কানেক্ট করুন:",
            replyMarkup: getConnectAccountKeyboard(),
          });
        }
        return;
      }

      const [action, param1, param2, param3] = data.split(":");

      if (action === "cmd" && param1 === "help") {
        await answerTelegramCallbackQuery(cq.id);
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: `💡 <b>কীভাবে MoneRakhbe AI ব্যবহার করবেন?</b>\n\n• <b>টেক্সট রিমাইন্ডার:</b> "কাল ৫টায় রাকিবকে ফোন করতে হবে", "প্রতি শুক্রবার সকাল ১০টায় ব্যাকআপ নেওয়া"\n• <b>মেমোরি সেভ:</b> "আমার পাসপোর্ট নম্বর A12345678, মনে রেখো"\n• <b>ভয়েস মেসেজ:</b> মুখে বলে ভয়েস নোট পাঠিয়ে দিন\n• <b>ছবি ও ডকুমেন্ট:</b> প্রেসক্রিপশন, বিল বা পিডিএফ পাঠিয়ে দিন\n• <b>তথ্য খোঁজ:</b> "গত মাসে দেওয়া প্রেসক্রিপশনে কী ওষুধ ছিল?"`,
            replyMarkup: getQuickHelpKeyboard(),
          });
        }
        return;
      }

    // Multimodal confirmation actions (#87, #99, #100)
    if (action === "mm_action") {
      const subAction = param1; // save_only, create_rem, both, ignore
      const memoryId = param2;

      const memory = await prisma.memory.findUnique({
        where: { id: memoryId, userId: conn.userId },
      });

      if (!memory) {
        await answerTelegramCallbackQuery(cq.id, "মেমোরি খুঁজে পাওয়া যায়নি।");
        return;
      }

      if (subAction === "save_only") {
        await answerTelegramCallbackQuery(cq.id, "মেমোরি হিসেবে সেভ করা হয়েছে!");
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: `✅ <b>মেমোরি সংরক্ষণ করা হয়েছে!</b>\n\n📌 <b>${memory.key}</b>\n📁 ক্যাটাগরি: ${memory.category}\n\nপ্রয়োজনে যেকোনো সময় আমাকে এর ব্যাপারে জিজ্ঞাসা করতে পারেন।`,
          });
        }
        return;
      }

      if (subAction === "create_rem" || subAction === "both") {
        let structured: any = {};
        try {
          structured = JSON.parse(memory.structuredData || "{}");
        } catch {
          // fallback
        }

        const candidateDate = structured.date || null;
        let dueAt = addDays(new Date(), 1);
        if (candidateDate) {
          const [y, m, d] = candidateDate.split("-").map(Number);
          dueAt = new Date(y, m - 1, d);
        }
        if (structured.time) {
          const [h, min] = structured.time.split(":").map(Number);
          dueAt.setHours(h || 9, min || 0, 0, 0);
        } else {
          dueAt.setHours(17, 0, 0, 0);
        }

        const reminder = await prisma.reminder.create({
          data: {
            userId: conn.userId,
            title: structured.title || memory.key,
            description: memory.value || memory.summary,
            dueAt,
            timezone: conn.user.timezone || "Asia/Dhaka",
            status: "PENDING",
            priority: "NORMAL",
            categoryName: memory.category || "General",
          },
        });

        await prisma.memory.update({
          where: { id: memory.id },
          data: { reminderId: reminder.id },
        });

        await prisma.reminderNotification.create({
          data: {
            userId: conn.userId,
            reminderId: reminder.id,
            scheduledFor: dueAt,
            status: "PENDING",
            channel: "TELEGRAM",
            deduplicationKey: `${reminder.id}_at_time_${dueAt.getTime()}`,
          },
        });

        await answerTelegramCallbackQuery(cq.id, "রিমাইন্ডার তৈরি হয়েছে!");
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: `⚡ <b>রিমাইন্ডার সেট করা হয়েছে!</b>\n\n📌 <b>${reminder.title}</b>\n⏰ সময়: ${formatFriendlyDate(dueAt)}\n\nযথাসময়ে আপনাকে টেলিগ্রামে নোটিফিকেশন দেওয়া হবে।`,
          });
        }
        return;
      }

      if (subAction === "ignore") {
        await answerTelegramCallbackQuery(cq.id, "বাতিল করা হয়েছে।");
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: "❌ বাতিল করা হয়েছে।",
          });
        }
        return;
      }
    }

    if (action === "seen") {
      const reminderId = param1;
      await prisma.reminder.update({
        where: { id: reminderId, userId: conn.userId },
        data: {
          isSeen: true,
          seenAt: new Date(),
          status: "SEEN",
        },
      }).catch(() => null);

      await answerTelegramCallbackQuery(cq.id, "রিমাইন্ডারটি 'দেখেছি' চিহ্নিত করা হয়েছে!");
      if (chatId) {
        await sendTelegramMessage({
          chatId,
          text: "👁️ <b>ধন্যবাদ!</b> রিমাইন্ডারটি 'দেখেছি' হিসেবে চিহ্নিত করা হয়েছে। প্রতি ৫ মিনিটের নোটিফিকেশন বন্ধ করা হলো।",
          replyMarkup: getQuickHelpKeyboard(),
        });
      }
      return;
    }

    if (action === "done") {
      const reminderId = param1;
      await prisma.reminder.update({
        where: { id: reminderId, userId: conn.userId },
        data: {
          status: "COMPLETED",
          isSeen: true,
          seenAt: new Date(),
          completedAt: new Date(),
        },
      }).catch(() => null);
      await answerTelegramCallbackQuery(cq.id, "কাজটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে! 🎉");
      if (chatId) {
        await sendTelegramMessage({
          chatId,
          text: "✅ চমৎকার! কাজটি সম্পন্ন হয়েছে। 🎯",
          replyMarkup: getQuickHelpKeyboard(),
        });
      }
      return;
    }

    if (action === "snooze") {
      const duration = param1; // "10m", "1h", "3h", "tomorrow"
      const reminderId = param2;

      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId, userId: conn.userId },
      });

      if (reminder) {
        let newDueAt = new Date();
        if (duration === "10m") newDueAt = new Date(Date.now() + 10 * 60 * 1000);
        else if (duration === "1h") newDueAt = addHours(new Date(), 1);
        else if (duration === "3h") newDueAt = addHours(new Date(), 3);
        else if (duration === "tomorrow") newDueAt = addDays(new Date(), 1);

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            dueAt: newDueAt,
            status: "SNOOZED",
            isSeen: true,
            seenAt: new Date(),
          },
        });

        await prisma.reminderNotification.create({
          data: {
            userId: conn.userId,
            reminderId: reminder.id,
            scheduledFor: newDueAt,
            status: "PENDING",
            channel: "TELEGRAM",
            deduplicationKey: `${reminder.id}_snooze_${newDueAt.getTime()}`,
          },
        });

        await answerTelegramCallbackQuery(cq.id, `রিমাইন্ডার ${duration} এর জন্য স্নুজ করা হয়েছে!`);
        if (chatId) {
          await sendTelegramMessage({
            chatId,
            text: `⏳ ঠিক আছে, ${duration === "10m" ? "১০ মিনিট" : duration} পর আপনাকে আবার মনে করিয়ে দেওয়া হবে!`,
          });
        }
      }
      return;
    }

    if (action === "delete") {
      const reminderId = param1;
      await prisma.reminder.update({
        where: { id: reminderId, userId: conn.userId },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
      await answerTelegramCallbackQuery(cq.id, "রিমাইন্ডার মুছে ফেলা হয়েছে।");
      if (chatId) {
        await sendTelegramMessage({
          chatId,
          text: "🗑️ রিমাইন্ডারটি ডিলিট করা হয়েছে।",
        });
      }
      return;
    }

    if (action === "cmd") {
      const cmd = param1;
      await answerTelegramCallbackQuery(cq.id);
      if (chatId) {
        if (cmd === "all_reminders") {
          await handleShowAllReminders(conn.userId, chatId);
          return;
        }
        if (cmd === "today" || cmd === "today_reminders") {
          await handleShowTodayReminders(conn.userId, chatId);
          return;
        }
        if (cmd === "today_tasks") {
          await handleShowTodayTasks(conn.userId, chatId);
          return;
        }
        if (cmd === "memory") {
          await handleShowMemories(conn.userId, chatId);
          return;
        }
        let text = "সব রিমাইন্ডার দেখতে 'সব reminder দেখাও' বলুন অথবা আজকের কাজের জন্য 'আজকের কাজের list দেখাও' বলুন।";
        await sendTelegramMessage({ chatId, text, replyMarkup: getQuickHelpKeyboard() });
      }
      return;
    }
  }

  // 2. Handle Incoming Messages (Text, Voice, Photo, Document)
  if (update.message) {
    const msg = update.message as any;
    const chatId = msg.chat?.id;
    const telegramUserId = String(msg.from?.id);
    const firstName = msg.from?.first_name || "User";
    const username = msg.from?.username || null;
    const text = (msg.text || "").trim();
    const caption = (msg.caption || "").trim();

    // A. Check Deep-Link Account Connection: "/start connect_TOKEN"
    if (text.startsWith("/start connect_")) {
      const token = text.replace("/start connect_", "").trim();
      const connection = await prisma.telegramConnection.findFirst({
        where: {
          connectionToken: token,
        },
      });

      if (!connection) {
        await sendTelegramMessage({
          chatId,
          text: "❌ সংযোগের লিঙ্কটি সঠিক নয়। অনুগ্রহ করে MoneRakhbe AI ড্যাশবোর্ড থেকে নতুন লিংক দিয়ে চেষ্টা করুন।",
        });
        return;
      }

      await prisma.telegramConnection.update({
        where: { id: connection.id },
        data: {
          telegramUserId,
          chatId: String(chatId),
          username,
          firstName,
          isConnected: true,
          connectionToken: null,
          tokenExpiresAt: null,
          connectedAt: new Date(),
        },
      });

      await logAudit({
        userId: connection.userId,
        action: "TELEGRAM_CONNECTED",
        entityType: "TELEGRAM",
        details: { telegramUserId, username, firstName },
      });

      await sendTelegramMessage({
        chatId,
        text: `🎉 <b>অভিনন্দন ${firstName}!</b>\n\nআপনার Telegram সফলভাবে <b>MoneRakhbe AI</b> এর সাথে কানেক্ট হয়েছে।\n\nএখন থেকে আপনি আমাকে টেক্সট, ভয়েস মেসেজ, ছবি/স্ক্রিনশট বা যেকোনো ডকুমেন্ট পাঠাতে পারেন।\n\nযেমন:\n<i>"কাল বিকেল ৫টায় মিটিং আছে মনে করিয়ে দিও"</i>\n<i>"আমার ড্রাইভিং লাইসেন্স নম্বর B987654, মনে রেখো"</i>\n<i>🎤 ভয়েস নোট পাঠান</i>\n<i>📷 ছবি বা প্রেসক্রিপশন পাঠান</i>`,
        replyMarkup: getQuickHelpKeyboard(),
      });
      return;
    }

    // Connect via email if user sends "/connect email@..." or plain email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    if (emailMatch) {
      const targetEmail = emailMatch[1].toLowerCase();
      const matchedUser = await prisma.user.findUnique({
        where: { email: targetEmail },
      });

      if (matchedUser) {
        await prisma.telegramConnection.upsert({
          where: { userId: matchedUser.id },
          create: {
            userId: matchedUser.id,
            telegramUserId,
            chatId: String(chatId),
            username,
            firstName,
            isConnected: true,
            connectedAt: new Date(),
          },
          update: {
            telegramUserId,
            chatId: String(chatId),
            username,
            firstName,
            isConnected: true,
            connectedAt: new Date(),
          },
        });

        await sendTelegramMessage({
          chatId,
          text: `🎉 <b>অভিনন্দন ${firstName}!</b> (${targetEmail})\n\nআপনার Telegram সফলভাবে MoneRakhbe AI এর সাথে সংযুক্ত হয়েছে। এখন থেকে আপনি যা পাঠাবেন তা স্বয়ংক্রিয়ভাবে রেকর্ড ও প্রসেস হবে।`,
          replyMarkup: getQuickHelpKeyboard(),
        });
        return;
      }
    }

    if (text === "/start") {
      // Check if already connected
      let conn = await prisma.telegramConnection.findFirst({
        where: { telegramUserId, isConnected: true },
        include: { user: true },
      });

      if (!conn) {
        // Smart Auto-Link: If there's an existing user (e.g. single user or admin in db), auto link!
        const allUsers = await prisma.user.findMany({ take: 2 });
        if (allUsers.length === 1) {
          const autoUser = allUsers[0];
          await prisma.telegramConnection.upsert({
            where: { userId: autoUser.id },
            create: {
              userId: autoUser.id,
              telegramUserId,
              chatId: String(chatId),
              username,
              firstName,
              isConnected: true,
              connectedAt: new Date(),
            },
            update: {
              telegramUserId,
              chatId: String(chatId),
              username,
              firstName,
              isConnected: true,
              connectedAt: new Date(),
            },
          });

          await sendTelegramMessage({
            chatId,
            text: `👋 <b>স্বাগতম ${firstName}!</b>\n\nআপনার টেলিগ্রাম অ্যাকাউন্টটি MoneRakhbe AI (${autoUser.email})-এর সাথে স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে! 🚀\n\n📌 <b>আপনি যা মনে রাখতে চান, শুধু বলুন:</b>\n• "কাল ৫টায় রাকিবকে ফোন করতে হবে"\n• "আমার পাসপোর্ট নম্বর A123456, মনে রেখো"\n• 🎤 ভয়েস নোট বা ছবি পাঠাতে পারেন।`,
            replyMarkup: getQuickHelpKeyboard(),
          });
          return;
        }
      }

      await sendTelegramMessage({
        chatId,
        text: `👋 স্বাগতম! আমি <b>MoneRakhbe AI</b> — আপনার পার্সোনাল মেমোরি ও স্মার্ট রিমাইন্ডার সহকারী। 🤖\n\nটেলিগ্রাম থেকে সরাসরি ভয়েস, টেক্সট, ছবি ও ডকুমেন্টের মাধ্যমে রিমাইন্ডার সেভ করতে নিচের বাটনে ক্লিক করে অ্যাকাউন্ট কানেক্ট করুন অথবা আপনার রেজিস্টার্ড ইমেইলটি এখানে লিখে পাঠান:`,
        replyMarkup: getConnectAccountKeyboard(),
      });
      return;
    }

    if (text === "/help") {
      await sendTelegramMessage({
        chatId,
        text: `💡 <b>কীভাবে MoneRakhbe AI ব্যবহার করবেন?</b>\n\n• <b>টেক্সট:</b> "কাল ৫টায় রাকিবকে ফোন করতে হবে", "আমার passport expiry date ১৫ মে, মনে রেখো"\n• <b>ভয়েস:</b> ভয়েস রেকর্ড করে পাঠিয়ে দিন\n• <b>ছবি/স্ক্রিনশট:</b> প্রেসক্রিপশন, বিল, ভিজিটিং কার্ড বা টিকিট পাঠান\n• <b>ডকুমেন্ট/PDF:</b> বাসা ভাড়ার চুক্তি, পলিসি ফাইল পাঠান\n• <b>প্রশ্ন করুন:</b> "গত মাসে দেওয়া ডকুমেন্টে ভাড়া কত ছিল?" বা "ভাইয়ের জন্মদিন কবে?"`,
        replyMarkup: getQuickHelpKeyboard(),
      });
      return;
    }

    // Lookup Connected User
    let connection = await prisma.telegramConnection.findFirst({
      where: { telegramUserId, isConnected: true },
      include: { user: true },
    });

    // Fallback: If not connected yet, try auto-connecting to single user or admin user
    if (!connection) {
      const allUsers = await prisma.user.findMany({ take: 2 });
      if (allUsers.length === 1) {
        const singleUser = allUsers[0];
        connection = await prisma.telegramConnection.upsert({
          where: { userId: singleUser.id },
          create: {
            userId: singleUser.id,
            telegramUserId,
            chatId: String(chatId),
            username,
            firstName,
            isConnected: true,
            connectedAt: new Date(),
          },
          update: {
            telegramUserId,
            chatId: String(chatId),
            username,
            firstName,
            isConnected: true,
            connectedAt: new Date(),
          },
          include: { user: true },
        });
      }
    }

    if (!connection) {
      await sendTelegramMessage({
        chatId,
        text: `👋 হ্যালো ${firstName}! আমি আপনার মেসেজটি পেয়েছি।\n\n📌 আপনার রিমাইন্ডার এবং মেমোরি স্বয়ংক্রিয়ভাবে সংরক্ষণ করতে নিচের বাটনে ক্লিক করুন অথবা আপনার সাইটের ইমেইল ঠিকানাটি (যেমন: user@gmail.com) এখানে পাঠিয়ে দিন:`,
        replyMarkup: getConnectAccountKeyboard(),
      });
      return;
    }

    const userId = connection.userId;
    const userTimezone = connection.user.timezone || "Asia/Dhaka";

    // B. Handle Voice Message (#84, #85, #96)
    if (msg.voice || msg.audio) {
      const voiceObj = msg.voice || msg.audio;
      const fileId = voiceObj.file_id;

      await sendTelegramMessage({
        chatId,
        text: "🎧 <i>আপনার ভয়েস মেসেজ প্রসেস করা হচ্ছে...</i>",
      });

      const downloaded = await downloadTelegramFile(fileId);
      if (!downloaded) {
        await sendTelegramMessage({
          chatId,
          text: "❌ দুঃখিত, ভয়েস ফাইলটি ডাউনলোড করা যায়নি। আবার চেষ্টা করুন।",
        });
        return;
      }

      const mmResult = await processMemoryInput({
        userId,
        inputType: "voice",
        fileBuffer: downloaded.buffer,
        mimeType: downloaded.mimeType || "audio/ogg",
        fileName: downloaded.fileName || `voice_${Date.now()}.ogg`,
        channel: "TELEGRAM",
        userTimezone,
      });

      if (mmResult.needsConfirmation && mmResult.memory) {
        await sendTelegramMessage({
          chatId,
          text: mmResult.confirmationMessage || mmResult.message,
          replyMarkup: getMultimodalConfirmationKeyboard(mmResult.memory.id, "voice"),
        });
      } else {
        await sendTelegramMessage({
          chatId,
          text: mmResult.message,
        });
      }
      return;
    }

    // C. Handle Photo Message (#86, #87, #100, #101)
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      // Pick highest resolution photo
      const highestResPhoto = msg.photo[msg.photo.length - 1];
      const fileId = highestResPhoto.file_id;

      await sendTelegramMessage({
        chatId,
        text: "🔍 <i>আপনার ছবির লেখা ও তথ্য বিশ্লেষণ করা হচ্ছে...</i>",
      });

      const downloaded = await downloadTelegramFile(fileId);
      if (!downloaded) {
        await sendTelegramMessage({
          chatId,
          text: "❌ দুঃখিত, ছবিটি ডাউনলোড করা যায়নি। আবার চেষ্টা করুন।",
        });
        return;
      }

      // Check explicit caption intent (#101)
      const isExplicitReminder = /মনে করিয়ে দিও|remind me|notify me/i.test(caption);

      const mmResult = await processMemoryInput({
        userId,
        inputType: "image",
        fileBuffer: downloaded.buffer,
        mimeType: downloaded.mimeType || "image/jpeg",
        fileName: downloaded.fileName || `photo_${Date.now()}.jpg`,
        caption,
        channel: "TELEGRAM",
        userTimezone,
        autoCreateReminder: isExplicitReminder,
      });

      if (mmResult.needsConfirmation && mmResult.memory && !isExplicitReminder) {
        await sendTelegramMessage({
          chatId,
          text: mmResult.confirmationMessage || mmResult.message,
          replyMarkup: getMultimodalConfirmationKeyboard(mmResult.memory.id, "photo"),
        });
      } else {
        await sendTelegramMessage({
          chatId,
          text: mmResult.message,
        });
      }
      return;
    }

    // D. Handle Document / PDF Message (#88, #89, #100)
    if (msg.document) {
      const doc = msg.document;
      const fileId = doc.file_id;
      const docName = doc.file_name || "document.pdf";
      const docMime = doc.mime_type || "application/pdf";

      await sendTelegramMessage({
        chatId,
        text: `📄 <i>"${docName}" ডকুমেন্টটি বিশ্লেষণ ও ইনডেক্স করা হচ্ছে...</i>`,
      });

      const downloaded = await downloadTelegramFile(fileId);
      if (!downloaded) {
        await sendTelegramMessage({
          chatId,
          text: "❌ দুঃখিত, ডকুমেন্টটি ডাউনলোড করা যায়নি।",
        });
        return;
      }

      const mmResult = await processMemoryInput({
        userId,
        inputType: docMime === "application/pdf" ? "pdf" : "document",
        fileBuffer: downloaded.buffer,
        mimeType: docMime,
        fileName: docName,
        caption,
        channel: "TELEGRAM",
        userTimezone,
      });

      await sendTelegramMessage({
        chatId,
        text: mmResult.message,
      });
      return;
    }

    // E. Handle Natural Language Text Questions or Commands
    if (text) {
      const normalizedText = text.trim();
      const lowerText = normalizedText.toLowerCase();

      // 1. User command: "সব reminder দেখাও" (#Requirement 1)
      const isAllRemindersQuery =
        lowerText === "সব reminder দেখাও" ||
        lowerText === "সব reminder" ||
        lowerText === "সব রিমাইন্ডার দেখাও" ||
        lowerText === "সব রিমাইন্ডার" ||
        lowerText === "সকল reminder দেখাও" ||
        lowerText === "সকল রিমাইন্ডার দেখাও" ||
        lowerText === "আমার সব reminder দেখাও" ||
        lowerText === "আমার সব reminder" ||
        lowerText === "আমার সব রিমাইন্ডার দেখাও" ||
        lowerText === "আমার সব রিমাইন্ডার" ||
        lowerText === "all reminders" ||
        lowerText === "all reminder" ||
        lowerText === "/all_reminders" ||
        lowerText === "/reminders" ||
        /^(সব|সকল|আমার সব|সমস্ত)\s+(রিমাইন্ডার|reminder|reminders)(\s+দেখাও|\s+লিস্ট|\s+তালিকা)?$/i.test(normalizedText);

      if (isAllRemindersQuery) {
        await handleShowAllReminders(userId, chatId);
        return;
      }

      // 2. User command: "আজকের reminder দেখাও" (#Requirement 2)
      const isTodayRemindersQuery =
        lowerText === "আজকের reminder দেখাও" ||
        lowerText === "আজকের reminder" ||
        lowerText === "আজকের রিমাইন্ডার দেখাও" ||
        lowerText === "আজকের রিমাইন্ডার" ||
        lowerText === "আজকে কি reminder আছে" ||
        lowerText === "আজকে কি রিমাইন্ডার আছে" ||
        lowerText === "আজকেরগুলো দেখাও" ||
        lowerText === "আজকের গুলো দেখাও" ||
        lowerText === "today reminder" ||
        lowerText === "today reminders" ||
        lowerText === "today's reminders" ||
        lowerText === "/today" ||
        lowerText === "/today_reminders" ||
        /^(আজকের|আজকে কি|আজকের সব)\s+(রিমাইন্ডার|reminder|reminders)(\s+দেখাও|\s+আছে|\s+লিস্ট)?$/i.test(normalizedText);

      if (isTodayRemindersQuery) {
        await handleShowTodayReminders(userId, chatId);
        return;
      }

      // 3. User command: "আজকের কাজের list দেখাও" (#Requirement 3)
      const isTodayTasksQuery =
        lowerText === "আজকের কাজের list দেখাও" ||
        lowerText === "আজকের কাজের লিস্ট দেখাও" ||
        lowerText === "আজকের কাজের তালিকা দেখাও" ||
        lowerText === "আজকের কাজের list" ||
        lowerText === "আজকের কাজের লিস্ট" ||
        lowerText === "আজকের কাজের তালিকা" ||
        lowerText === "আজকের কাজ দেখাও" ||
        lowerText === "আজকের কাজ" ||
        lowerText === "আজকের কাজগুলো" ||
        lowerText === "আজকের সব কাজ দেখাও" ||
        lowerText === "কাজের list দেখাও" ||
        lowerText === "কাজের লিস্ট দেখাও" ||
        lowerText === "কাজের তালিকা দেখাও" ||
        lowerText === "today tasks" ||
        lowerText === "today's tasks" ||
        lowerText === "today task list" ||
        lowerText === "/tasks" ||
        lowerText === "/today_tasks" ||
        /^(আজকের|আজকে কি|আজকের সব)\s+(কাজের|কাজ|কাজের তালিকা|কাজের লিস্ট|কাজের list)(\s+দেখাও|\s+লিস্ট|\s+list|\s+তালিকা)?$/i.test(normalizedText) ||
        /^(কাজের\s+(list|লিস্ট|তালিকা)(\s+দেখাও)?)$/i.test(normalizedText);

      if (isTodayTasksQuery) {
        await handleShowTodayTasks(userId, chatId);
        return;
      }

      // 4. Seen / Read Acknowledgment text (to stop 5-minute repeating alerts)
      const isSeenAck =
        lowerText === "দেখেছি" ||
        lowerText === "seen" ||
        lowerText === "দেখা শেষ" ||
        lowerText === "দেখা হয়েছে" ||
        lowerText === "রিমাইন্ডার দেখেছি" ||
        lowerText === "মেসেজ দেখেছি" ||
        lowerText === "বুঝেছি" ||
        lowerText === "ok" ||
        lowerText === "পাইছি" ||
        lowerText === "পেয়েছি" ||
        lowerText === "নোটিফিকেশন বন্ধ করো" ||
        lowerText === "বন্ধ করো";

      if (isSeenAck) {
        const latestUnseen = await prisma.reminder.findFirst({
          where: {
            userId,
            isSeen: false,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
            deletedAt: null,
            dueAt: { lte: new Date() },
          },
          orderBy: { dueAt: "desc" },
        });

        if (latestUnseen) {
          await prisma.reminder.update({
            where: { id: latestUnseen.id },
            data: {
              isSeen: true,
              seenAt: new Date(),
              status: "SEEN",
            },
          });

          await sendTelegramMessage({
            chatId,
            text: `👁️ <b>রিমাইন্ডারটি 'দেখেছি' হিসেবে চিহ্নিত করা হয়েছে!</b>\n\n📌 <b>${latestUnseen.title}</b>\n\nপ্রতি ৫ মিনিটের পুনরাবৃত্তি নোটিফিকেশন বন্ধ করা হয়েছে। কাজটি শেষ হলে 'Done' লিখে জানাতে পারেন।`,
            replyMarkup: getQuickHelpKeyboard(),
          });
          return;
        }
      }

      // Check if user is asking about previous memories/documents (#89, #110)
      const isQuestionOrDocSearch =
        text.includes("?") ||
        text.includes("কত ছিল") ||
        text.includes("কবে") ||
        text.includes("কোথায়") ||
        text.includes("কী বলেছিলাম") ||
        text.includes("document") ||
        text.includes("পলিসি") ||
        text.includes("rent") ||
        text.includes("insurance");

      if (isQuestionOrDocSearch) {
        const searchResult = await searchMemoriesAndAskAI({ userId, query: text });
        let reply = searchResult.answer;

        if (searchResult.sourceAttachments && searchResult.sourceAttachments.length > 0) {
          const topAtt = searchResult.sourceAttachments[0];
          reply += `\n\n📎 <i>উৎস ফাইল: ${topAtt.fileName}</i>`;
        }

        await sendTelegramMessage({
          chatId,
          text: reply,
        });
        return;
      }

        // Process standard reminder/memory/task NLP
        try {
          const aiResponse = await processUserMessage({
            userId,
            message: text,
            channel: "TELEGRAM",
            userTimezone,
          });

          await sendTelegramMessage({
            chatId,
            text: aiResponse.message,
          });
        } catch (nlpErr: any) {
          console.error("[Telegram NLP Processing Error]", nlpErr);
          await sendTelegramMessage({
            chatId,
            text: "✅ আপনার বার্তাটি গৃহীত হয়েছে। আমি এটি সিস্টেমে প্রসেস করে রাখছি।",
          });
        }
      }
    }
  } catch (globalErr: any) {
    console.error("[Telegram Global Update Handler Error]", globalErr);
    const fallbackChatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (fallbackChatId) {
      await sendTelegramMessage({
        chatId: fallbackChatId,
        text: "⚠️ সাময়িক ত্রুটি হয়েছে, তবে আপনার রিকোয়েস্টটি গৃহীত হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
      }).catch(() => null);
    }
  }
}

