"use client";

import { useState } from "react";
import { formatFriendlyDate } from "@/lib/date-utils";
import {
  Bell,
  CheckCircle2,
  Clock,
  MoreVertical,
  Repeat,
  Trash2,
  AlertCircle,
  Clock3,
} from "lucide-react";

export interface ReminderItem {
  id: string;
  title: string;
  description?: string | null;
  dueAt: string;
  status: string;
  priority: string;
  categoryName: string;
  recurrence?: {
    frequency: string;
    interval: number;
  } | null;
  notifications?: {
    id: string;
    scheduledFor: string;
    status: string;
  }[];
}

export default function ReminderCard({
  reminder,
  onStatusChange,
  onDelete,
  onSnooze,
}: {
  reminder: ReminderItem;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onSnooze?: (id: string, duration: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isCompleted = reminder.status === "COMPLETED";
  const isOverdue = reminder.status === "OVERDUE" || (new Date(reminder.dueAt) < new Date() && !isCompleted);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      onStatusChange?.(reminder.id, "COMPLETED");
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (duration: string) => {
    setShowMenu(false);
    setLoading(true);
    try {
      await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", duration }),
      });
      onSnooze?.(reminder.id, duration);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!confirm("আপনি কি নিশ্চিত এই রিমাইন্ডারটি ডিলিট করতে চান?")) return;
    setLoading(true);
    try {
      await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      onDelete?.(reminder.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? "bg-slate-50/60 border-slate-200/60 opacity-60"
          : isOverdue
          ? "bg-rose-50/40 border-rose-200/80 shadow-xs"
          : "bg-white border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Complete Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={handleComplete}
            disabled={loading || isCompleted}
            className={`mt-0.5 rounded-full p-0.5 transition-colors ${
              isCompleted
                ? "text-emerald-600"
                : "text-slate-300 hover:text-indigo-600 focus:outline-none"
            }`}
            title={isCompleted ? "সম্পন্ন হয়েছে" : "সম্পন্ন হিসেবে চিহ্নিত করুন"}
          >
            <CheckCircle2 className={`w-5 h-5 ${isCompleted ? "fill-emerald-100" : ""}`} />
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold text-slate-900 leading-snug break-words ${
                isCompleted ? "line-through text-slate-400" : ""
              }`}
            >
              {reminder.title}
            </h4>

            {reminder.description && reminder.description !== reminder.title && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {reminder.description}
              </p>
            )}

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  isOverdue && !isCompleted
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : "bg-indigo-50 text-indigo-700"
                }`}
              >
                <Clock className="w-3 h-3" />
                {formatFriendlyDate(reminder.dueAt)}
              </span>

              {reminder.recurrence && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                  <Repeat className="w-3 h-3" />
                  {reminder.recurrence.frequency}
                </span>
              )}

              {reminder.categoryName && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {reminder.categoryName}
                </span>
              )}

              {reminder.priority === "HIGH" && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  <AlertCircle className="w-2.5 h-2.5" /> High Priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Menu for Snooze / Delete */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-xs font-medium text-slate-700">
              <button
                onClick={() => handleSnooze("1h")}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2"
              >
                <Clock3 className="w-3.5 h-3.5 text-indigo-500" />
                Snooze 1 ঘণ্টা
              </button>
              <button
                onClick={() => handleSnooze("tomorrow")}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2"
              >
                <Clock3 className="w-3.5 h-3.5 text-indigo-500" />
                আগামীকাল
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ডিলিট করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
