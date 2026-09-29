"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ReminderCard, { ReminderItem } from "@/components/reminders/ReminderCard";
import ReminderModal from "@/components/reminders/ReminderModal";
import { Repeat, Clock, AlertCircle } from "lucide-react";

export default function RecurringPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders?filter=recurring");
      const data = await res.json();
      if (data.success) setReminders(data.reminders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  return (
    <div>
      <Topbar
        title="পৌনঃপুনিক রিমাইন্ডার (Recurring) 🔁"
        subtitle="দৈনিক, সাপ্তাহিক, মাসিক বা বার্ষিক পুনরাবৃত্তিমূলক শিডিউল"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-start gap-3 text-xs text-purple-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            <b>স্মার্ট রিক্যাকারেন্স রুল:</b> পৌনঃপুনিক রিমাইন্ডার সম্পন্ন হলে এর বর্তমান চক্র সম্পূর্ণ হয় এবং পরবর্তী নির্ধারিত সময়ের জন্য স্বয়ংক্রিয়ভাবে নতুন অকারেন্স তৈরি হয়।
          </p>
        </div>

        {reminders.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">কোনো Recurring রিমাইন্ডার নেই</h3>
            <p className="text-xs text-slate-500 mt-1">
              মাসিক বিল বা নিয়মিত মিটিংয়ের জন্য পুনরাবৃত্তিমূলক রিমাইন্ডার সেট করুন।
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
            >
              + Recurring রিমাইন্ডার তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onStatusChange={fetchRecurring}
                onDelete={fetchRecurring}
                onSnooze={fetchRecurring}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchRecurring}
      />
    </div>
  );
}
