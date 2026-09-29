"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import InteractiveDemo from "@/components/demo/InteractiveDemo";
import {
  Sparkles,
  Send,
  Calendar,
  Repeat,
  BrainCircuit,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Zap,
  Star,
  Users,
  Briefcase,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold mb-6 shadow-xs animate-float">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>প্রাকৃতিক বাংলা ও বাংলিশ সাপোর্টেড AI সহকারী</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            আপনি ভুলে গেলেও, <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
              MoneRakhbe AI
            </span>{" "}
            মনে রাখবে।
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Telegram-এ শুধু স্বাভাবিকভাবে বলে দিন কী মনে রাখতে হবে। AI আপনার কাজ, রিমাইন্ডার এবং গুরুত্বপূর্ণ ব্যক্তিগত তথ্য মনে রাখবে এবং ঠিক সময়ে আপনাকে নোটিফিকেশন পাঠাবে।
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              ফ্রি শুরু করুন (Get Started Free)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-base font-bold border border-slate-200/80 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              লাইভ ডেমো ট্রাই করুন
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>১০০% নিরাপদ ও এনক্রিপ্টেড</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>কোনো অ্যাপ ইনস্টল ছাড়াই Telegram-এ কাজ করে</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Section */}
      <section id="demo" className="py-16 bg-slate-100 border-y border-slate-200/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveDemo />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">সহজ ৩ ধাপ</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              কীভাবে কাজ করে MoneRakhbe AI?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center mb-6 shadow-md shadow-indigo-600/20">
                ১
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Telegram কানেক্ট করুন</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                ওয়েবসাইটে সাইন আপ করে মাত্র ১ ক্লিকে আপনার টেলিগ্রাম একাউন্ট কানেক্ট করুন।
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center mb-6 shadow-md shadow-purple-600/20">
                ২
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">স্বাভাবিক ভাষায় মেসেজ দিন</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                বটকে বলুন — &ldquo;কাল ৫টায় রাকিবকে ফোন দিতে হবে&rdquo; অথবা &ldquo;১২ ডিসেম্বর ভাইয়ের জন্মদিন, মনে রেখো&rdquo;।
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mb-6 shadow-md shadow-emerald-600/20">
                ৩
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">সঠিক সময়ে মনে করিয়ে দেবে</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                নির্দিষ্ট সময়ে টেলিগ্রামে সরাসরি অ্যালার্ট পাবেন। সম্পন্ন হলে ১ ক্লিকে Done বা Snooze করতে পারবেন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">পাওয়ারফুল ফিচার</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              সাধারণ রিমাইন্ডার অ্যাপ নয়, একটি পূর্ণাঙ্গ স্মার্ট সিস্টেম
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">স্মার্ট ডেট ও টাইম পার্সিং</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;কাল বিকেলে&rdquo;, &ldquo;পরের শুক্রবার&rdquo;, &ldquo;১০ দিন পর&rdquo; — যেকোনো আপেক্ষিক তারিখ নিখুঁতভাবে হিসেব করে।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">ব্যক্তিগত মেমোরি ভল্ট (Memory)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                পাসপোর্ট রিনিউয়াল, অফিসের ঠিকানা, স্বজনদের জন্মদিন সংরক্ষণ করুন এবং যেকোনো সময় জিজ্ঞাসা করলেই AI উত্তর দেবে।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4">
                <Repeat className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">পৌনঃপুনিক শিডিউল (Recurring)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                দৈনিক, সাপ্তাহিক, মাসিক বা বার্ষিক বিল ও মিটিং এর রিমাইন্ডার স্বয়ংক্রিয়ভাবে চক্রাকারে আপডেট হতে থাকে।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">পূর্ণাঙ্গ ক্যালেন্ডার ভিউ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                মাসিক, সাপ্তাহিক এবং দৈনিক ভিউতে আপনার সব রিমাইন্ডার এবং কাজের শিডিউল এক নজরে পর্যবেক্ষণ করুন।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 w-fit mb-4">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">ইন্টারেক্টিভ টেলিগ্রাম বাটন</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                নোটিফিকেশন আসার সাথে সাথে [Done], [Snooze 1h], [Tomorrow] বাটনে ক্লিক করে মুহূর্তের মধ্যে অ্যাকশন নিন।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 w-fit mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">স্মার্ট ফলো-আপ ও নো-স্প্যাম</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                কোনো কাজ মিস হলে বিরক্তি না করে ভদ্রভাবে ফলো-আপ দেয়। কখনোই স্প্যাম করে বিরক্ত করে না।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience / Use Cases */}
      <section className="py-20 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">কাদের জন্য?</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              সবার দৈনন্দিন জীবনের বিশ্বস্ত সঙ্গী
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <Briefcase className="w-8 h-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-base text-slate-900">চাকরিজীবী ও ফ্রিল্যান্সার</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                ক্লায়েন্ট কল, মিটিং, প্রপোজাল জমা এবং প্রজেক্টের ডেডলাইন সময়মতো ম্যানেজ করুন।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <GraduationCap className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-base text-slate-900">শিক্ষার্থী</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                অ্যাসাইনমেন্ট সাবমিশন, পরীক্ষার শিডিউল এবং গুরুত্বপূর্ণ ক্লাসের সময় মনে রাখুন।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <Users className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-base text-slate-900">ব্যবসায়ী ও উদ্যোক্তা</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                বিলের তারিখ, ভেন্ডর পেমেন্ট, স্টক রিঅর্ডার এবং ট্যাক্স ফাইলিং ডেট সহজে ট্র্যাক করুন।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <HeartHandshake className="w-8 h-8 text-rose-600 mb-3" />
              <h4 className="font-bold text-base text-slate-900">পারিবারিক ও দৈনন্দিন ব্যবহার</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                ডাক্তারের অ্যাপয়েন্টমেন্ট, ওষুধের সময়, জন্মদিনের শুভেচ্ছা এবং বাসার বাজার তালিকা।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">সহজ প্ল্যান</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              আপনার প্রয়োজন অনুযায়ী প্ল্যান বেছে নিন
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900">ফ্রি (Free)</h4>
                <p className="text-xs text-slate-500 mt-1">ব্যক্তিগত ট্রায়ালের জন্য</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">৳০</span>
                  <span className="text-xs text-slate-500"> / আজীবন</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ৫০টি রিমাইন্ডার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ৩০টি মেমোরি স্টোরেজ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> টেলিগ্রাম বট ইন্টিগ্রেশন
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> প্রাকৃতিক বাংলা NLU
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                ফ্রি শুরু করুন
              </Link>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900 to-slate-950 text-white shadow-2xl border-2 border-indigo-500 relative flex flex-col justify-between scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                সবচেয়ে জনপ্রিয় (Most Popular)
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">প্রো (Pro)</h4>
                <p className="text-xs text-indigo-200 mt-1">প্রফেশনাল ও ফ্রিল্যান্সারদের জন্য</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-white">৳২৯৯</span>
                  <span className="text-xs text-indigo-300"> / মাস</span>
                </div>
                <ul className="space-y-3 text-xs text-indigo-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ৫০০টি রিমাইন্ডার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ১,০০০টি মেমোরি স্টোরেজ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> অ্যাডভান্সড Recurring রিমাইন্ডার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ফুল ক্যালেন্ডার ও ফলো-আপ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> প্রায়োরিটি এআই প্রসেসিং
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block text-center py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-102"
              >
                প্রো ট্রায়াল শুরু করুন
              </Link>
            </div>

            {/* Business Plan */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900">বিজনেস (Business)</h4>
                <p className="text-xs text-slate-500 mt-1">টিম ও ব্যবসার জন্য</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">৳৯৯৯</span>
                  <span className="text-xs text-slate-500"> / মাস</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> আনলিমিটেড রিমাইন্ডার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> আনলিমিটেড মেমোরি
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> মাল্টিপল ইউজার ও টিম ফিচার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ২৪/৭ ডেডিকেটেড সাপোর্ট
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                যোগাযোগ করুন
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">সাধারণ প্রশ্ন</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              সচরাচর জিজ্ঞাসিত প্রশ্নাবলী
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "টেলিগ্রামে কীভাবে রিমাইন্ডার সেট করব?",
                a: "অ্যাকাউন্ট তৈরি করে 'Connect Telegram' বাটনে ক্লিক করে বটে /start দিন। এরপর সাধারণ বাংলায় যেকোনো রিমাইন্ডারের কথা লিখলেই বট স্বয়ংক্রিয়ভাবে বুঝে সংরক্ষণ করে নেবে।",
              },
              {
                q: "AI কি সত্যি বাংলা এবং বাংলিশ বুঝতে পারে?",
                a: "হ্যাঁ! Google Gemini এবং আমাদের কাস্টম NLU মডেল দিয়ে MoneRakhbe AI শুদ্ধ বাংলা, আঞ্চলিক বাংলা, বাংলিশ এবং ইংরেজি নিখুঁতভাবে বুঝতে পারে।",
              },
              {
                q: "আমার সংরক্ষিত ব্যক্তিগত তথ্য কি নিরাপদ?",
                a: "সম্পূর্ণ নিরাপদ। প্রতিটি ইউজারের ডেটা সম্পূর্ণ আলাদা এবং ইন্ডাস্ট্রি-স্ট্যান্ডার্ড এনক্রিপশন ও পাসওয়ার্ড সিকিউরিটি নিশ্চিত করা হয়েছে।",
              },
              {
                q: "মেমোরি (Memory) এবং রিমাইন্ডার (Reminder)-এর মধ্যে পার্থক্য কী?",
                a: "রিমাইন্ডার হলো কোনো নির্দিষ্ট সময়ে মনে করিয়ে দেওয়ার কাজ (যেমন: 'কাল ৫টায় ফোন দাও')। মেমোরি হলো প্রয়োজনীয় তথ্য সংরক্ষণ (যেমন: 'আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর') যা আপনি ভবিষ্যতে যেকোনো সময় জিজ্ঞাসা করতে পারবেন।",
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-base font-bold text-slate-900">{faq.q}</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">MoneRakhbe AI</span>
            <span>— আপনি ভুলে গেলেও, মনে রাখবে।</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              গোপনীয়তা নীতি (Privacy Policy)
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              ব্যবহারের শর্তাবলী (Terms)
            </Link>
          </div>

          <p>© {new Date().getFullYear()} MoneRakhbe AI. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
}
