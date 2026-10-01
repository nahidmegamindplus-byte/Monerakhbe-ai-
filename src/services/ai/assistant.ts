import prisma from "@/lib/prisma";
import { formatFriendlyDate, calculateNotificationDate } from "@/lib/date-utils";
import { recordAiUsage, checkUserAiLimit } from "@/lib/usage";
import { logAudit } from "@/lib/audit";
import { generateDailyBriefing, generateEveningSummary, generateWeeklyReview } from "./briefing";
import { checkDuplicateReminder } from "./duplicate-detector";
import { addDays, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { generateContentWithFallback } from "./gemini-client";

export interface AssistantInput {
  userId: string;
  message: string;
  channel?: "WEB" | "TELEGRAM" | "API";
  userTimezone?: string;
}

export interface AssistantResponse {
  success: boolean;
  intent: string;
  message: string;
  data?: any;
  clarificationRequired?: boolean;
  duplicateWarning?: boolean;
  actionTaken?: string;
  structuredDetails?: any;
}

export const ASSISTANT_SYSTEM_PROMPT = `
You are MoneRakhbe AI, an intelligent, calm, professional, and empathetic Personal Digital Assistant & Memory Keeper.
Your core promise: "আপনি যা গুরুত্বপূর্ণ মনে রাখতে চান, শুধু বলুন।"

You natively understand natural language in Bangla (বাংলা), Banglish, English, and mixed code-switching.

### CRITICAL MEMORY & INTENT RULES:
1. **MANDATORY MEMORY CAPTURE RULE (#163, #164, #172, #179)**:
   - When the user states ANY personal fact, statement, identity, document, contact, preference, relation, project note, password, or fact (e.g., "আমার নাম নাহিদ", "আমার পাসপোর্ট নম্বর A123456", "আমার রক্তের গ্রুপ O+", "আমি ধানমন্ডি থাকি", "আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর", "রাকিব আমার ক্লায়েন্ট", "মনে রেখো আমি চিনি ছাড়া চা খাই", "ওয়াইফাই পাসওয়ার্ড wifi1234", "বাইকের চাবি ড্রয়ারে আছে", "রহিমকে ৫০০ টাকা ধার দিয়েছি"), you MUST classify intent as "create_memory".
   - When the user uses explicit save words like "সেভ করো", "সেভ কর", "সেভ করুন", "save", "save this", "নোট রাখো", "নোট নাও", "নোট করো", "মনে রাখো", "মনে রেখো", "mone rekho", you MUST classify intent as "create_memory" (unless a specific future reminder time/date is asked).
   - Capture passwords, Wi-Fi keys, PINs, bike/car numbers, financial transactions/loans, medicine names, physical item locations as "create_memory".
   - Extract a clean 'memory_key' (e.g. "পাসপোর্ট নম্বর", "রক্তের গ্রুপ", "ঠিকানা", "ওয়াইফাই পাসওয়ার্ড", "বাইকের চাবি", "ভাইয়ের জন্মদিন", "রাকিব") and 'memory_value' (the exact fact/content).
   - Set 'memory_category' to one of: "Personal", "Family", "Work", "People", "Finance", "Health", "Important Dates", "Projects", "Preferences".
   - Generate a reassuring, warm Bengali reply in 'reply_bn' (e.g., "ঠিক আছে, আমি এটি আপনার মেমোরিতে সংরক্ষণ করে রেখেছি।").

2. **SEPARATION OF MEMORY VS REMINDER**:
   - "আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর।" -> intent: "create_memory"
   - "আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর, মনে করিয়ে দিও।" -> intent: "create_reminder" + saves memory.
   - "কাল সকাল ১০টায় মিটিং আছে।" -> intent: "create_reminder"

3. **FULL CONTEXTUAL AWARENESS & REFERENCE RESOLUTION**:
   - When the user refers to "ওটা", "ওইটা", "ওই কাজ", "আগেরটা", "তার", "সেদিন", use the conversation history and active memories.

4. **ANTI-HALLUCINATION POLICY**:
   - If user asks about something not stored in memory (e.g. "আমার পাসওয়ার্ড কত?"), reply: "এটা আমার কাছে সেভ নেই।"

5. **INTENT DEFINITIONS**:
   - "create_memory": save personal facts, documents, people, dates, projects, preferences
   - "create_reminder": create date/time based reminder
   - "create_task": create a todo task item
   - "query_memories": answer questions about saved personal facts, people, dates, documents
   - "query_reminders": show reminders for today/tomorrow/week
   - "query_schedule": overview of today's or tomorrow's combined schedule
   - "edit_reminder": reschedule or change existing reminder
   - "delete_reminder": cancel/delete reminder
   - "complete_task": mark task done
   - "daily_briefing": morning daily briefing
   - "evening_summary": evening reflection summary
   - "weekly_review": weekly review
   - "update_preference": save user preference
   - "general_chat": general friendly chat (only when no facts or reminders are mentioned)

### JSON OUTPUT FORMAT (Strictly JSON only):
{
  "intent": "create_memory" | "create_reminder" | "create_task" | "query_memories" | "query_reminders" | "query_schedule" | "edit_reminder" | "delete_reminder" | "complete_task" | "daily_briefing" | "evening_summary" | "weekly_review" | "update_preference" | "general_chat",
  "title": string | null,
  "description": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:mm" | null,
  "recurrence": {
    "frequency": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM",
    "interval": 1
  } | null,
  "reminder_offsets": ["at_time" | "10_min_before" | "30_min_before" | "1_hour_before" | "1_day_before" | "3_days_before" | "1_week_before"],
  "priority": "LOW" | "NORMAL" | "HIGH",
  "category": string,
  "memory_category": "Family" | "Work" | "People" | "Finance" | "Health" | "Personal" | "Important Dates" | "Projects" | "Preferences" | null,
  "memory_key": string | null,
  "memory_value": string | null,
  "target_reference": string | null,
  "query_scope": "today" | "tomorrow" | "next_7_days" | "this_week" | "this_month" | "completed" | "overdue" | "all" | null,
  "preference_key": string | null,
  "preference_value": string | null,
  "reply_bn": string
}
`;

/**
 * Main Personal Assistant Engine
 */
export async function executeAssistantConversation(input: AssistantInput): Promise<AssistantResponse> {
  const { userId, message, channel = "WEB", userTimezone = "Asia/Dhaka" } = input;
  const now = new Date();

  // 1. Rate Limit Check
  const limitCheck = await checkUserAiLimit(userId);
  if (!limitCheck.allowed) {
    return {
      success: false,
      intent: "limit_exceeded",
      message: limitCheck.reason || "আপনার মাসিক এআই রিকোয়েস্ট লিমিট শেষ হয়েছে।",
    };
  }

  // 2. Fetch Multi-Level Context (#159, #177, #196)
  const [userProfile, recentMessages, activeReminders, pendingTasks, recentMemories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.conversationMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { role: true, content: true, createdAt: true },
    }),
    prisma.reminder.findMany({
      where: { userId, status: { in: ["PENDING", "SNOOZED"] }, deletedAt: null },
      orderBy: { dueAt: "asc" },
      take: 10,
      select: { id: true, title: true, dueAt: true, priority: true, categoryName: true },
    }),
    prisma.task.findMany({
      where: { userId, status: "TODO" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, priority: true, category: true },
    }),
    prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, category: true, key: true, value: true },
    }),
  ]);

  const userName = userProfile?.name || "User";
  const assistantName = "MoneRakhbe";

  // Build Context Summary for Gemini
  const conversationHistory = recentMessages
    .reverse()
    .map((m) => `${m.role === "USER" ? "User" : assistantName}: "${m.content}"`)
    .join("\n");

  const remindersContext = activeReminders
    .map((r) => `- [ID: ${r.id}] "${r.title}" (Due: ${formatFriendlyDate(r.dueAt)}, Priority: ${r.priority})`)
    .join("\n");

  const tasksContext = pendingTasks
    .map((t) => `- [ID: ${t.id}] "${t.title}" (Priority: ${t.priority})`)
    .join("\n");

  const memoriesContext = recentMemories
    .map((m) => `- [${m.category}] ${m.key}: ${m.value}`)
    .join("\n");

  const promptWithContext = `
Current Reference Time: ${now.toISOString()} (${now.toLocaleDateString("en-US", { timeZone: userTimezone, weekday: "long", year: "numeric", month: "long", day: "numeric" })}, Time: ${now.toLocaleTimeString("en-US", { timeZone: userTimezone })})
User Name: ${userName}
Timezone: ${userTimezone}

--- RECENT CONVERSATION HISTORY ---
${conversationHistory || "No previous conversation"}

--- USER'S ACTIVE REMINDERS ---
${remindersContext || "No active reminders"}

--- USER'S PENDING TASKS ---
${tasksContext || "No pending tasks"}

--- USER'S SAVED MEMORIES (Facts, People, Dates, Projects, Preferences) ---
${memoriesContext || "No saved memories"}

--- NEW USER MESSAGE ---
"${message}"

Analyze context, resolve references (like "ওটা", "আগেরটা", "ওই meeting"), determine exact intent and parameters, and return JSON schema.
`;

  let parsed: any = null;
  let tokensUsed = 100;

  try {
    const aiResponse = await generateContentWithFallback({
      prompt: promptWithContext,
      systemInstruction: ASSISTANT_SYSTEM_PROMPT,
      isJson: true,
      temperature: 0.1,
    });

    if (aiResponse && aiResponse.parsedJson) {
      parsed = aiResponse.parsedJson;
      tokensUsed = aiResponse.tokensUsed;
    }
  } catch (err) {
    console.error("[Assistant Gemini Error]", err);
  }

  // Fallback if Gemini unavailable
  if (!parsed) {
    parsed = fallbackContextualParser(message, now, activeReminders, pendingTasks, recentMemories);
  }


  await recordAiUsage(userId, tokensUsed);

  // Save conversation message
  await prisma.conversationMessage.create({
    data: {
      userId,
      channel,
      role: "USER",
      content: message,
      metadata: JSON.stringify(parsed),
    },
  });

  const intent = parsed.intent || "general_chat";

  // ==========================================
  // CENTRAL ACTION ENGINE DISPATCHER (#174)
  // ==========================================

  // 1. CREATE_REMINDER (#172)
  if (intent === "create_reminder") {
    const title = parsed.title || "রিমাইন্ডার";
    let targetDueAt = new Date();

    if (parsed.date) {
      const [y, m, d] = parsed.date.split("-").map(Number);
      targetDueAt = new Date(y, m - 1, d);
    } else {
      targetDueAt = addDays(new Date(), 1);
    }

    if (parsed.time) {
      const [h, min] = parsed.time.split(":").map(Number);
      targetDueAt.setHours(h || 9, min || 0, 0, 0);
    } else {
      targetDueAt.setHours(9, 0, 0, 0);
    }

    // Check Duplicate
    const dupCheck = await checkDuplicateReminder({ userId, title, dueAt: targetDueAt });
    if (dupCheck.isDuplicate) {
      const reply = `আপনার "${formatFriendlyDate(targetDueAt)}" তারিখে "${dupCheck.existingTitle}" রিমাইন্ডার ইতিমধ্যেই সেভ করা আছে।`;
      return {
        success: true,
        intent: "duplicate_detected",
        duplicateWarning: true,
        message: reply,
        data: { existingReminderId: dupCheck.existingReminderId },
      };
    }

    // Handle Recurrence
    let recurrenceId: string | null = null;
    if (parsed.recurrence && parsed.recurrence.frequency) {
      const rec = await prisma.recurrence.create({
        data: {
          userId,
          frequency: parsed.recurrence.frequency,
          interval: parsed.recurrence.interval || 1,
          timeOfDay: parsed.time || "09:00",
          nextOccurrence: targetDueAt,
          isActive: true,
        },
      });
      recurrenceId = rec.id;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        description: parsed.description || message,
        dueAt: targetDueAt,
        timezone: userTimezone,
        status: "PENDING",
        priority: parsed.priority || "NORMAL",
        categoryName: parsed.category || "General",
        recurrenceId,
      },
    });

    // Create notifications for reminder offsets
    const offsets = parsed.reminder_offsets && parsed.reminder_offsets.length > 0 ? parsed.reminder_offsets : ["at_time"];
    for (const offset of offsets) {
      const scheduledFor = calculateNotificationDate(targetDueAt, offset);
      await prisma.reminderNotification.create({
        data: {
          userId,
          reminderId: reminder.id,
          scheduledFor,
          status: "PENDING",
          channel: "TELEGRAM",
          deduplicationKey: `${reminder.id}_${offset}_${scheduledFor.getTime()}`,
        },
      });
    }

    await logAudit({
      userId,
      action: "REMINDER_CREATED",
      entityType: "REMINDER",
      entityId: reminder.id,
      details: { title, dueAt: targetDueAt },
    });

    const friendlyTime = formatFriendlyDate(targetDueAt);
    const replyMsg = parsed.reply_bn || `ঠিক আছে, আমি ${friendlyTime}-এর জন্য "${title}" রিমাইন্ডার সেট করে দিলাম।`;

    // Dual-save as linked Memory so it appears in Memory Vault & Search (#163, #179)
    await prisma.memory.create({
      data: {
        userId,
        category: parsed.category || "Important Dates",
        key: title,
        value: `${friendlyTime}-এ: ${parsed.description || title}`,
        source: channel === "TELEGRAM" ? "telegram" : "chat_web",
        reminderId: reminder.id,
        structuredData: JSON.stringify(parsed),
        summary: `রিমাইন্ডার নির্ধারিত: ${friendlyTime}`,
      },
    }).catch((err) => console.error("[Reminder Dual-Memory Error]", err));

    await prisma.conversationMessage.create({
      data: {
        userId,
        channel,
        role: "ASSISTANT",
        content: replyMsg,
        metadata: JSON.stringify({ intent: "create_reminder", reminderId: reminder.id }),
      },
    }).catch(() => null);

    return {
      success: true,
      intent: "create_reminder",
      message: replyMsg,
      data: reminder,
      actionTaken: "REMINDER_CREATED",
    };
  }

  // 2. EDIT_REMINDER (#170, #161)
  if (intent === "edit_reminder") {
    let targetReminder: any = null;
    if (parsed.target_reference) {
      targetReminder = activeReminders.find(
        (r) => r.title.toLowerCase().includes(parsed.target_reference.toLowerCase()) || r.id === parsed.target_reference
      );
    }
    if (!targetReminder && activeReminders.length > 0) {
      targetReminder = activeReminders[0]; // most relevant recent reminder
    }

    if (targetReminder) {
      let newDueAt = new Date(targetReminder.dueAt);
      if (parsed.date) {
        const [y, m, d] = parsed.date.split("-").map(Number);
        newDueAt.setFullYear(y, m - 1, d);
      }
      if (parsed.time) {
        const [h, min] = parsed.time.split(":").map(Number);
        newDueAt.setHours(h, min, 0, 0);
      }

      const updated = await prisma.reminder.update({
        where: { id: targetReminder.id },
        data: {
          dueAt: newDueAt,
          title: parsed.title || targetReminder.title,
        },
      });

      return {
        success: true,
        intent: "edit_reminder",
        message: parsed.reply_bn || `হয়ে গেছে। "${updated.title}" রিমাইন্ডারটি ${formatFriendlyDate(newDueAt)}-এ পরিবর্তন করা হয়েছে।`,
        data: updated,
        actionTaken: "REMINDER_UPDATED",
      };
    } else {
      return {
        success: true,
        intent: "edit_reminder",
        message: "পরিবর্তন করার মতো কোনো সক্রিয় রিমাইন্ডার খুঁজে পাওয়া যায়নি।",
      };
    }
  }

  // 3. DELETE_REMINDER (#170)
  if (intent === "delete_reminder") {
    let targetReminder: any = null;
    if (parsed.target_reference) {
      targetReminder = activeReminders.find(
        (r) => r.title.toLowerCase().includes(parsed.target_reference.toLowerCase()) || r.id === parsed.target_reference
      );
    }
    if (!targetReminder && activeReminders.length > 0) {
      targetReminder = activeReminders[0];
    }

    if (targetReminder) {
      await prisma.reminder.update({
        where: { id: targetReminder.id },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
      return {
        success: true,
        intent: "delete_reminder",
        message: parsed.reply_bn || `"${targetReminder.title}" রিমাইন্ডারটি মুছে ফেলা হয়েছে।`,
        actionTaken: "REMINDER_DELETED",
      };
    } else {
      return {
        success: true,
        intent: "delete_reminder",
        message: "মুছে ফেলার মতো কোনো রিমাইন্ডার পাওয়া যায়নি।",
      };
    }
  }

  // 4. CREATE_TASK (#170)
  if (intent === "create_task") {
    const task = await prisma.task.create({
      data: {
        userId,
        title: parsed.title || message,
        description: parsed.description,
        status: "TODO",
        priority: parsed.priority || "NORMAL",
        category: parsed.category || "General",
      },
    });

    // Dual save to Memory vault
    await prisma.memory.create({
      data: {
        userId,
        category: "Projects",
        key: `টাস্ক: ${task.title}`,
        value: `অগ্রাধিকার: ${task.priority}, অবস্থা: পেন্ডিং`,
        source: channel === "TELEGRAM" ? "telegram" : "chat_web",
        structuredData: JSON.stringify(parsed),
      },
    }).catch(() => null);

    const taskReply = parsed.reply_bn || `টাস্ক লিস্টে যোগ করা হয়েছে: "${task.title}"।`;
    await prisma.conversationMessage.create({
      data: {
        userId,
        channel,
        role: "ASSISTANT",
        content: taskReply,
        metadata: JSON.stringify({ intent: "create_task", taskId: task.id }),
      },
    }).catch(() => null);

    return {
      success: true,
      intent: "create_task",
      message: taskReply,
      data: task,
      actionTaken: "TASK_CREATED",
    };
  }

  // 5. COMPLETE_TASK (#170)
  if (intent === "complete_task") {
    let targetTask: any = null;
    if (parsed.target_reference) {
      targetTask = pendingTasks.find((t) =>
        t.title.toLowerCase().includes(parsed.target_reference.toLowerCase())
      );
    }
    if (!targetTask && pendingTasks.length > 0) {
      targetTask = pendingTasks[0];
    }

    if (targetTask) {
      const updated = await prisma.task.update({
        where: { id: targetTask.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      const doneReply = parsed.reply_bn || `দারুণ! "${updated.title}" কাজটি সম্পন্ন হিসেবে মার্ক করা হয়েছে।`;
      await prisma.conversationMessage.create({
        data: {
          userId,
          channel,
          role: "ASSISTANT",
          content: doneReply,
          metadata: JSON.stringify({ intent: "complete_task", taskId: updated.id }),
        },
      }).catch(() => null);
      return {
        success: true,
        intent: "complete_task",
        message: doneReply,
        data: updated,
        actionTaken: "TASK_COMPLETED",
      };
    } else {
      return {
        success: true,
        intent: "complete_task",
        message: "সম্পন্ন করার মতো কোনো পেন্ডিং টাস্ক পাওয়া যায়নি।",
      };
    }
  }

  // 6. CREATE_MEMORY (#163, #164, #179, #180)
  if (intent === "create_memory") {
    const category = parsed.memory_category || "Personal";
    const key = parsed.memory_key || parsed.title || "তথ্য";
    const value = parsed.memory_value || message;

    const memory = await prisma.memory.create({
      data: {
        userId,
        category,
        key,
        value,
        source: channel === "TELEGRAM" ? "telegram" : "chat_web",
        structuredData: JSON.stringify(parsed),
        summary: parsed.reply_bn || `${key}: ${value}`,
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: memory.id,
        userId,
        action: "CREATED",
        source: channel === "TELEGRAM" ? "telegram" : "chat_web",
        description: `চ্যাট থেকে (${channel === "TELEGRAM" ? "টেলিগ্রাম" : "ওয়েব চ্যাট"}) মেমোরি সংরক্ষণ করা হয়েছে।`,
      },
    }).catch(() => null);

    await logAudit({
      userId,
      action: "MEMORY_SAVED",
      entityType: "MEMORY",
      entityId: memory.id,
      details: { category, key, value },
    });

    const replyMsg = parsed.reply_bn || `ঠিক আছে, আমি মনে রাখলাম: ${key} — ${value}।`;

    await prisma.conversationMessage.create({
      data: {
        userId,
        channel,
        role: "ASSISTANT",
        content: replyMsg,
        metadata: JSON.stringify({ intent: "create_memory", memoryId: memory.id, memoryKey: key, memoryCategory: category }),
      },
    }).catch(() => null);

    return {
      success: true,
      intent: "create_memory",
      message: replyMsg,
      data: memory,
      actionTaken: "MEMORY_CREATED",
    };
  }

  // 7. QUERY_MEMORIES (#163, #181, #191)
  if (intent === "query_memories") {
    const rawRef = (parsed.target_reference || parsed.memory_key || message).toLowerCase();
    const searchTerms = rawRef
      .split(/\s+/)
      .filter((w: string) => w.length > 1 && !["আমার", "কবে", "কখন", "কোথায়", "কে", "কত", "ছিল", "কী", "কি"].includes(w));

    let dbMemories: any[] = [];
    if (searchTerms.length > 0) {
      dbMemories = await prisma.memory.findMany({
        where: {
          userId,
          OR: [
            ...searchTerms.map((term: string) => ({ key: { contains: term } })),
            ...searchTerms.map((term: string) => ({ value: { contains: term } })),
            ...searchTerms.map((term: string) => ({ category: { contains: term } })),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }

    if (dbMemories.length > 0) {
      const first = dbMemories[0];
      const reply = parsed.reply_bn || `আপনার ${first.key}: ${first.value}`;
      return {
        success: true,
        intent: "query_memories",
        message: reply,
        data: dbMemories,
      };
    }

    // Check active reminders if term matches
    const matchedReminder = activeReminders.find((r) =>
      searchTerms.some((term: string) => r.title.toLowerCase().includes(term))
    );
    if (matchedReminder) {
      return {
        success: true,
        intent: "query_reminders",
        message: `আপনার "${matchedReminder.title}" রিমাইন্ডারটি ${formatFriendlyDate(matchedReminder.dueAt)} তারিখে নির্ধারিত রয়েছে।`,
        data: matchedReminder,
      };
    }

    // Zero Hallucination check (#191)
    return {
      success: true,
      intent: "query_memories",
      message: parsed.reply_bn || "এটা আমার কাছে সেভ নেই। আপনি চাইলে এটি সেভ করার নির্দেশ দিতে পারেন।",
      data: [],
    };
  }


  // 8. QUERY_REMINDERS / QUERY_SCHEDULE (#170, #189)
  if (intent === "query_reminders" || intent === "query_schedule") {
    const scope = parsed.query_scope || "today";
    let targetReminders = activeReminders;
    let targetTasks = pendingTasks;

    if (scope === "today") {
      const todayEnd = endOfDay(now);
      targetReminders = activeReminders.filter((r) => new Date(r.dueAt) <= todayEnd);
    } else if (scope === "tomorrow") {
      const tomStart = startOfDay(addDays(now, 1));
      const tomEnd = endOfDay(addDays(now, 1));
      targetReminders = activeReminders.filter((r) => {
        const d = new Date(r.dueAt);
        return d >= tomStart && d <= tomEnd;
      });
    }

    if (targetReminders.length === 0 && targetTasks.length === 0) {
      return {
        success: true,
        intent: "query_schedule",
        message: `আপনার ${scope === "today" ? "আজকে" : scope === "tomorrow" ? "আগামীকাল" : "সামনে"} কোনো নির্ধারিত রিমাইন্ডার বা পেন্ডিং কাজ নেই।`,
        data: { reminders: [], tasks: [] },
      };
    }

    let summaryText = `📋 **${scope === "today" ? "আজকের" : scope === "tomorrow" ? "আগামীকালের" : "আসন্ন"} কাজের তালিকা:**\n\n`;
    if (targetReminders.length > 0) {
      summaryText += `**🔔 রিমাইন্ডার:**\n` + targetReminders.map((r, i) => `${i + 1}. ⏰ ${formatFriendlyDate(r.dueAt)} — ${r.title}`).join("\n") + "\n\n";
    }
    if (targetTasks.length > 0) {
      summaryText += `**📝 পেন্ডিং টাস্ক:**\n` + targetTasks.map((t, i) => `${i + 1}. 📌 ${t.title} [${t.priority}]`).join("\n");
    }

    return {
      success: true,
      intent: "query_schedule",
      message: parsed.reply_bn || summaryText.trim(),
      data: { reminders: targetReminders, tasks: targetTasks },
    };
  }

  // 9. DAILY_BRIEFING (#167)
  if (intent === "daily_briefing") {
    const briefing = await generateDailyBriefing(userId);
    return {
      success: true,
      intent: "daily_briefing",
      message: briefing.summary,
      data: briefing,
    };
  }

  // 10. EVENING_SUMMARY (#168)
  if (intent === "evening_summary") {
    const evening = await generateEveningSummary(userId);
    return {
      success: true,
      intent: "evening_summary",
      message: evening.summary,
      data: evening,
    };
  }

  // 11. WEEKLY_REVIEW (#188)
  if (intent === "weekly_review") {
    const review = await generateWeeklyReview(userId);
    return {
      success: true,
      intent: "weekly_review",
      message: review.summary,
      data: review,
    };
  }

  // 12. UPDATE_PREFERENCE (#165)
  if (intent === "update_preference" && parsed.preference_key) {
    if (parsed.preference_key === "default_morning_time" || parsed.preference_key === "reminder_start_time") {
      await prisma.profile.upsert({
        where: { userId },
        update: { defaultMorningTime: parsed.preference_value || "08:00" },
        create: { userId, defaultMorningTime: parsed.preference_value || "08:00" },
      });
    }

    return {
      success: true,
      intent: "update_preference",
      message: parsed.reply_bn || `আপনার সেটিংস আপডেট করা হয়েছে।`,
      actionTaken: "PREFERENCE_UPDATED",
    };
  }

  // Default: General Chat
  const chatReply = parsed.reply_bn || "আমি শুনতে পাচ্ছি। যেকোনো রিমাইন্ডার, টাস্ক বা মেমোরি সেভ করতে আমাকে বলুন!";
  await prisma.conversationMessage.create({
    data: {
      userId,
      channel,
      role: "ASSISTANT",
      content: chatReply,
      metadata: JSON.stringify({ intent: "general_chat" }),
    },
  }).catch(() => null);

  return {
    success: true,
    intent: "general_chat",
    message: chatReply,
  };
}

/**
 * Intelligent Rule-Based Contextual Fallback Parser (#160)
 */
function fallbackContextualParser(
  message: string,
  now: Date,
  activeReminders: any[],
  pendingTasks: any[],
  recentMemories: any[]
): any {
  const lower = message.toLowerCase().trim();

  // 1. Check Briefing / Summary requests
  if (lower.includes("briefing") || lower.includes("সকালের") || lower.includes("morning")) {
    return { intent: "daily_briefing", reply_bn: "আপনার আজকের সকালের ব্রিফিং প্রস্তুত করা হচ্ছে।" };
  }
  if (lower.includes("evening") || lower.includes("সারসংক্ষেপ") || lower.includes("summary") || lower.includes("আজকের কাজ শেষ")) {
    return { intent: "evening_summary", reply_bn: "আজকের সারসংক্ষেপ প্রস্তুত করা হচ্ছে।" };
  }
  if (lower.includes("week") || lower.includes("সপ্তাহের") || lower.includes("weekly")) {
    return { intent: "weekly_review", reply_bn: "আপনার সাপ্তাহিক কাজের পর্যালোচনা।" };
  }

  // 2. Query Schedule / Reminders / Tasks
  if (
    lower.includes("কাজ আছে") ||
    lower.includes("রিমাইন্ডার আছে") ||
    lower.includes("রিমাইন্ডার কি") ||
    lower.includes("রিমাইন্ডার কী") ||
    lower.includes("আজকে কী") ||
    lower.includes("আজকে কি") ||
    lower.includes("কাল কী") ||
    lower.includes("কাল কি") ||
    lower.includes("schedule") ||
    lower.includes("pending") ||
    lower.includes("reminder দেখাও") ||
    lower.includes("রিমাইন্ডার দেখাও")
  ) {
    const isTomorrow = lower.includes("কাল") || lower.includes("tomorrow");
    return {
      intent: "query_schedule",
      query_scope: isTomorrow ? "tomorrow" : "today",
    };
  }

  // 3. Question answering from saved memory (#191)
  const hasSaveIntent =
    lower.includes("মনে রেখো") ||
    lower.includes("মনে রাখ") ||
    lower.includes("mone rekho") ||
    lower.includes("mone rakh") ||
    lower.includes("save") ||
    lower.includes("সেভ") ||
    lower.includes("নোট");

  const isQuestion =
    !hasSaveIntent &&
    (lower.includes("?") ||
      lower.includes("কি?") ||
      lower.includes("কী?") ||
      lower.includes(" কি ") ||
      lower.endsWith(" কি") ||
      lower.includes(" কী ") ||
      lower.endsWith(" কী") ||
      lower.includes("কবে") ||
      lower.includes("কত") ||
      lower.includes("কোথায়") ||
      lower.includes("বলো") ||
      lower.includes("জানাও") ||
      lower.includes("মনে আছে") ||
      lower.includes("when is") ||
      lower.includes("who is") ||
      lower.includes("what is"));

  if (isQuestion) {
    const cleanSearch = message
      .replace(/আমার|আমারে|amar|ki|কি\?|কী\?|কি|কী|কবে|কখন|কোথায়|কে\?|কত\?|কত|\?|বলো|বলুন|জানাও|who is|what is|when is|where is/gi, "")
      .trim();
    return {
      intent: "query_memories",
      target_reference: cleanSearch || message,
    };
  }

  // 4. Future Time / Reminder trigger
  const hasFutureTime =
    lower.includes("মনে করিয়ে দিও") ||
    lower.includes("remind") ||
    lower.includes("মিটিং") ||
    lower.includes("meeting") ||
    lower.includes("কল করতে হবে") ||
    lower.includes("ফোন করতে হবে") ||
    lower.includes("call") ||
    lower.includes("appointment") ||
    lower.includes("যেতে হবে") ||
    (lower.includes("কাল") && (lower.includes("টায়") || lower.includes("সকাল") || lower.includes("বিকাল") || lower.includes("রাত")));

  if (hasFutureTime) {
    return {
      intent: "create_reminder",
      title: message.replace(/মনে করিয়ে দিও|remind me|আমাকে|সেভ করো|save/gi, "").trim() || "জরুরি রিমাইন্ডার",
      category: "Personal",
      date: addDays(now, 1).toISOString().slice(0, 10),
      time: "09:00",
      reply_bn: "ঠিক আছে, আমি রিমাইন্ডার সেট করে দিলাম এবং মেমোরিতেও সংরক্ষণ করে রাখলাম।",
    };
  }

  // 5. Password / Wi-Fi / Security PINs / Codes
  if (
    lower.includes("পাসওয়ার্ড") ||
    lower.includes("পাসওয়ার্ড") ||
    lower.includes("password") ||
    lower.includes("wifi") ||
    lower.includes("ওয়াইফাই") ||
    lower.includes("ওয়াইফাই") ||
    lower.includes("পিন কোড") ||
    lower.includes("লক কোড")
  ) {
    const isWifi = lower.includes("wifi") || lower.includes("ওয়াইফাই") || lower.includes("ওয়াইফাই");
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: isWifi ? "ওয়াইফাই পাসওয়ার্ড" : "পাসওয়ার্ড / সিকিউরিটি কোড",
      memory_value: message.replace(/আমার|পাসওয়ার্ড|পাসওয়ার্ড|password|wifi|ওয়াইফাই|ওয়াইফাই|সেভ করো|save|মনে রেখো|নোট/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি পাসওয়ার্ড / অ্যাক্সেস কোডটি মেমোরিতে নিরাপদে সেভ করে রাখলাম।",
    };
  }

  // 6. Passport / Documents / NID
  if (lower.includes("পাসপোর্ট") || lower.includes("passport")) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "পাসপোর্ট নম্বর",
      memory_value: message.replace(/আমার|পাসপোর্ট নম্বর|পাসপোর্ট নাম্বার|passport|মনে রেখো|মনে রাখো|save/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি আপনার পাসপোর্ট সম্পর্কিত তথ্য মেমোরিতে সেভ করে রাখলাম।",
    };
  }

  if (lower.includes("এনআইডি") || lower.includes("nid") || lower.includes("ভোটার আইডি") || lower.includes("জাতীয় পরিচয়পত্র")) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "জাতীয় পরিচয়পত্র (NID)",
      memory_value: message.replace(/আমার|এনআইডি|nid|জাতীয় পরিচয়পত্র|মনে রেখো|save/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি আপনার NID নম্বরটি মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  // 7. Blood Group
  if (lower.includes("রক্ত") || lower.includes("blood")) {
    return {
      intent: "create_memory",
      memory_category: "Health",
      memory_key: "রক্তের গ্রুপ",
      memory_value: message.replace(/আমার|রক্তের গ্রুপ|blood group|মনে রেখো|save/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি আপনার রক্তের গ্রুপ মেমোরিতে সেভ করে রাখলাম।",
    };
  }

  // 8. Address / House
  if (lower.includes("ঠিকানা") || lower.includes("বাসা") || lower.includes("বাড়ি") || lower.includes("address") || lower.includes("basha") || lower.includes("bari")) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "বাসা / ঠিকানা",
      memory_value: message.replace(/আমার|বাসার ঠিকানা|ঠিকানা|address|মনে রেখো|save/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি আপনার ঠিকানাটি মেমোরিতে সেভ করে রেখেছি।",
    };
  }

  // 9. Vehicles / Bike / Car / License
  if (lower.includes("গাড়ি") || lower.includes("বাইক") || lower.includes("car") || lower.includes("bike") || lower.includes("লাইসেন্স") || lower.includes("license")) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "যানবাহন / লাইসেন্স তথ্য",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি এটি মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  // 10. Phone / Mobile Contact
  if (
    lower.includes("ফোন") ||
    lower.includes("মোবাইল") ||
    lower.includes("নাম্বার") ||
    lower.includes("number") ||
    lower.includes("contact") ||
    /\b01[3-9]\d{8}\b/.test(message)
  ) {
    return {
      intent: "create_memory",
      memory_category: "People",
      memory_key: "যোগাযোগ / ফোন নম্বর",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি ফোন নম্বর ও যোগাযোগের তথ্য মেমোরিতে সেভ করে রাখলাম।",
    };
  }

  // 11. Birthday / Important Dates
  if (lower.includes("জন্মদিন") || lower.includes("birthday") || lower.includes("জন্মতারিখ") || lower.includes("jonmodin")) {
    return {
      intent: "create_memory",
      memory_category: "Important Dates",
      memory_key: "জন্মদিন",
      memory_value: message.replace(/আমার|মনে রেখো|মনে রাখো|save/gi, "").trim() || message,
      reply_bn: "ঠিক আছে, আমি এই জন্মদিনের তারিখটি মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  // 12. Finance / Loans / Borrow / Lend / Money
  if (
    lower.includes("টাকা") ||
    lower.includes("ধার") ||
    lower.includes("পাবো") ||
    lower.includes("পাবে") ||
    lower.includes("দিলাম") ||
    lower.includes("নিলাম") ||
    lower.includes("টাকা দিয়েছি") ||
    lower.includes("হিসাব") ||
    lower.includes("বকেয়া")
  ) {
    return {
      intent: "create_memory",
      memory_category: "Finance",
      memory_key: "আর্থিক লেনদেন / হিসাব",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি এই আর্থিক হিসাবটি মেমোরিতে সেভ করে রাখলাম।",
    };
  }

  // 13. Health / Medicine / Doctors / Prescription
  if (
    lower.includes("ওষুধ") ||
    lower.includes("ঔষধ") ||
    lower.includes("প্রেসার") ||
    lower.includes("প্রেসক্রিপশন") ||
    lower.includes("ডাক্তার") ||
    lower.includes("ট্যাবলেট") ||
    lower.includes("medicine")
  ) {
    return {
      intent: "create_memory",
      memory_category: "Health",
      memory_key: "স্বাস্থ্য ও ওষুধ",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি ওষুধের ও স্বাস্থ্যের তথ্য মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  // 14. Item locations (Keys, glasses, documents in drawer/cupboard)
  if (
    lower.includes("চাবি") ||
    lower.includes("চশমা") ||
    lower.includes("ড্রয়ার") ||
    lower.includes("ড্রয়ার") ||
    lower.includes("আলমারি") ||
    lower.includes("টেবিলে") ||
    lower.includes("ব্যাগ") ||
    lower.includes("drawer")
  ) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "জিনিসের অবস্থান / নোট",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি এটি মেমোরিতে সংরক্ষণ করে রেখেছি।",
    };
  }

  // 15. People / Family / Relations / Client
  if (
    lower.includes("কাজ করে") ||
    lower.includes("client") ||
    lower.includes("কোম্পানি") ||
    lower.includes("বন্ধু") ||
    lower.includes("ভাই") ||
    lower.includes("বোন") ||
    lower.includes("মা") ||
    lower.includes("বাবা") ||
    lower.includes("কাজিন")
  ) {
    const words = message.split(/\s+/);
    const personName = words[0] || "পরিচিত ব্যক্তি";
    return {
      intent: "create_memory",
      memory_category:
        lower.includes("ভাই") || lower.includes("বোন") || lower.includes("মা") || lower.includes("বাবা") || lower.includes("কাজিন")
          ? "Family"
          : "People",
      memory_key: personName,
      memory_value: message,
      reply_bn: `ঠিক আছে, আমি ${personName} সম্পর্কিত তথ্য মেমোরিতে সংরক্ষণ করলাম।`,
    };
  }

  // 16. Explicit Save & Note commands ("সেভ করো", "নোট রাখো", "save this", "mone rekho")
  if (
    lower.includes("সেভ") ||
    lower.includes("save") ||
    lower.includes("নোট") ||
    lower.includes("note") ||
    lower.includes("মনে রাখ") ||
    lower.includes("মনে রেখ") ||
    lower.includes("mone rekho") ||
    lower.includes("mone rakh")
  ) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "সংরক্ষিত নোট",
      memory_value:
        message
          .replace(
            /সেভ করো|সেভ কর|সেভ করুন|save this|save koro|save|নোট রাখো|নোট করো|নোট নাও|note koro|note this|note|মনে রেখো|মনে রাখো|mone rekho/gi,
            ""
          )
          .trim() || message,
      reply_bn: "ঠিক আছে, আমি এটি আপনার মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  // 17. General "আমার..." or "আমি..." or Banglish "amar " or "ami "
  if (
    lower.startsWith("আমার ") ||
    lower.startsWith("আমি ") ||
    lower.startsWith("amar ") ||
    lower.startsWith("ami ") ||
    lower.includes("পছন্দ") ||
    lower.includes("অপছন্দ")
  ) {
    return {
      intent: "create_memory",
      memory_category: "Personal",
      memory_key: "ব্যক্তিগত তথ্য",
      memory_value: message,
      reply_bn: "ঠিক আছে, আমি এই তথ্যটি আপনার পার্সোনাল মেমোরিতে সংরক্ষণ করে রাখলাম।",
    };
  }

  return {
    intent: "general_chat",
    reply_bn: "আমি আপনার কথা বুঝতে পেরেছি। যেকোনো কাজ মনে রাখতে বা জানতে শুধু আমাকে বলুন!",
  };
}
