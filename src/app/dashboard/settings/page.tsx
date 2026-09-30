"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Globe,
  Clock,
  Download,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Key,
  ExternalLink,
  Bot,
} from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [language, setLanguage] = useState("bn");
  const [defaultMorningTime, setDefaultMorningTime] = useState("09:00");
  const [defaultEveningTime, setDefaultEveningTime] = useState("17:00");

  // Gemini AI Key State
  const [geminiKey, setGeminiKey] = useState("");
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [maskedGeminiKey, setMaskedGeminiKey] = useState("");
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [aiSavedMsg, setAiSavedMsg] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; reply?: string } | null>(null);

  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
        setMaskedGeminiKey(data.maskedGeminiKey || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTimezone(user.timezone || "Asia/Dhaka");
      setLanguage(user.language || "bn");
      if (user.profile) {
        setDefaultMorningTime(user.profile.defaultMorningTime || "09:00");
        setDefaultEveningTime(user.profile.defaultEveningTime || "17:00");
      }
    }
    fetchSettings();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timezone,
          language,
          defaultMorningTime,
          defaultEveningTime,
        }),
      });
      if (res.ok) {
        setSavedMsg("প্রোফাইল সেটিংস সংরক্ষিত হয়েছে!");
        refreshUser();
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    setSavingAiKey(true);
    setAiSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey: geminiKey.trim(),
        }),
      });
      if (res.ok) {
        setAiSavedMsg("Google Gemini AI Key সফলভাবে সংরক্ষিত ও সক্রিয় হয়েছে! 🚀");
        setGeminiKey("");
        fetchSettings();
        setTimeout(() => setAiSavedMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAiKey(false);
    }
  };

  const handleTestGeminiKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: geminiKey.trim() || undefined,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = {};

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text().catch(() => "");
        if (res.status === 404 || rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
          throw new Error("নতুন আপডেট কার্যকর হতে Hostinger থেকে 'Restart Application' দিন।");
        }
        throw new Error(rawText || `সার্ভার ত্রুটি (${res.status})`);
      }

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          reply: data.reply,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "টেস্ট সম্পন্ন করা যায়নি।",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "সার্ভার সংযোগে ত্রুটি: " + err.message,
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleExport = (format: "json" | "csv") => {
    window.open(`/api/export?format=${format}`, "_blank");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title="অ্যাকাউন্ট ও AI সেটিংস ⚙️"
        subtitle="Google Gemini AI ইন্টিগ্রেশন, প্রোফাইল, টাইমজোন ও ডেটা এক্সপোর্ট"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Gemini AI Engine Configuration Card */}
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Google Gemini AI ইঞ্জিন {hasGeminiKey ? "✅ (সক্রিয়)" : "⏳ (সেটআপ করুন)"}
                </h3>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  উন্নত প্রাকৃতিক ভাষা অনুধাবন, বুদ্ধিমত্তাসম্পন্ন কথোপকথন ও রিমাইন্ডার প্রসেসিং
                </p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-200 transition-colors"
            >
              Get Free API Key <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {aiSavedMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {aiSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveGeminiKey} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">
                Google Gemini API Key {hasGeminiKey && `(বর্তমান: ${maskedGeminiKey})`}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  placeholder={hasGeminiKey ? "নতুন API Key দিতে এখানে পেস্ট করুন..." : "AIzaSy..."}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                />
                <button
                  type="submit"
                  disabled={savingAiKey || !geminiKey.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingAiKey ? "সেভ হচ্ছে..." : "API Key সেভ করুন"}
                </button>
                <button
                  type="button"
                  onClick={handleTestGeminiKey}
                  disabled={testingKey || (!geminiKey.trim() && !hasGeminiKey)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40"
                  title="Gemini API Key ভেরিফাই ও টেস্ট করুন"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-emerald-300 ${testingKey ? "animate-spin" : ""}`} />
                  {testingKey ? "টেস্ট হচ্ছে..." : "🧪 টেস্ট করুন"}
                </button>
              </div>
            </div>

            {/* Test Result Feedback Banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex flex-col gap-1.5 transition-all ${
                  testResult.success
                    ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/70 border-rose-500/40 text-rose-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestResult(null)}
                    className="text-white/60 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                {testResult.reply && (
                  <p className="text-[11px] text-emerald-300/80 italic pl-6 bg-white/5 py-1 px-2 rounded-lg">
                    AI Response: &ldquo;{testResult.reply}&rdquo;
                  </p>
                )}
              </div>
            )}

            <p className="text-[11px] text-purple-300/70">
              💡 Google AI Studio থেকে আপনার সম্পূর্ণ ফ্রি API Key নিতে পারেন:{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="underline text-purple-200 hover:text-white"
              >
                aistudio.google.com/app/apikey
              </a>
            </p>
          </form>
        </div>

        {savedMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {savedMsg}
          </div>
        )}

        {/* Profile & Timezone Form */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            প্রোফাইল ও ভাষা সেটিংস
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার নাম</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল এড্রেস</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ডিফল্ট টাইমজোন</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">ভাষা (Language)</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="bn">বাংলা (Bangla)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
            </button>
          </div>
        </form>

        {/* Data Export Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            ডেটা ব্যাকআপ ও এক্সপোর্ট (Data Export)
          </h3>
          <p className="text-xs text-slate-500">
            আপনার অ্যাকাউন্টের সমস্ত রিমাইন্ডার, মেমোরি এবং টাস্কের ব্যাকআপ ফাইল ডাউনলোড করে রাখতে পারেন।
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport("json")}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON ডাউনলোড
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV ডাউনলোড
            </button>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            ডেঞ্জার জোন (Danger Zone)
          </h3>
          <p className="text-xs text-rose-700">
            অ্যাকাউন্ট ডিলিট করলে আপনার সমস্ত রিমাইন্ডার, মেমোরি, টাস্ক এবং টেলিগ্রাম সংযোগ চিরতরে মুছে যাবে।
          </p>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            অ্যাকাউন্ট স্থায়ীভাবে মুছুন (Delete Account)
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-900 mb-2">আপনি কি নিশ্চিত?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার সমস্ত ডেটা চিরতরে মুছে যাবে এবং এটি ফিরিয়ে আনা সম্ভব হবে না।
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {deleteLoading ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, অ্যাকাউন্ট মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
