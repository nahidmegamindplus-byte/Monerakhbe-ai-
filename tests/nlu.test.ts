import { describe, it, expect } from "vitest";
import { parseMessageFallback } from "../src/services/ai/fallback-parser";
import { calculateNotificationDate, calculateNextOccurrence, normalizeBanglaDigits } from "../src/lib/date-utils";

describe("MoneRakhbe AI — NLU & Recurrence Rule Engine", () => {
  const referenceDate = new Date("2026-09-23T10:00:00Z");

  it("CRITICAL RULE: Never assume recurrence for one-time future dates", () => {
    const input = "আগামী মাসের ২০ তারিখে বাড়ি যাব।";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.recurrence).toBeNull(); // MUST BE NULL!
    expect(result.date).toContain("2026-10-20");
  });

  it("Explicit monthly recurrence creates MONTHLY recurring rule", () => {
    const input = "প্রতি মাসের ২০ তারিখে বাড়ি যেতে হয়।";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.recurrence).not.toBeNull();
    expect(result.recurrence?.frequency).toBe("MONTHLY");
    expect(result.recurrence?.dayOfMonth).toBe(20);
  });

  it("Explicit weekly recurrence creates WEEKLY recurring rule", () => {
    const input = "প্রতি শুক্রবার বিকেল ৫টায় আমাকে weekly meeting-এর কথা মনে করিয়ে দিও";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.recurrence).not.toBeNull();
    expect(result.recurrence?.frequency).toBe("WEEKLY");
    expect(result.time).toBe("17:00");
  });

  it("Explicit yearly recurrence creates YEARLY recurring rule", () => {
    const input = "প্রতি বছর ১২ ডিসেম্বর মনে করিয়ে দিও।";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.recurrence).not.toBeNull();
    expect(result.recurrence?.frequency).toBe("YEARLY");
  });

  it("Calculates reminder offsets (e.g. 3 days before)", () => {
    const input = "২০ তারিখে বাড়ি যাব, ৩ দিন আগে মনে করিয়ে দিও।";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.recurrence).toBeNull();
    expect(result.reminder_offsets).toContain("3_days_before");

    const eventDate = new Date("2026-10-20T09:00:00Z");
    const notifDate = calculateNotificationDate(eventDate, "3_days_before");
    expect(notifDate.toISOString()).toContain("2026-10-17");
  });

  it("Separates Memory from Reminders (Memory Only)", () => {
    const input = "আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর, মনে রেখো।";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_memory");
    expect(result.memory_category).toBe("Family");
    expect(result.memory_value).toContain("১২ ডিসেম্বর");
  });

  it("Parses Banglish natural input correctly", () => {
    const input = "kal 5tay client ke call korte mone koriye dio";
    const result = parseMessageFallback(input, referenceDate);

    expect(result.intent).toBe("create_reminder");
    expect(result.time).toBe("17:00");
    expect(result.recurrence).toBeNull();
  });

  it("Normalizes Bangla digits properly", () => {
    const banglaText = "১২/১০/২০২৬";
    const normalized = normalizeBanglaDigits(banglaText);
    expect(normalized).toBe("12/10/2026");
  });

  it("Calculates next occurrence for monthly recurring reminder", () => {
    const current = new Date("2026-09-20T09:00:00Z");
    const next = calculateNextOccurrence("MONTHLY", current, 1, "09:00");
    expect(next.toISOString()).toContain("2026-10-20");
  });
});
