"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, MessageCircle, ArrowRight, User } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
              MoneRakhbe <span className="text-indigo-600 font-extrabold">AI</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Smart Memory & Reminder
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">
            ফিচারসমূহ
          </Link>
          <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">
            কীভাবে কাজ করে
          </Link>
          <Link href="#demo" className="hover:text-indigo-600 transition-colors">
            লাইভ ডেমো
          </Link>
          <Link href="#pricing" className="hover:text-indigo-600 transition-colors">
            প্রাইসিং
          </Link>
          <Link href="#faq" className="hover:text-indigo-600 transition-colors">
            প্রশ্নোত্তর
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <User className="w-4 h-4" />
              ড্যাশবোর্ড
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                লগইন
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                শুরু করুন
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
