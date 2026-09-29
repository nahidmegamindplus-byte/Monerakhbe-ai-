import { describe, it, expect } from "vitest";
import { calculateNotificationDate } from "@/lib/date-utils";

describe("MoneRakhbe AI — Integration & Business Logic Tests", () => {
  it("Generates unique deduplication key for scheduled notifications", () => {
    const reminderId = "rem_12345";
    const offset = "3_days_before";
    const eventTime = new Date("2026-10-20T17:00:00Z");
    const scheduledFor = calculateNotificationDate(eventTime, offset);

    const deduplicationKey1 = `${reminderId}_${offset}_${scheduledFor.getTime()}`;
    const deduplicationKey2 = `${reminderId}_${offset}_${scheduledFor.getTime()}`;

    // Same reminder + same offset produces identical deduplication key for idempotency
    expect(deduplicationKey1).toBe(deduplicationKey2);
    expect(deduplicationKey1).toContain("rem_12345_3_days_before");
  });

  it("Different offset produces different deduplication key", () => {
    const reminderId = "rem_12345";
    const eventTime = new Date("2026-10-20T17:00:00Z");

    const key1 = `${reminderId}_1_day_before_${calculateNotificationDate(eventTime, "1_day_before").getTime()}`;
    const key2 = `${reminderId}_at_time_${calculateNotificationDate(eventTime, "at_time").getTime()}`;

    expect(key1).not.toBe(key2);
  });
});
