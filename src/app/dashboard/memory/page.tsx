"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import MemoryCard, { MemoryItem } from "@/components/memory/MemoryCard";
import MemoryModal from "@/components/memory/MemoryModal";
import {
  BrainCircuit,
  Search,
  Plus,
  Mic,
  Image as ImageIcon,
  FileText,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Paperclip,
  CheckCircle2,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Personal",
  "Family",
  "Work",
  "Finance",
  "Health",
  "Travel",
  "Education",
  "Business",
  "Important Dates",
  "Contacts",
  "Documents",
  "Other",
];

const SOURCES = [
  { id: "all", label: "সকল সোর্স" },
  { id: "voice", label: "🎤 ভয়েস" },
  { id: "image", label: "📷 ছবি / OCR" },
  { id: "document", label: "📄 ডকুমেন্টস" },
  { id: "telegram", label: "💬 টেলিগ্রাম" },
  { id: "manual", label: "📝 টেক্সট" },
];

export default function MemoryVaultPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [category, setCategory] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Semantic Q&A State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [sourceAtts, setSourceAtts] = useState<any[]>([]);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      let url = `/api/memories?category=${category}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        let list: MemoryItem[] = data.memories || [];
        if (sourceFilter !== "all") {
          list = list.filter((m) => (m.source || "").toLowerCase().includes(sourceFilter));
        }
        setMemories(list);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [category, search, sourceFilter]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setIsAiSearching(true);
    setAiAnswer(null);
    setSourceAtts([]);

    try {
      const res = await fetch(`/api/memories/search?q=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      if (data.success && data.answer) {
        setAiAnswer(data.answer);
        setSourceAtts(data.sourceAttachments || []);
      }
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div>
      <Topbar
        title="মাল্টিমোডাল মেমোরি ভল্ট (Memory Vault) 🧠"
        subtitle="ভয়েস, ছবি, ডকুমেন্টস, চুক্তিপত্র ও নোটের সুরক্ষিত সার্চযোগ্য ভাণ্ডার"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Natural Language Semantic Search & Ask AI Bar (#89, #94, #110) */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 border border-purple-400/30 text-purple-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> মাল্টিমোডাল ন্যাচারাল ল্যাঙ্গুয়েজ সার্চ
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-snug">
              আপনার যা প্রয়োজন, স্বাভাবিক বাংলায় জিজ্ঞাসা করুন
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              যেমন: <i>&ldquo;আমার workplace কোথায়?&rdquo;</i>, <i>&ldquo;insurance কবে শেষ হবে?&rdquo;</i>, বা <i>&ldquo;গত মাসের ডকুমেন্টে বাসা ভাড়া কত ছিল?&rdquo;</i>
            </p>
          </div>

          <form onSubmit={handleAskAI} className="mt-5 flex items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-300 absolute left-4 top-3" />
              <input
                type="text"
                placeholder="মেমোরি বা আপলোড করা ডকুমেন্টে সার্চ করুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-purple-200/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={isAiSearching}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isAiSearching ? "খোঁজা হচ্ছে..." : "AI দিয়ে খুঁজুন"}
            </button>
          </form>

          {/* AI Direct Answer Box (#89, #110) */}
          {aiAnswer && (
            <div className="mt-5 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md space-y-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <BrainCircuit className="w-4 h-4" /> AI উত্তর:
              </div>
              <p className="text-purple-100 whitespace-pre-wrap leading-relaxed">{aiAnswer}</p>

              {sourceAtts.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-purple-300 font-medium">উৎস ফাইল:</span>
                  {sourceAtts.map((att: any) => (
                    <a
                      key={att.id}
                      href={att.storagePath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-purple-200 text-[11px] font-semibold transition-colors"
                    >
                      <Paperclip className="w-3 h-3" /> {att.fileName} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Source and Category Filter Bar */}
        <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-100">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSourceFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  sourceFilter === s.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  category === c
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {c === "All" ? "সকল ক্যাটাগরি" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Grid */}
        {memories.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <BrainCircuit className="w-14 h-14 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900">কোনো মেমোরি খুঁজে পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                আপনি টেক্সট লিখে, ভয়েস রেকর্ড করে, প্রেসক্রিপশন বা রসিদের ছবি আপলোড করে এবং পিডিএফ ফাইল দিয়ে যেকোনো দরকারি তথ্য সংরক্ষণ করতে পারেন।
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" /> নতুন মেমোরি যোগ করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} onDelete={fetchMemories} />
            ))}
          </div>
        )}
      </div>

      <MemoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchMemories}
      />
    </div>
  );
}
