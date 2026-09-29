import prisma from "@/lib/prisma";
import { formatFriendlyDate } from "@/lib/date-utils";
import { addDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";

export interface BriefingData {
  greeting: string;
  dateStr: string;
  summary: string;
  todayRemindersCount: number;
  pendingTasksCount: number;
  upcomingEventsCount: number;
  highlights: string[];
  reminders: Array<{ id: string; title: string; dueAt: string; priority: string }>;
  tasks: Array<{ id: string; title: string; priority: string }>;
  topPriorityItem?: string;
  actionButtons: Array<{ label: string; action: string; query: string }>;
}

export interface EveningSummaryData {
  greeting: string;
  dateStr: string;
  completedTasksCount: number;
  pendingTasksCount: number;
  missedRemindersCount: number;
  tomorrowRemindersCount: number;
  summary: string;
  completedTasks: Array<{ id: string; title: string }>;
  pendingTasks: Array<{ id: string; title: string }>;
  tomorrowHighlights: string[];
  actionButtons: Array<{ label: string; action: string; query: string }>;
}

export interface WeeklyReviewData {
  greeting: string;
  weekRange: string;
  completedTasksCount: number;
  pendingTasksCount: number;
  upcomingRemindersCount: number;
  productivityRate: number;
  summary: string;
  topAchievements: string[];
  upcomingFocus: string[];
}

/**
 * Generate Morning Daily Briefing (#167, #169)
 */
export async function generateDailyBriefing(userId: string): Promise<BriefingData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [user, reminders, tasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, language: true, profile: true },
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        dueAt: { gte: todayStart, lte: todayEnd },
        status: { in: ["PENDING", "SNOOZED"] },
        deletedAt: null,
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: "TODO",
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
  ]);

  const userName = user?.name ? user.name.split(" ")[0] : "";
  const dateStr = now.toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const highPriorityTask = tasks.find((t) => t.priority === "HIGH");
  const highPriorityReminder = reminders.find((r) => r.priority === "HIGH");
  const topPriorityItem =
    highPriorityTask
      ? `আজকের মূল কাজ: ${highPriorityTask.title}`
      : highPriorityReminder
      ? `জরুরি রিমাইন্ডার: ${highPriorityReminder.title} (${formatFriendlyDate(highPriorityReminder.dueAt)})`
      : reminders[0]
      ? `${formatFriendlyDate(reminders[0].dueAt)} — ${reminders[0].title}`
      : tasks[0]
      ? `পেন্ডিং কাজ: ${tasks[0].title}`
      : undefined;

  const highlights: string[] = [];
  if (reminders.length > 0) {
    highlights.push(`${reminders.length}টি সময়ভিত্তিক রিমাইন্ডার রয়েছে`);
  }
  if (tasks.length > 0) {
    highlights.push(`${tasks.length}টি পেন্ডিং টাস্ক রয়েছে`);
  }
  if (reminders.length === 0 && tasks.length === 0) {
    highlights.push("আজকে আপনার কোনো নির্ধারিত ব্যস্ততা নেই। দিনটি স্বাচ্ছন্দ্যে কাটুক!");
  }

  let summary = `শুভ সকাল${userName ? " " + userName : ""}!\n\nআজকের সারসংক্ষেপ:\n`;
  if (reminders.length > 0 || tasks.length > 0) {
    summary += `🔔 ${reminders.length}টি রিমাইন্ডার\n📋 ${tasks.length}টি পেন্ডিং টাস্ক\n\n`;
    if (topPriorityItem) {
      summary += `⭐ সবচেয়ে গুরুত্বপূর্ণ:\n${topPriorityItem}\n\n`;
    }
  } else {
    summary += `আজ আপনার কোনো নির্ধারিত রিমাইন্ডার বা পেন্ডিং কাজ নেই। নতুন কিছু মনে রাখতে চাইলে আমাকে বলুন।`;
  }

  return {
    greeting: `শুভ সকাল${userName ? ", " + userName : ""}!`,
    dateStr,
    summary: summary.trim(),
    todayRemindersCount: reminders.length,
    pendingTasksCount: tasks.length,
    upcomingEventsCount: reminders.length,
    highlights,
    topPriorityItem,
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      dueAt: formatFriendlyDate(r.dueAt),
      priority: r.priority,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
    })),
    actionButtons: [
      { label: "আজকের সব কাজ দেখাও", action: "query_today", query: "আজকের সব কাজ দেখাও" },
      { label: "কালকের কাজ কী কী?", action: "query_tomorrow", query: "আমার কাল কী কী কাজ আছে?" },
      { label: "নতুন রিমাইন্ডার যোগ করুন", action: "new_reminder", query: "একটি রিমাইন্ডার যোগ করো" },
    ],
  };
}

/**
 * Generate Evening Summary (#168, #169)
 */
export async function generateEveningSummary(userId: string): Promise<EveningSummaryData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const [user, completedTasks, pendingTasks, tomorrowReminders, missedReminders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: "TODO",
      },
      take: 10,
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        dueAt: { gte: tomorrowStart, lte: tomorrowEnd },
        status: "PENDING",
        deletedAt: null,
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        dueAt: { lt: now },
        status: "PENDING",
        deletedAt: null,
      },
      take: 5,
    }),
  ]);

  const userName = user?.name ? user.name.split(" ")[0] : "";
  const dateStr = now.toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tomorrowHighlights = tomorrowReminders.map(
    (r) => `⏰ ${formatFriendlyDate(r.dueAt)} — ${r.title}`
  );

  let summary = `শুভ সন্ধ্যা${userName ? " " + userName : ""}!\n\nআজকের কাজের খতিয়ান:\n`;
  summary += `✓ ${completedTasks.length}টি টাস্ক সম্পন্ন হয়েছে\n`;
  summary += `○ ${pendingTasks.length}টি টাস্ক পেন্ডিং আছে\n`;
  if (missedReminders.length > 0) {
    summary += `⚠️ ${missedReminders.length}টি রিমাইন্ডার ওভারডিউ আছে\n`;
  }
  summary += `\n📅 আগামীকাল:\n`;
  if (tomorrowReminders.length > 0) {
    summary += `${tomorrowReminders.length}টি রিমাইন্ডার নির্ধারিত আছে:\n` + tomorrowHighlights.join("\n");
  } else {
    summary += `আগামীকাল কোনো নির্ধারিত রিমাইন্ডার নেই।`;
  }

  return {
    greeting: `শুভ সন্ধ্যা${userName ? ", " + userName : ""}!`,
    dateStr,
    completedTasksCount: completedTasks.length,
    pendingTasksCount: pendingTasks.length,
    missedRemindersCount: missedReminders.length,
    tomorrowRemindersCount: tomorrowReminders.length,
    summary: summary.trim(),
    completedTasks: completedTasks.map((t) => ({ id: t.id, title: t.title })),
    pendingTasks: pendingTasks.map((t) => ({ id: t.id, title: t.title })),
    tomorrowHighlights,
    actionButtons: [
      { label: "কালকের শিডিউল দেখাও", action: "query_tomorrow", query: "আমার কাল কী কী কাজ আছে?" },
      { label: "পেন্ডিং কাজগুলো দেখাও", action: "query_pending", query: "আমার পেন্ডিং কাজগুলো দেখাও" },
    ],
  };
}

/**
 * Generate Weekly Review (#188)
 */
export async function generateWeeklyReview(userId: string): Promise<WeeklyReviewData> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [user, completedTasks, pendingTasks, upcomingReminders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: "TODO",
      },
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        dueAt: { gte: now, lte: addDays(now, 7) },
        status: "PENDING",
        deletedAt: null,
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
  ]);

  const totalTasks = completedTasks.length + pendingTasks.length;
  const productivityRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;

  const topAchievements = completedTasks.slice(0, 5).map((t) => `✓ ${t.title}`);
  const upcomingFocus = upcomingReminders.slice(0, 5).map(
    (r) => `📌 ${formatFriendlyDate(r.dueAt)} — ${r.title}`
  );

  let summary = `📊 এই সপ্তাহের সাপ্তাহিক পর্যালোচনা:\n\n`;
  summary += `✓ সম্পন্ন টাস্ক: ${completedTasks.length}টি (${productivityRate}% সম্পূর্ণতা)\n`;
  summary += `○ পেন্ডিং টাস্ক: ${pendingTasks.length}টি\n`;
  summary += `🔔 আগামী ৭ দিনের রিমাইন্ডার: ${upcomingReminders.length}টি\n`;

  return {
    greeting: `সাপ্তাহিক রিভিউ (${user?.name || "ইউজার"})`,
    weekRange: `${weekStart.toLocaleDateString("bn-BD", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}`,
    completedTasksCount: completedTasks.length,
    pendingTasksCount: pendingTasks.length,
    upcomingRemindersCount: upcomingReminders.length,
    productivityRate,
    summary: summary.trim(),
    topAchievements,
    upcomingFocus,
  };
}
