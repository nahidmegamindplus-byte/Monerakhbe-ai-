"use client";

import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Key,
  Sparkles,
  Bot,
  PowerOff,
} from "lucide-react";

export default function TelegramSyncCard() {
  const [botConfig, setBotConfig] = useState<{
    hasToken: boolean;
    botUsername?: string;
    maskedToken?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    deepLink?: string;
    needsStart?: boolean;
  } | null>(null);

  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const configRes = await fetch("/api/telegram/config");
      const configJson = await configRes.json();

      if (configJson.success) {
        setBotConfig(configJson);
        if (!configJson.hasToken) {
          setShowConfigForm(true);
        } else {
          setShowConfigForm(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 1. Simple Bot API Token Connect
  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setSavingToken(true);
    setConfigMessage(null);
    setTestResult(null);

    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: inputToken.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "টোকেন ভেরিফাই করা যায়নি");
      }

      setConfigMessage({ text: json.message || "বট সফলভাবে সংযুক্ত হয়েছে!", type: "success" });
      setShowConfigForm(false);
      setInputToken("");
      await fetchStatus();
    } catch (err: any) {
      setConfigMessage({ text: err.message || "টোকেন ভুল বা সংযোগে সমস্যা", type: "error" });
    } finally {
      setSavingToken(false);
    }
  };

  // 2. 1-Click Test Message Sending
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (json.success && json.messageSent) {
        setTestResult({
          success: true,
          message: json.message,
        });
      } else {
        setTestResult({
          success: false,
          message: json.error || json.message || "টেস্ট সম্পন্ন করা যায়নি।",
          deepLink: json.deepLink,
          needsStart: json.needsStart,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "সার্ভার সংযোগে ত্রুটি: " + err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 3. Webhook Sync
  const handleSyncWebhook = async () => {
    setSyncingWebhook(true);
    setWebhookStatus(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/telegram/setup-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUrl: origin }),
      });

      const json = await res.json();
      if (json.success) {
        setWebhookStatus("✅ টেলিগ্রাম বট সফলভাবে সক্রিয় ও সিঙ্ক হয়েছে!");
      } else {
        setWebhookStatus(`⚠️ ${json.message || json.warning || "অ্যাক্টিভেশন সম্পন্ন হতে HTTPS প্রয়োজন"}`);
      }
    } catch (err: any) {
      setWebhookStatus("❌ সিঙ্ক করতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setSyncingWebhook(false);
    }
  };

  // 4. Disconnect Bot
  const handleDisconnect = async () => {
    if (!confirm("আপনি কি টেলিগ্রাম বট সংযোগ বিচ্ছিন্ন করতে চান?")) return;
    try {
      await fetch("/api/telegram/connect", { method: "DELETE" });
      setShowConfigForm(true);
      setTestResult(null);
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const isConnected = Boolean(botConfig?.hasToken);

  return (
    <div className="space-y-4">
      {webhookStatus && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between">
          <span>{webhookStatus}</span>
          <button onClick={() => setWebhookStatus(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Bot Token Setup / Edit Form */}
      {(!isConnected || showConfigForm) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">টেলিগ্রাম বট কানেক্ট করুন (Bot API Setup)</h3>
                <p className="text-xs text-slate-500">
                  BotFather থেকে প্রাপ্ত <b>HTTP API Token</b> টি দিয়ে শুধু একবার কানেক্ট করুন। কোনো Chat ID লাগবে না।
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={() => setShowConfigForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                বাতিল
              </button>
            )}
          </div>

          {configMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                configMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {configMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {configMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveBotToken} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telegram Bot API Token *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: 8395452549:AAFPbI_hGt6jmr9NpICtH_tXnTp1MxRIel8"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                টেলিগ্রাম অ্যাপে <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-purple-600 underline font-semibold">@BotFather</a> এ <code className="bg-slate-100 px-1 py-0.5 rounded">/newbot</code> দিয়ে টোকেন পাবেন।
              </span>

              <button
                type="submit"
                disabled={savingToken || !inputToken.trim()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {savingToken ? "ভেরিফাই ও কানেক্ট হচ্ছে..." : "বট কানেক্ট করুন 🚀"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>টেলিগ্রাম ইন্টিগ্রেশন</span>
              {botConfig?.botUsername && (
                <span className="text-sky-300 font-bold">(@{botConfig.botUsername})</span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {isConnected ? (
                <>
                  <span>টেলিগ্রাম বট সফলভাবে সংযুক্ত আছে</span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-xs">✓</span>
                </>
              ) : (
                <span>টেলিগ্রাম বট কানেক্ট করা নেই</span>
              )}
            </h3>

            <p className="text-xs text-indigo-200/80 max-w-md leading-relaxed">
              {isConnected
                ? `বট: @${botConfig?.botUsername || "bot"} সক্রিয় রয়েছে। নিচের ১-ক্লিক টেস্ট বাটনে চাপ দিয়ে যেকোনো সময় টেস্ট মেসেজ পাঠিয়ে চেক করতে পারেন।`
                : "উপরে আপনার Bot API Token বসিয়ে কানেক্ট বাটনে চাপ দিন।"}
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2.5">
            {isConnected ? (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1-Click Test Message Button */}
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                  title="১ ক্লিকেই টেলিগ্রাম বটে টেস্ট মেসেজ পাঠান"
                >
                  <Sparkles className={`w-4 h-4 ${testingConnection ? "animate-spin" : ""}`} />
                  <span>{testingConnection ? "টেস্ট মেসেজ পাঠানো হচ্ছে..." : "🧪 টেস্ট মেসেজ পাঠান"}</span>
                </button>

                {/* Open Bot Link */}
                <a
                  href={`https://t.me/${botConfig?.botUsername || "MoneRakhbeBot"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all hover:scale-102"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>বট খুলুন</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                {/* Sync Webhook */}
                <button
                  onClick={handleSyncWebhook}
                  disabled={syncingWebhook}
                  className="px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1"
                  title="ওয়েবহুক রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingWebhook ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">সিঙ্ক</span>
                </button>

                {/* Change Token Button */}
                <button
                  onClick={() => setShowConfigForm(!showConfigForm)}
                  className="px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
                  title="টোকেন পরিবর্তন করুন"
                >
                  টোকেন
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfigForm(true)}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>টোকেন দিয়ে কানেক্ট করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* 1-Click Test Result Banner */}
        {testResult && (
          <div
            className={`mt-5 p-4 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fadeIn ${
              testResult.success
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/80 border-rose-500/50 text-rose-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5">
                <span>{testResult.message}</span>
                {!testResult.success && botConfig?.botUsername && (
                  <div className="pt-1">
                    <a
                      href={testResult.deepLink || `https://t.me/${botConfig.botUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold shadow transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>টেলিগ্রামে @{botConfig.botUsername} খুলুন ও Start দিন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setTestResult(null)}
              className="text-white/60 hover:text-white text-sm px-2 py-0.5 self-end sm:self-center"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
