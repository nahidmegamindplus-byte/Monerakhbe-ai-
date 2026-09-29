"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ReminderCard, { ReminderItem } from "@/components/reminders/ReminderCard";
import ReminderModal from "@/components/reminders/ReminderModal";
import { Clock, CalendarDays } from "lucide-react";

export default function UpcomingPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [scope, setScope] = useState<"next_7_days" | "this_month">("next_7_days");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reminders?filter=${scope}`);
      const data = await res.json();
      if (data.success) setReminders(data.reminders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, [scope]);

  return (
    <div>
      <Topbar
        title="আসন্ন রিমাইন্ডার তালিকা ⏰"
        subtitle="সামনের দিনগুলোর শিডিউল ও পরিকল্পনা"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Scope selector */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setScope("next_7_days")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === "next_7_days" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            আগামী ৭ দিন
          </button>
          <button
            onClick={() => setScope("this_month")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === "this_month" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            এই মাস (This Month)
          </button>
        </div>

        {reminders.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">কোনো আসন্ন রিমাইন্ডার নেই</h3>
            <p className="text-xs text-slate-500 mt-1">নতুন কোনো পরিকল্পনা যোগ করতে রিমাইন্ডার তৈরি করুন।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onStatusChange={fetchUpcoming}
                onDelete={fetchUpcoming}
                onSnooze={fetchUpcoming}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchUpcoming}
      />
    </div>
  );
}
