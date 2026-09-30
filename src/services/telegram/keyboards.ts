export function getReminderActionKeyboard(reminderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Done", callback_data: `done:${reminderId}` },
        { text: "⏳ Snooze 1h", callback_data: `snooze:1h:${reminderId}` },
      ],
      [
        { text: "⏰ Snooze 3h", callback_data: `snooze:3h:${reminderId}` },
        { text: "📅 Tomorrow", callback_data: `snooze:tomorrow:${reminderId}` },
      ],
      [
        { text: "🗑️ Delete", callback_data: `delete:${reminderId}` },
      ],
    ],
  };
}

export function getFollowUpKeyboard(reminderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Done", callback_data: `done:${reminderId}` },
        { text: "⏰ Remind Later", callback_data: `snooze:1h:${reminderId}` },
      ],
      [
        { text: "❌ Not Needed", callback_data: `delete:${reminderId}` },
      ],
    ],
  };
}

export function getQuickHelpKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 আজকের রিমাইন্ডার", callback_data: "cmd:today" },
        { text: "📅 আগামী ৭ দিন", callback_data: "cmd:7days" },
      ],
      [
        { text: "🧠 মেমোরি সমূহ", callback_data: "cmd:memory" },
        { text: "🔁 Recurring", callback_data: "cmd:recurring" },
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



