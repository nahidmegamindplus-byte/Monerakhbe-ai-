"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Send, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("bn");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [firstReminder, setFirstReminder] = useState("আজ রাত ১০টায় আমাকে পানি খাওয়ার কথা মনে করিয়ে দিও");
  const [loading, setLoading] = useState(false);

  const handleNextStep = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      setLoading(true);
      try {
        // Create first reminder via chat API
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: firstReminder }),
        });

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        setStep(5);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      await refreshUser();
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {step}/5
            </div>
            <span className="text-xs font-semibold text-slate-500">অনবোর্ডিং প্রসেস</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? "w-6 bg-indigo-600" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              স্বাগতম, {user?.name || "ইউজার"}! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              MoneRakhbe AI-তে আপনাকে স্বাগতম। আসুন এক মিনিটের মধ্যে আপনার পছন্দগুলো সেট করে নিই।
            </p>
          </div>
        )}

        {/* Step 2: Timezone & Language */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">টাইমজোন ও ভাষা নির্বাচন করুন</h2>
              <p className="text-xs text-slate-500 mt-1">সঠিক সময়ে নোটিফিকেশন পাঠানোর জন্য এটি জরুরি</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার টাইমজোন</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (+06:00, বাংলাদেশ)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (+05:30, ভারত)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (-05:00)</option>
                <option value="Europe/London">Europe/London (+00:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পছন্দের ভাষা</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage("bn")}
                  className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                    language === "bn"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🇧🇩 বাংলা (Bangla)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`p-3 rounded-2xl border text-xs font-semibold transition-all ${
                    language === "en"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Telegram Connection */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center">
              <Send className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">টেলিগ্রাম কানেক্ট করুন</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              টেলিগ্রাম কানেক্ট থাকলে আপনি যেকোনো সময় মেসেজ পাঠিয়ে রিমাইন্ডার তৈরি করতে পারবেন এবং যথাসময়ে এলার্ট পাবেন।
            </p>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-800">
              👉 আপনি ড্যাশবোর্ডে গিয়েও যেকোনো সময় কানেক্ট করতে পারবেন।
            </div>
          </div>
        )}

        {/* Step 4: Create First Reminder */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">আপনার প্রথম রিমাইন্ডার তৈরি করুন ✍️</h2>
              <p className="text-xs text-slate-500 mt-1">প্রাকৃতিক ভাষায় যেকোনো একটি কথা লিখে টেস্ট করুন</p>
            </div>

            <div>
              <textarea
                rows={3}
                value={firstReminder}
                onChange={(e) => setFirstReminder(e.target.value)}
                placeholder="যেমন: কাল বিকেল ৫টায় রাকিবকে ফোন দিতে হবে"
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Step 5: Completed */}
        {step === 5 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">সব প্রস্তুত! 🚀</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              আপনার প্রথম রিমাইন্ডার সফলভাবে তৈরি হয়েছে। চলুন ড্যাশবোর্ডে প্রবেশ করি।
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 && step < 5 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> আগের ধাপ
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNextStep}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-102"
          >
            {step === 5 ? "ড্যাশবোর্ডে যান" : step === 4 ? "রিমাইন্ডার সেভ করুন" : "পরবর্তী ধাপ"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
