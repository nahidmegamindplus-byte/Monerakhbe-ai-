"use client";

import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Key,
  ShieldCheck,
  Check,
  Sparkles,
  Bot,
} from "lucide-react";

export default function TelegramSyncCard() {
  const [data, setData] = useState<{
    isConnected: boolean;
    telegramUsername?: string;
    firstName?: string;
    deepLink?: string;
    token?: string;
  } | null>(null);

  const [botConfig, setBotConfig] = useState<{
    hasToken: boolean;
    botUsername?: string;
    maskedToken?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Bot Token Configuration State
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [connRes, configRes] = await Promise.all([
        fetch("/api/telegram/connect"),
        fetch("/api/telegram/config"),
      ]);

      const connJson = await connRes.json();
      const configJson = await configRes.json();

      if (connJson.success) setData(connJson);
      if (configJson.success) {
        setBotConfig(configJson);
        if (!configJson.hasToken) {
          setShowConfigForm(true);
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

  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setSavingToken(true);
    setConfigMessage(null);

    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: inputToken.trim(),
          botUsername: inputUsername.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "টোকেন ভেরিফাই করা যায়নি");
      }

      setConfigMessage({ text: json.message || "বট সফলভাবে যুক্ত হয়েছে!", type: "success" });
      setShowConfigForm(false);
      setInputToken("");
      fetchStatus();
    } catch (err: any) {
      setConfigMessage({ text: err.message || "টোকেন ভুল বা সংযোগে সমস্যা", type: "error" });
    } finally {
      setSavingToken(false);
    }
  };

  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; deepLink?: string } | null>(null);
  const [showChatIdInput, setShowChatIdInput] = useState(false);
  const [customChatId, setCustomChatId] = useState("");

  const handleTestConnection = async (overrideChatId?: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const activeChatId = overrideChatId !== undefined ? overrideChatId : customChatId.trim();
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChatId || undefined,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      let json: any = {};
      if (contentType.includes("application/json")) {
        json = await res.json();
      } else {
        const rawText = await res.text().catch(() => "");
        throw new Error(rawText || `সার্ভার ত্রুটি (${res.status})`);
      }

      if (json.success && json.messageSent) {
        setTestResult({ success: true, message: json.message });
        fetchStatus();
      } else {
        setTestResult({
          success: false,
          message: json.error || json.message || "টেস্ট সম্পন্ন করা যায়নি।",
          deepLink: json.deepLink,
        });
        if (!data?.isConnected) {
          setShowChatIdInput(true);
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "ত্রুটি: " + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

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

      const contentType = res.headers.get("content-type") || "";
      let json: any = {};
      if (contentType.includes("application/json")) {
        json = await res.json();
      } else {
        const rawText = await res.text().catch(() => "");
        if (res.status === 404 || rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
          throw new Error("নতুন আপডেট কার্যকর হতে Hostinger থেকে 'Restart Application' দিন।");
        }
        throw new Error(rawText || `সার্ভার ত্রুটি (${res.status})`);
      }

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

  const handleCopy = () => {
    if (data?.deepLink) {
      navigator.clipboard.writeText(data.deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("আপনি কি টেলিগ্রাম সংযোগ বিচ্ছিন্ন করতে চান?")) return;
    try {
      await fetch("/api/telegram/connect", { method: "DELETE" });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {webhookStatus && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between">
          <span>{webhookStatus}</span>
          <button onClick={() => setWebhookStatus(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Bot Token Configuration Banner if missing */}
      {(!botConfig?.hasToken || showConfigForm) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">টেলিগ্রাম বট টোকেন বসান (Bot Token Setup)</h3>
                <p className="text-xs text-slate-500">
                  BotFather থেকে প্রাপ্ত <b>HTTP API Token</b> টি এখানে পেস্ট করুন।
                </p>
              </div>
            </div>

            {botConfig?.hasToken && (
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
                Telegram Bot Token (HTTP API Token) *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: 7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400">
                @BotFather এ <code className="bg-slate-100 px-1 py-0.5 rounded">/newbot</code> দিয়ে টোকেন পাবেন।
              </span>

              <button
                type="submit"
                disabled={savingToken || !inputToken.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {savingToken ? "ভেরিফাই ও সেভ হচ্ছে..." : "টোকেন সেভ ও বট কানেক্ট করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-3">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>অফিসিয়াল টেলিগ্রাম ইন্টিগ্রেশন</span>
              {botConfig?.botUsername && (
                <span className="text-sky-300 font-bold">(@{botConfig.botUsername})</span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {data?.isConnected ? "টেলিগ্রাম সফলভাবে সংযুক্ত আছে ✅" : "টেলিগ্রামের সাথে কানেক্ট করুন 🚀"}
            </h3>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-md leading-relaxed">
              {data?.isConnected
                ? `কানেক্টেড ইউজার: @${data.telegramUsername || data.firstName || "User"}। এখন থেকে আপনি সরাসরি টেলিগ্রামে টেক্সট, ভয়েস বা ছবি পাঠিয়ে রিমাইন্ডার ও মেমোরি সেট করতে পারবেন।`
                : botConfig?.hasToken
                ? "নিচের বাটনে ক্লিক করে বটে /start পাঠিয়ে দিন। অ্যাকাউন্ট সাথে সাথে যুক্ত হয়ে যাবে!"
                : "প্রথমে ওপরের বক্সে আপনার Bot Token টি পেস্ট করে সেভ করুন।"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            {data?.isConnected ? (
              <div className="flex items-center gap-3">
                <a
                  href={`https://t.me/${botConfig?.botUsername || "MoneRakhbeBot"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all hover:scale-102"
                >
                  <Send className="w-4 h-4" />
                  বট খুলুন (Open Bot)
                </a>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/10 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {botConfig?.hasToken ? (
                  <>
                    <a
                      href={data?.deepLink || `https://t.me/${botConfig?.botUsername || "MoneRakhbeBot"}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      Connect Telegram Now
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 flex items-center justify-center gap-2 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "কপি হয়েছে!" : "লিংক কপি করুন"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowConfigForm(true)}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    টোকেন দিয়ে বট সেটআপ করুন
                  </button>
                )}
              </div>
            )}

            {/* 1-Click Bot Webhook Sync & Test Buttons */}
            {botConfig?.hasToken && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {/* Live Test Connection Button */}
                <button
                  onClick={() => handleTestConnection()}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-all border border-emerald-500/30 hover:scale-102"
                  title="বট কানেকশন এবং মেসেজ ডেলিভারি টেস্ট করুন"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{testingConnection ? "টেস্ট হচ্ছে..." : "🧪 টেস্ট মেসেজ পাঠান"}</span>
                </button>

                {/* Toggle Chat ID Input */}
                <button
                  onClick={() => setShowChatIdInput(!showChatIdInput)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 text-[11px] font-medium transition-all"
                  title="নির্দিষ্ট Telegram Chat ID তে টেস্ট মেসেজ পাঠাতে ক্লিক করুন"
                >
                  <span>🆔 Chat ID টেস্ট</span>
                </button>

                {/* 1-Click Sync Webhook */}
                <button
                  onClick={handleSyncWebhook}
                  disabled={syncingWebhook}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 text-[11px] font-semibold transition-all border border-white/10"
                  title="হোস্টিং সার্ভারের সাথে টেলিগ্রাম বট ওয়েবহুক সিঙ্ক করুন"
                >
                  <RefreshCw className={`w-3 h-3 text-sky-400 ${syncingWebhook ? "animate-spin" : ""}`} />
                  <span>{syncingWebhook ? "সিঙ্ক হচ্ছে..." : "⚡ ওয়েবহুক"}</span>
                </button>

                {/* Change Bot Token Button */}
                <button
                  onClick={() => setShowConfigForm(!showConfigForm)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 text-[11px] font-medium transition-all"
                  title="বট টোকেন পরিবর্তন বা আপডেট করুন"
                >
                  <Key className="w-3 h-3" />
                  <span>টোকেন</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Custom Chat ID Direct Test Box */}
        {showChatIdInput && (
          <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="আপনার Telegram Chat ID লিখুন (যেমন: 123456789)"
                value={customChatId}
                onChange={(e) => setCustomChatId(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/20 text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={() => handleTestConnection(customChatId)}
                disabled={testingConnection || !customChatId.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {testingConnection ? "পাঠানো হচ্ছে..." : "এই আইডিতে টেস্ট পাঠান"}
              </button>
            </div>
            <p className="text-[11px] text-indigo-200/80 flex items-center gap-1">
              💡 <span>টিপস: টেলিগ্রাম অ্যাপে <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-300 underline font-semibold">@userinfobot</a> এ Start দিয়ে আপনার numeric Chat ID পেতে পারেন। অথবা বটে গিয়ে <code className="bg-white/10 px-1 py-0.5 rounded">/start</code> লিখলেই অটো কানেক্ট হবে।</span>
            </p>
          </div>
        )}

        {/* Test Result Live Banner */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fadeIn ${
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
              <div className="space-y-1">
                <span>{testResult.message}</span>
                {!testResult.success && botConfig?.botUsername && (
                  <div className="pt-1">
                    <a
                      href={testResult.deepLink || `https://t.me/${botConfig.botUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold shadow transition-all"
                    >
                      <Send className="w-3 h-3" />
                      টেলিগ্রামে @{botConfig.botUsername} বট খুলুন
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-white/60 hover:text-white text-sm px-1.5 py-0.5 self-end sm:self-center"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
