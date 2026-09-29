"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ReminderCard, { ReminderItem } from "@/components/reminders/ReminderCard";
import ReminderModal from "@/components/reminders/ReminderModal";
import TaskCard, { TaskItem } from "@/components/tasks/TaskCard";
import TelegramSyncCard from "@/components/telegram/TelegramSyncCard";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarCheck,
  Clock,
  BrainCircuit,
  CheckSquare,
  Sparkles,
  Send,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remRes, taskRes, billRes] = await Promise.all([
        fetch("/api/reminders"),
        fetch("/api/tasks"),
        fetch("/api/billing/history"),
      ]);

      const remData = await remRes.json();
      const taskData = await taskRes.json();
      const billData = await billRes.json();

      if (remData.success) setReminders(remData.reminders || []);
      if (taskData.success) setTasks(taskData.tasks || []);
      if (billData.success && billData.orders) {
        const pending = billData.orders.find((o: any) => o.status === "PENDING" || o.status === "PROCESSING");
        setPendingOrder(pending || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || aiLoading) return;

    setAiLoading(true);
    setAiMessage("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: quickInput.trim() }),
      });
      const data = await res.json();
      setAiMessage(data.message || "কাজটি সফলভাবে সম্পন্ন হয়েছে!");
      setQuickInput("");
      fetchData();
      refreshUser();
    } catch (err) {
      setAiMessage("প্রসেস করতে সমস্যা হয়েছে।");
    } finally {
      setAiLoading(false);
    }
  };

  const pendingReminders = reminders.filter((r) => r.status === "PENDING" || r.status === "SNOOZED");
  const overdueReminders = reminders.filter(
    (r) => r.status === "OVERDUE" || (new Date(r.dueAt) < new Date() && r.status === "PENDING")
  );

  return (
    <div>
      <Topbar onQuickAdd={() => setIsModalOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Pending Payment Verification Warning Banner */}
        {pendingOrder && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase">
                    ভেরিফিকেশন অপেক্ষমান
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    আপনার ৳{pendingOrder.amount} টাকার {pendingOrder.plan?.name || "Pro"} প্যাকেজ অর্ডারটি রিভিউতে আছে
                  </p>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  TrxID: <span className="font-mono font-bold text-slate-900">{pendingOrder.providerTransactionId || pendingOrder.orderNumber}</span> • অ্যাডমিন প্যানেল থেকে কনফার্ম করলেই সকল প্রিমিয়াম ফিচার আনলক হবে।
                </p>
              </div>
            </div>

            <Link
              href={`/payment/pending?orderId=${pendingOrder.id}`}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shrink-0 text-center shadow-sm shadow-amber-600/20 transition-all hover:scale-105"
            >
              লাইভ স্ট্যাটাস দেখুন
            </Link>
          </div>
        )}

        {/* Free Plan Upgrade Banner */}
        {user?.plan === "FREE" && !pendingOrder && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  আপনি বর্তমানে ফ্রি (Free Basic) প্যাকেজ ব্যবহার করছেন
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  আনলিমিটেড এআই রিকোয়েস্ট, রিমাইন্ডার ও মেমোরি আনলক করতে বিকাশ/নগদ দিয়ে পেমেন্ট করে অর্ডার করুন।
                </p>
              </div>
            </div>

            <Link
              href="/checkout?plan=PRO"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shrink-0 text-center shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              পেমেন্ট করে অর্ডার করুন
            </Link>
          </div>
        )}

        {/* Telegram Sync Banner */}
        <TelegramSyncCard />

        {/* Quick AI Capture Bar */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              কুইক AI ক্যাপচার (প্রাকৃতিক ভাষায় লিখুন)
            </h3>
          </div>

          <form onSubmit={handleQuickCapture} className="flex gap-2">
            <input
              type="text"
              placeholder="যেমন: কাল বিকেল ৫টায় ক্লায়েন্টকে ফোন করার কথা মনে করিয়ে দিও..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!quickInput.trim() || aiLoading}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all hover:scale-102 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{aiLoading ? "বিশ্লেষণ হচ্ছে..." : "AI সেভ"}</span>
            </button>
          </form>

          {aiMessage && (
            <div className="mt-3 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed whitespace-pre-line">
              {aiMessage}
            </div>
          )}
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">পেন্ডিং রিমাইন্ডার</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{pendingReminders.length}</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">ওভারডিউ (Overdue)</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{overdueReminders.length}</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">সংরক্ষিত মেমোরি</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <BrainCircuit className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {user?.stats?.memoriesCount || 0}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">পেন্ডিং টাস্ক</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {tasks.filter((t) => t.status !== "COMPLETED").length}
            </p>
          </div>
        </div>

        {/* Main Grid: Reminders List & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Reminders */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                আসন্ন রিমাইন্ডারসমূহ
              </h3>
              <Link
                href="/dashboard/reminders"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                সবগুলো দেখুন <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {pendingReminders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">কোনো পেন্ডিং রিমাইন্ডার নেই</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold"
                >
                  + রিমাইন্ডার যোগ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.slice(0, 5).map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onStatusChange={fetchData}
                    onDelete={fetchData}
                    onSnooze={fetchData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right 1 Column: Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                কাজের তালিকা (Tasks)
              </h3>
              <Link
                href="/dashboard/tasks"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                টাস্ক দেখুন <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 4).map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={fetchData}
                  onDelete={fetchData}
                />
              ))}
              {tasks.length === 0 && (
                <div className="p-6 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400">
                  কোনো টাস্ক নেই
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
