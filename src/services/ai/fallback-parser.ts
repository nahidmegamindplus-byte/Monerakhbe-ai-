import { AIIntentResult, RecurrenceFrequency, MemoryCategory } from "@/types";
import { normalizeBanglaDigits } from "@/lib/date-utils";
import { format, addDays, addMonths, addWeeks, addHours } from "date-fns";

export function parseMessageFallback(message: string, now: Date = new Date()): AIIntentResult {
  const rawText = message.trim();
  // First normalize digits
  const textNormalizedDigits = normalizeBanglaDigits(rawText);
  const text = textNormalizedDigits.toLowerCase();

  // 1. Check for memory queries: "আমার ভাইয়ের জন্মদিন কবে?", "ভাইয়ের birthday কী?", "আমার কী কী মনে রেখেছ?"
  if (
    text.includes("কবে") ||
    text.includes("কী মনে রেখেছ") ||
    text.includes("কী কী মনে রেখেছ") ||
    text.includes("memory দেখাও") ||
    text.includes("when is") ||
    text.includes("what is my")
  ) {
    let target = rawText.replace(/আমার|কবে|কী|মনে|রেখেছ|দেখাও|\?|what is|when is/gi, "").trim();
    return {
      intent: "query_memories",
      target_reference: target || null,
      response_message: `আপনার স্মৃতি থেকে "${target || "তথ্য"}" খোঁজা হচ্ছে...`,
      detected_language: "bn",
    };
  }

  // 2. Check for memory creation: "আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর, মনে রেখো", "মনে রেখো", "save this memory"
  if (
    (text.includes("মনে রেখো") || text.includes("mone rekho") || text.includes("remember that") || text.includes("address এটা") || text.includes("নাম হলো")) &&
    !text.includes("মনে করিয়ে দিও") &&
    !text.includes("remind me")
  ) {
    let category: MemoryCategory = "Personal";
    if (text.includes("ভাই") || text.includes("বোন") || text.includes("মা") || text.includes("বাবা") || text.includes("family") || text.includes("brother") || text.includes("sister")) {
      category = "Family";
    } else if (text.includes("অফিস") || text.includes("office") || text.includes("manager") || text.includes("boss") || text.includes("work")) {
      category = "Work";
    } else if (text.includes("bank") || text.includes("টাকা") || text.includes("finance") || text.includes("salary")) {
      category = "Finance";
    } else if (text.includes("জন্মদিন") || text.includes("birthday") || text.includes("anniversary")) {
      category = "Important Dates";
    }

    return {
      intent: "create_memory",
      memory_category: category,
      memory_key: rawText.replace(/মনে রেখো|mone rekho|remember that|\./gi, "").trim(),
      memory_value: rawText,
      response_message: `ঠিক আছে! আমি আপনার ${category} মেমোরিতে এটি সংরক্ষণ করে রাখলাম।`,
      detected_language: "bn",
    };
  }

  // 3. Check for Reminder / Task list queries: "আজ কি কি লিস্ট আছে", "আজকের কাজ জানাও", "কাল কি কাজ আছে", "আমার সব reminder দেখাও"
  if (
    text.includes("লিস্ট আছে") ||
    text.includes("কাজ আছে") ||
    text.includes("কাজ জানাও") ||
    text.includes("কাজের তালিকা") ||
    text.includes("শিডিউল কী") ||
    text.includes("কী কী কাজ") ||
    text.includes("ki ki kaj") ||
    text.includes("ki kaj ase") ||
    text.includes("list dekhao") ||
    text.includes("reminder দেখাও") ||
    text.includes("reminders দেখাও") ||
    text.includes("show reminders") ||
    text.includes("show my reminders") ||
    text.includes("reminder গুলো দেখাও")
  ) {
    let scope: "today" | "tomorrow" | "next_7_days" | "this_month" | "this_week" | "recurring" | "completed" | "overdue" | "all" = "today";
    if (text.includes("7 দিন") || text.includes("7 day") || text.includes("7 days") || text.includes("৭ দিন")) scope = "next_7_days";
    else if (text.includes("আজ") || text.includes("today") || text.includes("aj")) scope = "today";
    else if (text.includes("কাল") || text.includes("tomorrow") || text.includes("kal")) scope = "tomorrow";
    else if (text.includes("মাস") || text.includes("this month")) scope = "this_month";
    else if (text.includes("সপ্তাহ") || text.includes("this week")) scope = "this_week";
    else if (text.includes("recurring") || text.includes("পৌনঃপুনিক")) scope = "recurring";
    else if (text.includes("completed") || text.includes("শেষ")) scope = "completed";
    else if (text.includes("overdue")) scope = "overdue";
    else if (text.includes("সব") || text.includes("all")) scope = "all";

    return {
      intent: "query_reminders",
      query_scope: scope,
      response_message: `আপনার ${scope === "today" ? "আজকের" : scope === "tomorrow" ? "আগামীকালের" : "নির্ধারিত"} কাজের তালিকা আনা হচ্ছে...`,
      detected_language: "bn",
    };
  }


  // 4. Check for Edit / Delete requests: "ওই reminderটা ২২ তারিখে করে দাও", "ওই reminderটা delete করে দাও"
  if (text.includes("delete") || text.includes("মুছে") || text.includes("বাদ দাও")) {
    return {
      intent: "delete_reminder",
      target_reference: rawText.replace(/delete|মুছে|বাদ|দাও|করো|reminder|ওই/gi, "").trim() || "previous",
      response_message: "রিমাইন্ডারটি ডিলিট করা হচ্ছে...",
      detected_language: "bn",
    };
  }

  if (text.includes("করে দাও") || text.includes("reschedule") || text.includes("change date")) {
    return {
      intent: "edit_reminder",
      target_reference: rawText.replace(/করে দাও|reschedule|change|reminder|ওই/gi, "").trim(),
      response_message: "রিমাইন্ডারটি আপডেট করা হচ্ছে...",
      detected_language: "bn",
    };
  }

  // 5. Determine Recurrence - CRITICAL: Strict keyword matching
  let recurrence: {
    frequency: RecurrenceFrequency;
    interval?: number;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    month?: number | null;
    timeOfDay?: string | null;
  } | null = null;

  const isDaily = text.includes("প্রতিদিন") || text.includes("every day") || text.includes("daily") || text.includes("protidin");
  const isWeekly = text.includes("প্রতি সপ্তাহে") || text.includes("প্রতি শুক্রবার") || text.includes("প্রতি সোমবার") || text.includes("every week") || text.includes("every friday") || text.includes("weekly");
  const isMonthly = text.includes("প্রতি মাসের") || text.includes("প্রতি মাসে") || text.includes("every month") || text.includes("monthly");
  const isYearly = text.includes("প্রতি বছর") || text.includes("every year") || text.includes("yearly") || text.includes("প্রতি বৎসর");
  const isCustomInterval = text.includes("প্রতি 3 দিন") || text.includes("প্রতি 2 দিন") || text.includes("every 3 days") || text.includes("every 2 days");

  if (isDaily) {
    recurrence = { frequency: "DAILY", interval: 1 };
  } else if (isWeekly) {
    let dow = 5; // Friday default in BD
    if (text.includes("সোমবার") || text.includes("monday")) dow = 1;
    if (text.includes("মঙ্গলবার") || text.includes("tuesday")) dow = 2;
    if (text.includes("বুধবার") || text.includes("wednesday")) dow = 3;
    if (text.includes("বৃহস্পতিবার") || text.includes("thursday")) dow = 4;
    if (text.includes("শুক্রবার") || text.includes("friday")) dow = 5;
    if (text.includes("শনিবার") || text.includes("saturday")) dow = 6;
    if (text.includes("রবিবার") || text.includes("sunday")) dow = 0;
    recurrence = { frequency: "WEEKLY", interval: 1, dayOfWeek: dow };
  } else if (isMonthly) {
    const match = text.match(/(\d+)\s*তারিখ/);
    const dom = match ? parseInt(match[1], 10) : 1;
    recurrence = { frequency: "MONTHLY", interval: 1, dayOfMonth: dom };
  } else if (isYearly) {
    recurrence = { frequency: "YEARLY", interval: 1 };
  } else if (isCustomInterval) {
    const match = text.match(/প্রতি\s*(\d+)\s*দিন/);
    const interval = match ? parseInt(match[1], 10) : 3;
    recurrence = { frequency: "CUSTOM", interval };
  }

  // 6. Reminder offsets extraction ("৩ দিন আগে", "১ দিন আগে", "১ ঘণ্টা আগে", "3 days before")
  const reminder_offsets: string[] = ["at_time"];
  if (text.includes("3 দিন আগে") || text.includes("3 days before") || text.includes("3 din age") || text.includes("৩ দিন আগে")) {
    reminder_offsets.push("3_days_before");
  }
  if (text.includes("1 দিন আগে") || text.includes("1 day before") || text.includes("1 din age") || text.includes("আগের দিন") || text.includes("১ দিন আগে")) {
    reminder_offsets.push("1_day_before");
  }
  if (text.includes("1 ঘণ্টা আগে") || text.includes("1 hour before") || text.includes("1 ghonta age") || text.includes("১ ঘণ্টা আগে")) {
    reminder_offsets.push("1_hour_before");
  }
  if (text.includes("30 মিনিট আগে") || text.includes("30 min before") || text.includes("৩০ মিনিট আগে")) {
    reminder_offsets.push("30_min_before");
  }

  // 7. Calculate Date & Time
  let targetDate: Date = addDays(now, 1);
  let timeStr: string | null = null;

  // Time extraction
  if (
    text.includes("বিকেল 5") ||
    text.includes("5pm") ||
    text.includes("5:00 pm") ||
    text.includes("5 tay") ||
    text.includes("5tay") ||
    text.includes("5টায়")
  ) {
    timeStr = "17:00";
    targetDate.setHours(17, 0, 0, 0);
  } else if (
    text.includes("বিকেল 4") ||
    text.includes("4pm") ||
    text.includes("4:00 pm") ||
    text.includes("4 tay") ||
    text.includes("4tay") ||
    text.includes("4টায়")
  ) {
    timeStr = "16:00";
    targetDate.setHours(16, 0, 0, 0);
  } else if (
    text.includes("সকাল 8") ||
    text.includes("8am") ||
    text.includes("8:00 am") ||
    text.includes("8 tay") ||
    text.includes("8tay") ||
    text.includes("8টায়")
  ) {
    timeStr = "08:00";
    targetDate.setHours(8, 0, 0, 0);
  } else if (
    text.includes("রাত 10") ||
    text.includes("10pm") ||
    text.includes("10:00 pm") ||
    text.includes("10 tay") ||
    text.includes("10tay") ||
    text.includes("10টায়")
  ) {
    timeStr = "22:00";
    targetDate.setHours(22, 0, 0, 0);
  } else if (text.includes("সকাল 10") || text.includes("10am")) {
    timeStr = "10:00";
    targetDate.setHours(10, 0, 0, 0);
  }

  // Relative minute parsing ("5 মিনিট পর", "5 minuts por", "10 min por", "15 minutes later", etc.)
  const minMatch = text.match(/(\d+)\s*(?:মিনিট|minuts|minutes|minute|min|m)\s*(?:পর|later|after|por)/i);
  const hrMatch = text.match(/(\d+)\s*(?:ঘণ্টা|ঘন্টা|hours|hour|hr|h)\s*(?:পর|later|after|por)/i);

  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    targetDate = new Date(now.getTime() + mins * 60 * 1000);
    timeStr = format(targetDate, "HH:mm");
  } else if (hrMatch) {
    const hrs = parseInt(hrMatch[1], 10);
    targetDate = addHours(now, hrs);
    timeStr = format(targetDate, "HH:mm");
  }

  // Date calculation
  if (minMatch || hrMatch) {
    // already computed relative to now
  } else if (text.includes("আজ") || text.includes("today")) {
    targetDate = new Date(now);
  } else if (text.includes("কাল") || text.includes("আগামীকাল") || text.includes("tomorrow") || text.includes("kal")) {
    targetDate = addDays(now, 1);
  } else if (text.includes("পরশু") || text.includes("porshu") || text.includes("day after tomorrow")) {
    targetDate = addDays(now, 2);
  } else if (text.includes("আগামী মাসের") || text.includes("next month")) {
    const match = text.match(/(\d+)\s*তারিখ/);
    const day = match ? parseInt(match[1], 10) : 1;
    targetDate = addMonths(now, 1);
    targetDate.setDate(day);
  } else if (text.includes("তারিখ") || text.match(/\b\d{1,2}\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i)) {
    const match = text.match(/(\d+)\s*তারিখ/);
    if (match) {
      const day = parseInt(match[1], 10);
      targetDate.setDate(day);
      if (targetDate < now) {
        targetDate = addMonths(targetDate, 1);
      }
    }
  } else if (text.includes("দিন পর") || text.includes("days after")) {
    const match = text.match(/(\d+)\s*দিন পর/);
    if (match) {
      targetDate = addDays(now, parseInt(match[1], 10));
    }
  }

  // Extract clean title
  let cleanTitle = rawText
    .replace(/আমাকে|মনে করিয়ে দিও|মনে করিয়ে দাও|কথা মনে করিয়ে দিও|remind me to|remind me|mone koriye dio|প্রতিদিন|প্রতি শুক্রবার|প্রতি মাসের|প্রতি বছর|আগামীকাল|কাল|আজ|পরশু|বিকেল|সকাল|রাত|\d+টায়|\d+tay|\d+ tay|\d+ তারিখে|\d+ দিন আগে|\d+\s*(?:মিনিট|minuts|minutes|min|ঘণ্টা|ঘন্টা|hours|hr)\s*(?:পর|later|after|por)/gi, "")
    .replace(/[,.-]/g, "")
    .trim();

  if (!cleanTitle) cleanTitle = "রিমাইন্ডার";

  return {
    intent: "create_reminder",
    title: cleanTitle,
    description: rawText,
    date: format(targetDate, "yyyy-MM-dd"),
    time: timeStr || format(targetDate, "HH:mm"),
    timezone: "Asia/Dhaka",
    recurrence,
    reminder_offsets,
    priority: "NORMAL",
    category: "General",
    response_message: recurrence
      ? `ঠিক আছে! ${recurrence.frequency === "MONTHLY" ? "প্রতি মাসের" : recurrence.frequency === "WEEKLY" ? "প্রতি সপ্তাহের" : "নিয়মিত"} '${cleanTitle}' রিমাইন্ডার সেট করা হয়েছে।`
      : minMatch
      ? `✅ ঠিক আছে! ঠিক ${minMatch[1]} মিনিট পর (${format(targetDate, "hh:mm a")}) আপনাকে '${cleanTitle}' এর কথা মনে করিয়ে দেব।`
      : hrMatch
      ? `✅ ঠিক আছে! ঠিক ${hrMatch[1]} ঘণ্টা পর (${format(targetDate, "hh:mm a")}) আপনাকে '${cleanTitle}' এর কথা মনে করিয়ে দেব।`
      : `ঠিক আছে! ${format(targetDate, "dd MMMM yyyy")} ${timeStr ? `সময় ${timeStr}` : ""} তারিখে '${cleanTitle}' মনে করিয়ে দেওয়া হবে।`,
    detected_language: "bn",
  };
}
