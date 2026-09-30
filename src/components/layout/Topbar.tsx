"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  Plus,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Repeat,
  BrainCircuit,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Topbar({
  onQuickAdd,
  title,
  subtitle,
}: {
  onQuickAdd?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isTgConnected = user?.telegram?.isConnected;

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

  if (user?.role === "ADMIN") {
    navItems.push({ label: "অ্যাডমিন প্যানেল", href: "/admin", icon: ShieldCheck });
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
              {title || `স্বাগতম, ${user?.name || "ইউজার"}! 👋`}
            </h2>
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telegram Status Pill */}
          <Link
            href="/dashboard/telegram"
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all border ${
              isTgConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Send className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isTgConnected ? "text-emerald-600" : "text-amber-600"}`} />
            <span className="hidden xs:inline">{isTgConnected ? `@${user?.telegram?.username || "Connected"}` : "Connect Telegram"}</span>
            <span className="xs:hidden">{isTgConnected ? "Connected" : "Connect"}</span>
          </Link>

          {/* Quick Add Button */}
          {onQuickAdd && (
            <button
              onClick={onQuickAdd}
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-102 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>যোগ করুন</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-[82%] max-w-xs bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-bold text-base leading-tight tracking-tight text-slate-900">
                    MoneRakhbe <span className="text-indigo-600">AI</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium">স্মার্ট পার্সোনাল অ্যাসিস্ট্যান্ট</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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

            {/* User Profile & Logout */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || "ইউজার"}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

