"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ReminderCard, { ReminderItem } from "@/components/reminders/ReminderCard";
import ReminderModal from "@/components/reminders/ReminderModal";
import { Search, Filter, CalendarDays, Plus } from "lucide-react";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      let url = `/api/reminders?status=${status}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setReminders(data.reminders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [status, search]);

  return (
    <div>
      <Topbar
        title="সব রিমাইন্ডারসমূহ 🔔"
        subtitle="আপনার তৈরি করা সমস্ত রিমাইন্ডারের তালিকা"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="রিমাইন্ডার খুঁজুন (যেমন: বাড়ি, বিল, মিটিং)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">সব স্ট্যাটাস (All)</option>
              <option value="PENDING">চলমান (Pending)</option>
              <option value="COMPLETED">সম্পন্ন (Completed)</option>
              <option value="SNOOZED">স্নুজ করা (Snoozed)</option>
              <option value="OVERDUE">ওভারডিউ (Overdue)</option>
            </select>
          </div>
        </div>

        {reminders.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">কোনো রিমাইন্ডার পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1">ফিল্টার পরিবর্তন করুন অথবা নতুন রিমাইন্ডার যোগ করুন।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onStatusChange={fetchReminders}
                onDelete={fetchReminders}
                onSnooze={fetchReminders}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchReminders}
      />
    </div>
  );
}
