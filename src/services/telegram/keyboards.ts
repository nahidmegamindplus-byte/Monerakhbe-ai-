export function getReminderActionKeyboard(reminderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "👁️ দেখেছি (নোটিফিকেশন বন্ধ)", callback_data: `seen:${reminderId}` },
      ],
      [
        { text: "✅ কাজ সম্পন্ন (Done)", callback_data: `done:${reminderId}` },
        { text: "⏳ ১০ মিনিট পর", callback_data: `snooze:10m:${reminderId}` },
      ],
      [
        { text: "⏰ ১ ঘণ্টা পর", callback_data: `snooze:1h:${reminderId}` },
        { text: "🗑️ ডিলিট", callback_data: `delete:${reminderId}` },
      ],
    ],
  };
}

export function getFollowUpKeyboard(reminderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "👁️ দেখেছি (নোটিফিকেশন বন্ধ)", callback_data: `seen:${reminderId}` },
      ],
      [
        { text: "✅ সম্পন্ন", callback_data: `done:${reminderId}` },
        { text: "⏰ ১ ঘণ্টা পর", callback_data: `snooze:1h:${reminderId}` },
      ],
      [
        { text: "🗑️ ডিলিট", callback_data: `delete:${reminderId}` },
      ],
    ],
  };
}

export function getQuickHelpKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 সব রিমাইন্ডার", callback_data: "cmd:all_reminders" },
        { text: "📅 আজকের রিমাইন্ডার", callback_data: "cmd:today_reminders" },
      ],
      [
        { text: "📝 আজকের কাজের লিস্ট", callback_data: "cmd:today_tasks" },
        { text: "🧠 মেমোরি সমূহ", callback_data: "cmd:memory" },
      ],
    ],
  };
}

export function getMultimodalConfirmationKeyboard(memoryId: string, reminderPayloadKey: string) {
  return {
    inline_keyboard: [
      [
        { text: "💾 Save as Memory", callback_data: `mm_action:save_only:${memoryId}` },
        { text: "🔔 Create Reminder", callback_data: `mm_action:create_rem:${memoryId}:${reminderPayloadKey}` },
      ],
      [
        { text: "⚡ Both (Memory + Reminder)", callback_data: `mm_action:both:${memoryId}:${reminderPayloadKey}` },
        { text: "❌ Ignore", callback_data: `mm_action:ignore:${memoryId}` },
      ],
    ],
  };
}

export function getConnectAccountKeyboard(appUrl?: string) {
  const url = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    inline_keyboard: [
      [
        { text: "🔗 টেলিগ্রাম অ্যাকাউন্ট কানেক্ট করুন", url: `${url}/dashboard/telegram` },
      ],
      [
        { text: "💡 সাহায্য / নিয়মাবলী", callback_data: "cmd:help" },
      ],
    ],
  };
}



