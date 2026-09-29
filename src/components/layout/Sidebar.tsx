"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Repeat,
  BrainCircuit,
  CheckSquare,
  CalendarDays,
  Send,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard },
    { label: "আজকের রিমাইন্ডার", href: "/dashboard/today", icon: CalendarCheck },
    { label: "আসন্ন তালিকা", href: "/dashboard/upcoming", icon: Clock },
    { label: "সব রিমাইন্ডার", href: "/dashboard/reminders", icon: CalendarDays },
    { label: "পৌনঃপুনিক (Recurring)", href: "/dashboard/recurring", icon: Repeat },
    { label: "টাস্ক ম্যানেজার", href: "/dashboard/tasks", icon: CheckSquare },
    { label: "মেমোরি ভল্ট (Memory)", href: "/dashboard/memory", icon: BrainCircuit },
    { label: "ক্যালেন্ডার ভিউ", href: "/dashboard/calendar", icon: CalendarDays },
    { label: "AI চ্যাট অ্যাসিস্ট্যান্ট", href: "/dashboard/chat", icon: MessageSquare },
    { label: "টেলিগ্রাম কানেকশন", href: "/dashboard/telegram", icon: Send },
    { label: "সেটিংস", href: "/dashboard/settings", icon: Settings },
    { label: "বিলিং ও প্ল্যান", href: "/dashboard/billing", icon: CreditCard },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen fixed left-0 top-0 bottom-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900">
              MoneRakhbe <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">স্মার্ট পার্সোনাল অ্যাসিস্ট্যান্ট</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || "ইউজার"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="লগআউট"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
