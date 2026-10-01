"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Paperclip,
  Mic,
  Square,
  Image as ImageIcon,
  FileText,
  X,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Bell,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  data?: any;
  actionTaken?: string;
  attachmentName?: string;
  attachmentType?: string;
  createdAt: Date;
}

export default function WebChatWidget({ defaultPrompt }: { defaultPrompt?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 আসসালামু আলাইকুম! আমি **MoneRakhbe AI** — আপনার মাল্টিমোডাল মেমোরি ও রিমাইন্ডার সহকারী।\n\nআপনি আমাকে টেক্সট লিখতে পারেন, **ভয়েস রেকর্ড** করে পাঠাতে পারেন, কিংবা **প্রেসক্রিপশন/রসিদের ছবি** ও **পিডিএফ ডকুমেন্ট** আপলোড করতে পারেন।",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState(defaultPrompt || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch recent conversation history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/chat");
        const json = await res.json();
        if (json.success && Array.isArray(json.messages) && json.messages.length > 0) {
          const formatted: ChatMessage[] = json.messages.map((m: any) => {
            let meta: any = {};
            try {
              meta = JSON.parse(m.metadata || "{}");
            } catch {}
            return {
              id: m.id,
              role: m.role.toLowerCase() as "user" | "assistant",
              content: m.content,
              intent: meta.intent,
              data: meta.data || (meta.memoryKey ? { key: meta.memoryKey, category: meta.memoryCategory } : undefined),
              actionTaken: meta.actionTaken,
              createdAt: new Date(m.createdAt),
            };
          });
          setMessages(formatted);
        }
      } catch (err) {
        console.error("[WebChatWidget] Failed to load history", err);
      }
    };
    fetchHistory();
  }, []);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
        const voiceFile = new File([audioBlob], `voice_${Date.now()}.ogg`, { type: "audio/ogg" });
        stream.getTracks().forEach((t) => t.stop());
        await handleSendWithFile(voiceFile, "🎤 ভয়েস মেসেজ");
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("মাইক্রোফোন পারমিশন পাওয়া যায়নি।");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendWithFile = async (fileToSend: File, labelContent?: string) => {
    setLoading(true);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: labelContent || input || `সংযুক্ত ফাইল: ${fileToSend.name}`,
      attachmentName: fileToSend.name,
      attachmentType: fileToSend.type,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedFile(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append("caption", input);
      formData.append(
        "inputType",
        fileToSend.type.startsWith("image/")
          ? "image"
          : fileToSend.type.startsWith("audio/")
          ? "voice"
          : "document"
      );

      const res = await fetch("/api/memories/multimodal", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.message || "ফাইলটি প্রসেস ও মেমোরিতে সংরক্ষণ করা হয়েছে!",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: "দুঃখিত, ফাইল প্রসেস করতে সমস্যা হয়েছে।",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    if (selectedFile) {
      await handleSendWithFile(selectedFile);
      return;
    }

    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.message || "কাজটি সম্পন্ন হয়েছে!",
        intent: data.intent,
        data: data.data,
        actionTaken: data.actionTaken,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: "দুঃখিত, সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrigger = async (type: "briefing" | "summary" | "weekly") => {
    setLoading(true);
    const label =
      type === "briefing"
        ? "☀️ আজকের সকালের ব্রিফিং দিন"
        : type === "summary"
        ? "🌙 আজকের সারসংক্ষেপ দেখাও"
        : "📊 এই সপ্তাহের সাপ্তাহিক রিভিউ";

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: label,
        createdAt: new Date(),
      },
    ]);

    try {
      const endpoint =
        type === "briefing"
          ? "/api/assistant/briefing"
          : type === "summary"
          ? "/api/assistant/summary"
          : "/api/assistant/weekly-review";

      const res = await fetch(endpoint);
      const json = await res.json();

      let replyContent = "তথ্য প্রস্তুত করা সম্ভব হয়নি।";
      if (type === "briefing" && json.briefing) {
        replyContent = json.briefing.summary;
      } else if (type === "summary" && json.summary) {
        replyContent = json.summary.summary;
      } else if (type === "weekly" && json.review) {
        replyContent = json.review.summary;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: replyContent,
          intent: type,
          createdAt: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: "দুঃখিত, তথ্য লোড করতে সমস্যা হয়েছে।",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "আমার রক্তের গ্রুপ O+ মনে রেখো",
    "আমার ওয়াইফাই পাসওয়ার্ড wifi1234 সেভ করো",
    "আমার বাসার ঠিকানা ধানমন্ডি ২৭",
    "কাল সকাল ১১টায় ডেন্টিস্টের কাছে যাওয়া",
    "আমার কী কী তথ্য সেভ আছে বলো",
    "রাকিব আমার ক্লায়েন্ট, ABC কোম্পানিতে কাজ করে",
    "আমার রক্তের গ্রুপ কি?",
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Quick Intelligence Actions */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">MoneRakhbe AI পার্সোনাল অ্যাসিস্ট্যান্ট</h3>
            <p className="text-[11px] text-slate-500 font-medium">প্রাকৃতিক ভাষা, ভয়েস, ছবি ও মেমোরি সহকারী</p>
          </div>
        </div>

        {/* Quick Intelligence Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleQuickTrigger("briefing")}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
          >
            <span>☀️ সকালের ব্রিফিং</span>
          </button>
          <button
            onClick={() => handleQuickTrigger("summary")}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
          >
            <span>🌙 সন্ধ্যার সারসংক্ষেপ</span>
          </button>
          <button
            onClick={() => handleQuickTrigger("weekly")}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
          >
            <span>📊 সাপ্তাহিক রিভিউ</span>
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-purple-100 text-purple-700"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                  : "bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60"
              }`}
            >
              {m.attachmentName && (
                <div className="mb-1.5 pb-1.5 border-b border-white/20 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Paperclip className="w-3 h-3" /> {m.attachmentName}
                </div>
              )}
              {m.content}

              {/* Rich Confirmation Card for Memories Saved */}
              {m.role === "assistant" && m.intent === "create_memory" && (
                <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>মেমোরিতে সংরক্ষিত হয়েছে</span>
                    </div>
                    {m.data?.category && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        {m.data.category}
                      </span>
                    )}
                  </div>
                  {m.data?.key && (
                    <div className="text-[11px] text-slate-800 bg-white/90 p-2 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                      <span className="truncate">📌 <strong className="text-slate-900">{m.data.key}</strong>: {m.data.value}</span>
                    </div>
                  )}
                  <Link
                    href="/dashboard/memory"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 self-start transition-colors"
                  >
                    মেমোরি ভল্টে দেখুন <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Rich Confirmation Card for Reminders */}
              {m.role === "assistant" && m.intent === "create_reminder" && (
                <div className="mt-2.5 p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-indigo-950 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                      <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>রিমাইন্ডার ও মেমোরি সেট হয়েছে</span>
                    </div>
                    {m.data?.priority && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {m.data.priority}
                      </span>
                    )}
                  </div>
                  {m.data?.title && (
                    <div className="text-[11px] text-slate-800 bg-white/90 p-2 rounded-xl border border-indigo-100">
                      📌 <strong>{m.data.title}</strong>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/reminders"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                      রিমাইন্ডার লিস্ট <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href="/dashboard/memory"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                      মেমোরি ভল্ট <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Rich Confirmation Card for Tasks */}
              {m.role === "assistant" && m.intent === "create_task" && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>টাস্ক লিস্টে যুক্ত হয়েছে</span>
                    </div>
                  </div>
                  {m.data?.title && (
                    <div className="text-[11px] text-slate-800 bg-white/90 p-2 rounded-xl border border-amber-100">
                      📌 <strong>{m.data.title}</strong>
                    </div>
                  )}
                  <Link
                    href="/dashboard/tasks"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 self-start transition-colors"
                  >
                    টাস্ক ম্যানেজারে দেখুন <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-10">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>AI প্রসেস করছে...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview Badge */}
      {selectedFile && (
        <div className="px-4 py-2 bg-purple-50 border-t border-purple-100 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-purple-600">
              ({Math.round(selectedFile.size / 1024)} KB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 rounded-md text-purple-600 hover:text-purple-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/40 overflow-x-auto flex gap-1.5 no-scrollbar">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="shrink-0 text-[11px] bg-white border border-slate-200/80 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Field with Multimodal Actions */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="ছবি বা ডকুমেন্ট আপলোড করুন"
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Mic Trigger */}
          <button
            type="button"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            title={isRecording ? "রেকর্ড বন্ধ করুন" : "ভয়েস রেকর্ড করুন"}
            className={`p-2.5 rounded-2xl transition-all shrink-0 ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={
              isRecording
                ? "🔴 কথা বলুন..."
                : selectedFile
                ? "ক্যাপশন বা নোট লিখুন..."
                : "স্বাভাবিক বাংলায় মেসেজ বা প্রশ্ন লিখুন..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRecording}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || loading}
            className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
