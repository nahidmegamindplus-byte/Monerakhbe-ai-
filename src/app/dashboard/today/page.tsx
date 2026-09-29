"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ReminderCard, { ReminderItem } from "@/components/reminders/ReminderCard";
import ReminderModal from "@/components/reminders/ReminderModal";
import { CalendarCheck, Clock, Plus } from "lucide-react";

export default function TodayPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders?filter=today");
      const data = await res.json();
      if (data.success) setReminders(data.reminders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  return (
    <div>
      <Topbar
        title="আজকের রিমাইন্ডারসমূহ 📅"
        subtitle="আজ সারাদিনের সব কাজ ও শিডিউল"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">
        {reminders.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CalendarCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">আজ আর কোনো রিমাইন্ডার বাকি নেই! 🎉</h3>
            <p className="text-xs text-slate-500 mt-1">সব কাজ সম্পন্ন বা আজকের জন্য কোনো শিডিউল নেই।</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              + নতুন রিমাইন্ডার যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onStatusChange={fetchToday}
                onDelete={fetchToday}
                onSnooze={fetchToday}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchToday}
      />
    </div>
  );
}
