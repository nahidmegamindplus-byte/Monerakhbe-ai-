"use client";

import { useAuth } from "@/context/AuthContext";
import { Send, Plus, Sparkles, Bell } from "lucide-react";
import Link from "next/link";

export default function Topbar({
  onQuickAdd,
  title,
  subtitle,
}: {
  onQuickAdd?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const { user } = useAuth();
  const isTgConnected = user?.telegram?.isConnected;

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {title || `স্বাগতম, ${user?.name || "ইউজার"}! 👋`}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Telegram Status Pill */}
        <Link
          href="/dashboard/telegram"
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            isTgConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <Send className={`w-3.5 h-3.5 ${isTgConnected ? "text-emerald-600" : "text-amber-600"}`} />
          <span>{isTgConnected ? `Telegram: @${user?.telegram?.username || "Connected"}` : "Connect Telegram"}</span>
        </Link>

        {/* Quick Add Button */}
        {onQuickAdd && (
          <button
            onClick={onQuickAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন যোগ করুন</span>
          </button>
        )}
      </div>
    </header>
  );
}
