"use client";

import { useState } from "react";
import { X, Bell, Calendar, Repeat, Sparkles } from "lucide-react";

export default function ReminderModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("17:00");
  const [priority, setPriority] = useState("NORMAL");
  const [categoryName, setCategoryName] = useState("General");
  const [offsets, setOffsets] = useState<string[]>(["at_time", "1_day_before"]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setError("শিরোনাম এবং তারিখ দিন");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const combinedDateTime = new Date(`${dueDate}T${dueTime || "09:00"}:00`);

      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        dueAt: combinedDateTime.toISOString(),
        priority,
        categoryName,
        offsets,
      };

      if (isRecurring) {
        payload.recurrence = {
          frequency,
          interval: 1,
          timeOfDay: dueTime,
        };
      }

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create reminder");

      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const toggleOffset = (val: string) => {
    if (offsets.includes(val)) {
      setOffsets(offsets.filter((o) => o !== val));
    } else {
      setOffsets([...offsets, val]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">নতুন রিমাইন্ডার তৈরি করুন</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              রিমাইন্ডার বিষয় / শিরোনাম *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: ক্লায়েন্টকে ফোন দেওয়া, ইন্টারনেট বিল দেওয়া"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিস্তারিত বিবরণ (অপশনাল)
            </label>
            <textarea
              rows={2}
              placeholder="প্রয়োজনীয় নোট..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">সময়</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Recurrence Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-800">
                  পৌনঃপুনিক (Recurring Reminder)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            {isRecurring && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      frequency === freq
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {freq === "DAILY" ? "প্রতিদিন" : freq === "WEEKLY" ? "প্রতি সপ্তাহে" : freq === "MONTHLY" ? "প্রতি মাসে" : "প্রতি বছর"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Offsets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              কখন নোটিফিকেশন পেতে চান?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "at_time", label: "নির্দিষ্ট সময়ে" },
                { id: "1_hour_before", label: "১ ঘণ্টা আগে" },
                { id: "1_day_before", label: "১ দিন আগে" },
                { id: "3_days_before", label: "৩ দিন আগে" },
              ].map((item) => {
                const active = offsets.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleOffset(item.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? "সংরক্ষণ হচ্ছে..." : "রিমাইন্ডার সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
