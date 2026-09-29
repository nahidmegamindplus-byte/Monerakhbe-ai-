export type UserRole = "USER" | "ADMIN";
export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";
export type ReminderStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "SNOOZED" | "OVERDUE";
export type PriorityLevel = "LOW" | "NORMAL" | "HIGH";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";
export type NotificationChannel = "TELEGRAM" | "EMAIL" | "WEB";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  timezone: string;
  language: string;
  plan: SubscriptionPlan;
}

export type MemoryCategory =
  | "Family"
  | "Work"
  | "Finance"
  | "Personal"
  | "Important Dates"
  | "Contacts"
  | "Custom";

export interface AIIntentResult {
  intent:
    | "create_reminder"
    | "create_memory"
    | "create_task"
    | "query_reminders"
    | "query_memories"
    | "query_tasks"
    | "edit_reminder"
    | "delete_reminder"
    | "complete_reminder"
    | "snooze_reminder"
    | "delete_memory"
    | "clarification_needed"
    | "general_chat";
  
  // Reminders & Tasks fields
  title?: string | null;
  description?: string | null;
  date?: string | null; // YYYY-MM-DD
  time?: string | null; // HH:mm:ss or HH:mm
  timezone?: string;
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval?: number;
    dayOfWeek?: number | null; // 0-6
    dayOfMonth?: number | null; // 1-31
    month?: number | null; // 1-12
    timeOfDay?: string | null;
  } | null;
  reminder_offsets?: string[]; // e.g. ["at_time", "3_days_before", "1_day_before", "1_hour_before"]
  priority?: PriorityLevel;
  category?: string;

  // Memory fields
  memory_category?: MemoryCategory;
  memory_key?: string | null;
  memory_value?: string | null;

  // Filter / Query fields
  query_scope?: "today" | "tomorrow" | "next_7_days" | "this_month" | "this_week" | "recurring" | "completed" | "overdue" | "all";
  target_reference?: string | null; // e.g. "bari jaoa", "brother birthday", "client call"

  // Clarification
  clarification_question?: string | null;
  
  // Natural language response
  response_message?: string;
  detected_language?: "bn" | "en" | "banglish";
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}
