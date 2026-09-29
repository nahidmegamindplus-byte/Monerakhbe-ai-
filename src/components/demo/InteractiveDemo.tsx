"use client";

import { useState } from "react";
import { Send, Sparkles, Bot, User, Check, RefreshCw } from "lucide-react";
import { parseMessageFallback } from "@/services/ai/fallback-parser";

const SAMPLE_SCENARIOS = [
  {
    label: "১-বার রিমাইন্ডার (আগামী মাস)",
    text: "আগামী মাসের ২০ তারিখে আমাকে বাড়ি যাওয়ার কথা মনে করিয়ে দিও",
    note: "এককালীন রিমাইন্ডার (Never assume monthly recurrence)",
  },
  {
    label: "মাসিক পৌনঃপুনিক (Recurring)",
    text: "প্রতি মাসের ৫ তারিখে ইন্টারনেট বিল দেওয়ার কথা মনে করিয়ে দিও",
    note: "মাসিক পৌনঃপুনিক শিডিউল (Monthly Recurring)",
  },
  {
    label: "অফসেট নোটিফিকেশন (৩ দিন আগে)",
    text: "২০ তারিখে বাড়ি যাব, ৩ দিন আগে মনে করিয়ে দিও",
    note: "মূল ইভেন্ট ২০ তারিখ, এলার্ট ১৭ তারিখ",
  },
  {
    label: "স্মৃতি সংরক্ষণ (Memory Only)",
    text: "১২ ডিসেম্বর আমার ভাইয়ের জন্মদিন, মনে রেখো",
    note: "মেমোরি সেভ (Family ক্যাটাগরি, কোনো অপ্রয়োজনীয় এলার্ট নয়)",
  },
  {
    label: "বাংলিশ ইনপুট (Banglish)",
    text: "kal 5tay client ke call korte mone koriye dio",
    note: "স্বাভাবিক বাংলিশ টেক্সট প্রসেসিং",
  },
];

export default function InteractiveDemo() {
  const [inputText, setInputText] = useState(SAMPLE_SCENARIOS[0].text);
  const [activeScenario, setActiveScenario] = useState(0);
  const [parsed, setParsed] = useState(parseMessageFallback(SAMPLE_SCENARIOS[0].text));

  const handleSelectScenario = (index: number) => {
    setActiveScenario(index);
    const text = SAMPLE_SCENARIOS[index].text;
    setInputText(text);
    setParsed(parseMessageFallback(text));
  };

  const handleCustomInput = (text: string) => {
    setInputText(text);
    setParsed(parseMessageFallback(text));
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ইন্টারেক্টিভ এআই সিমুলেটর</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          নিজে পরীক্ষা করে দেখুন কীভাবে AI বোঝে
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          নিচের নমুনা বাক্যে ক্লিক করুন বা আপনার নিজের ভাষায় যেকোনো বাক্য লিখে এআই-এর বিশ্লেষণ ও সঠিক সময় নির্ধারণ দেখুন।
        </p>
      </div>

      {/* Quick Scenario Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {SAMPLE_SCENARIOS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectScenario(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeScenario === idx
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grid: Left Simulator / Right Structured JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chat Simulator */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" /> Telegram Chat Preview
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                Live AI Parsing
              </span>
            </div>

            <div className="space-y-3">
              {/* User message balloon */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm shadow-sm">
                  {inputText}
                </div>
              </div>

              {/* Bot response balloon */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-800 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-xs text-xs sm:text-sm leading-relaxed border border-slate-700/50 whitespace-pre-line">
                  {parsed.response_message}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder="এখানে লিখে টেস্ট করুন..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleCustomInput(inputText)}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Structured AI Extraction Inspector */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Extracted Structured Metadata
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">Asia/Dhaka</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400">Intent:</span>
                <span className="font-mono font-bold text-indigo-400">{parsed.intent}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400">Title / Subject:</span>
                <span className="font-semibold text-white">{parsed.title || parsed.memory_key || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400">Calculated Date:</span>
                <span className="font-mono text-emerald-400">{parsed.date || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400">Recurrence Guard:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                    parsed.recurrence
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {parsed.recurrence ? `RECURRING (${parsed.recurrence.frequency})` : "ONE-TIME (Recurrence: null)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400">Reminder Offsets:</span>
                <span className="text-slate-300 font-mono">
                  {parsed.reminder_offsets ? parsed.reminder_offsets.join(", ") : "at_time"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-[11px] text-indigo-300">
            💡 <b>রুল ভ্যালিডেশন:</b> {SAMPLE_SCENARIOS[activeScenario]?.note || "স্বাভাবিক ভাষা প্রসেসিং সফল।"}
          </div>
        </div>
      </div>
    </div>
  );
}
