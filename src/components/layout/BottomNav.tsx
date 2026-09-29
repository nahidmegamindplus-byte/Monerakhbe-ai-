"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BrainCircuit, CheckSquare, MessageSquare } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navs = [
    { label: "হোম", href: "/dashboard", icon: LayoutDashboard },
    { label: "রিমাইন্ডার", href: "/dashboard/reminders", icon: CalendarDays },
    { label: "AI চ্যাট", href: "/dashboard/chat", icon: MessageSquare },
    { label: "মেমোরি", href: "/dashboard/memory", icon: BrainCircuit },
    { label: "টাস্ক", href: "/dashboard/tasks", icon: CheckSquare },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navs.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-indigo-600 stroke-[2.2]" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
