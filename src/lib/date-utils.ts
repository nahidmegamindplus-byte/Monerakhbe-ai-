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

/**
 * Calculate offset timestamp from target due date
 */
export function calculateNotificationDate(dueAt: Date, offsetKey: string): Date {
  switch (offsetKey) {
    case "10_min_before":
      return subMinutes(dueAt, 10);
    case "30_min_before":
      return subMinutes(dueAt, 30);
    case "1_hour_before":
      return subHours(dueAt, 1);
    case "3_hours_before":
      return subHours(dueAt, 3);
    case "1_day_before":
      return subDays(dueAt, 1);
    case "3_days_before":
      return subDays(dueAt, 3);
    case "1_week_before":
      return subDays(dueAt, 7);
    case "at_time":
    default:
      return new Date(dueAt);
  }
}

/**
 * Calculate next occurrence for recurrence rule
 */
export function calculateNextOccurrence(
  frequency: string,
  currentDate: Date,
  interval: number = 1,
  timeOfDay?: string | null
): Date {
  let nextDate = new Date(currentDate);

  switch (frequency.toUpperCase()) {
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

  if (timeOfDay) {
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
export function formatFriendlyDate(date: Date | string, language: string = "bn"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
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
}
