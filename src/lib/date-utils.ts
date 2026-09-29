import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subHours,
  subMinutes,
  format,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";

export const DEFAULT_TIMEZONE = "Asia/Dhaka";

const BANGLA_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const ENGLISH_TO_BANGLA_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

export function normalizeBanglaDigits(text: string): string {
  return text.replace(/[০-৯]/g, (digit) => BANGLA_DIGITS[digit] || digit);
}

export function toBanglaDigits(text: string | number): string {
  return String(text).replace(/[0-9]/g, (digit) => ENGLISH_TO_BANGLA_DIGITS[digit] || digit);
}

export function safeParseDate(date: any): Date | null {
  if (!date) return null;
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!d || isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Calculate offset timestamp from target due date
 */
export function calculateNotificationDate(dueAt: Date | string, offsetKey: string): Date {
  const d = safeParseDate(dueAt) || new Date();
  switch (offsetKey) {
    case "10_min_before":
      return subMinutes(d, 10);
    case "30_min_before":
      return subMinutes(d, 30);
    case "1_hour_before":
      return subHours(d, 1);
    case "3_hours_before":
      return subHours(d, 3);
    case "1_day_before":
      return subDays(d, 1);
    case "3_days_before":
      return subDays(d, 3);
    case "1_week_before":
      return subDays(d, 7);
    case "at_time":
    default:
      return new Date(d);
  }
}

/**
 * Calculate next occurrence for recurrence rule
 */
export function calculateNextOccurrence(
  frequency: string,
  currentDate: Date | string,
  interval: number = 1,
  timeOfDay?: string | null
): Date {
  const validDate = safeParseDate(currentDate) || new Date();
  let nextDate = new Date(validDate);

  switch ((frequency || "").toUpperCase()) {
    case "DAILY":
      nextDate = addDays(nextDate, interval || 1);
      break;
    case "WEEKLY":
      nextDate = addWeeks(nextDate, interval || 1);
      break;
    case "MONTHLY":
      nextDate = addMonths(nextDate, interval || 1);
      break;
    case "YEARLY":
      nextDate = addYears(nextDate, interval || 1);
      break;
    case "CUSTOM":
      nextDate = addDays(nextDate, interval || 1);
      break;
    default:
      nextDate = addDays(nextDate, 1);
  }

  if (timeOfDay && typeof timeOfDay === "string") {
    const [hours, minutes] = timeOfDay.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextDate.setHours(hours, minutes, 0, 0);
    }
  }

  return nextDate;
}

/**
 * Format date for friendly Bangla / English display
 */
export function formatFriendlyDate(date: Date | string | null | undefined, language: string = "bn"): string {
  if (!date) return language === "bn" ? "নির্ধারিত নয়" : "Not specified";
  try {
    const d = safeParseDate(date);
    if (!d) return language === "bn" ? "নির্ধারিত নয়" : "Not specified";

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const targetDayStart = startOfDay(d);

    const timeStr = format(d, "h:mm a");

    if (targetDayStart.getTime() === todayStart.getTime()) {
      return language === "bn" ? `আজ ${timeStr}` : `Today at ${timeStr}`;
    }
    if (targetDayStart.getTime() === tomorrowStart.getTime()) {
      return language === "bn" ? `আগামীকাল ${timeStr}` : `Tomorrow at ${timeStr}`;
    }

    const formattedDate = format(d, "dd MMM yyyy, h:mm a");
    if (language === "bn") {
      return toBanglaDigits(formattedDate);
    }
    return formattedDate;
  } catch {
    return language === "bn" ? "নির্ধারিত নয়" : "Not specified";
  }
}
