"use client";

import Topbar from "@/components/layout/Topbar";
import TelegramSyncCard from "@/components/telegram/TelegramSyncCard";
import { Send, CheckCircle2, MessageSquare, Bell, ShieldCheck } from "lucide-react";

export default function TelegramPage() {
  return (
    <div>
      <Topbar
        title="টেলিগ্রাম বট ইন্টিগ্রেশন 🚀"
        subtitle="আপনার টেলিগ্রাম অ্যাকাউন্ট সংযুক্ত ও পরিচালনা করুন"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <TelegramSyncCard />

        {/* Telegram Guide & Examples */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              টেলিগ্রাম বটে আপনি কী কী বলতে পারেন?
            </h3>
            <p className="text-xs text-slate-500">
              কোনো জটিল কমান্ড মুখস্থ করার প্রয়োজন নেই। দৈনন্দিন স্বাভাবিক ভাষায় মেসেজ দিন:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-indigo-600 block mb-1">১-কালীন রিমাইন্ডার</span>
              <p className="text-slate-700 italic">&ldquo;আগামীকাল বিকেল ৫টায় রাকিবকে কল দেওয়ার কথা মনে করিয়ে দিও&rdquo;</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-purple-600 block mb-1">পৌনঃপুনিক (Recurring)</span>
              <p className="text-slate-700 italic">&ldquo;প্রতি মাসের ৫ তারিখে ইন্টারনেট বিল দেওয়ার কথা মনে করিয়ে দিও&rdquo;</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-emerald-600 block mb-1">ব্যক্তিগত মেমোরি সংরক্ষণ</span>
              <p className="text-slate-700 italic">&ldquo;১২ ডিসেম্বর আমার ভাইয়ের জন্মদিন, মনে রেখো&rdquo;</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-amber-600 block mb-1">রিমাইন্ডার ও মেমোরি খোঁজা</span>
              <p className="text-slate-700 italic">&ldquo;আমার আগামী ৭ দিনের reminder দেখাও&rdquo; বা &ldquo;ভাইয়ের জন্মদিন কবে?&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
