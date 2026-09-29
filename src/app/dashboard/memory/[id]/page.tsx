"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/layout/Topbar";
import {
  BrainCircuit,
  ArrowLeft,
  Calendar,
  Tag,
  Mic,
  Image as ImageIcon,
  FileText,
  Paperclip,
  Trash2,
  Edit3,
  Bell,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Sparkles,
} from "lucide-react";
import { formatFriendlyDate } from "@/lib/date-utils";

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Personal");
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Attachment modal state
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploadingAttach, setUploadingAttach] = useState(false);

  // Create Reminder modal state
  const [isRemindOpen, setIsRemindOpen] = useState(false);
  const [remindDate, setRemindDate] = useState("");
  const [remindTime, setRemindTime] = useState("09:00");
  const [remindTitle, setRemindTitle] = useState("");
  const [creatingRemind, setCreatingRemind] = useState(false);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories/${id}`);
      const data = await res.json();
      if (data.success && data.memory) {
        setMemory(data.memory);
        setEditTitle(data.memory.key);
        setEditContent(data.memory.value);
        setEditCategory(data.memory.category);
        setRemindTitle(data.memory.key);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMemory();
  }, [id]);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editTitle,
          value: editContent,
          category: editCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        setIsEditing(false);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে এই মেমোরিটি ডিলিট করতে চান?")) return;
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/memory");
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachFile) return;
    setUploadingAttach(true);
    try {
      const formData = new FormData();
      formData.append("file", attachFile);
      const res = await fetch(`/api/memories/${id}/attachment`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setIsAttachOpen(false);
        setAttachFile(null);
        fetchMemory();
      }
    } finally {
      setUploadingAttach(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindDate) return;
    setCreatingRemind(true);
    try {
      const dueAt = new Date(`${remindDate}T${remindTime || "09:00"}:00`);
      const res = await fetch(`/api/memories/${id}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: remindTitle || memory.key,
          dueAt: dueAt.toISOString(),
        }),
      });
      if (res.ok) {
        setIsRemindOpen(false);
        fetchMemory();
      }
    } finally {
      setCreatingRemind(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: "markdown" | "json") => {
    window.open(`/api/memories/${id}/export?format=${format}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-purple-600 font-semibold text-sm">
          <BrainCircuit className="w-5 h-5 animate-pulse" />
          মেমোরি লোড হচ্ছে...
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">মেমোরি পাওয়া যায়নি</h2>
        <Link
          href="/dashboard/memory"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> মেমোরি তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="মেমোরি বিস্তারিত (Memory Details) 🧠"
        subtitle="সংরক্ষিত তথ্য, ভয়েস রেকর্ড, OCR টেক্সট এবং সংযুক্ত ফাইল"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Back Link & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/dashboard/memory"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> মেমোরি ভল্টে ফিরে যান
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExport("markdown")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export (.md)
            </button>
            <button
              onClick={() => handleExport("json")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> JSON
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> সম্পাদনা
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> ডিলিট
            </button>
          </div>
        </div>

        {/* Main Memory Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                📁 {memory.category}
              </span>

              {memory.source && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {memory.source.includes("voice") && "🎤 Voice Recording"}
                  {memory.source.includes("image") && "📷 Image OCR"}
                  {memory.source.includes("document") && "📄 Document / PDF"}
                  {memory.source.includes("telegram") && "💬 Telegram Message"}
                  {memory.source.includes("manual") && "📝 Manual Entry"}
                  {memory.source.includes("web") && "🌐 Web Chat / Dashboard"}
                </span>
              )}

              {memory.confidence && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  ✨ Confidence: {Math.round(memory.confidence * 100)}%
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              সংরক্ষিত: {new Date(memory.createdAt).toLocaleString("bn-BD")}
            </div>
          </div>

          {/* Edit Form or Display View */}
          {isEditing ? (
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700">শিরোনাম / টাইটেল</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">ক্যাটাগরি</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="Personal">Personal</option>
                  <option value="Family">Family</option>
                  <option value="Work">Work</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Important Dates">Important Dates</option>
                  <option value="Contacts">Contacts</option>
                  <option value="Documents">Documents</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">মূল তথ্য / বিবরণ</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
                >
                  {savingEdit ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{memory.key}</h1>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    📝 মেমোরির মূল তথ্য (Content)
                  </span>
                  <button
                    onClick={() => handleCopyText(memory.value)}
                    className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "কপি হয়েছে!" : "কপি করুন"}
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {memory.value}
                </p>
              </div>

              {memory.summary && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI সংক্ষিপ্তসার (Summary)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{memory.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Extracted Text / OCR / Voice Transcript */}
          {memory.extractedText && (
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> এক্সট্র্যাক্টেড টেক্সট / ভয়েস ট্রান্সক্রিপ্ট / OCR
                </span>
                <button
                  onClick={() => handleCopyText(memory.extractedText)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  কপি
                </button>
              </div>
              <pre className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {memory.extractedText}
              </pre>
            </div>
          )}

          {/* Attachments Section (#90, #91) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" /> সংযুক্ত ফাইলসমূহ (Attachments) (
                {memory.attachments?.length || 0})
              </h3>
              <button
                onClick={() => setIsAttachOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> ফাইল যুক্ত করুন
              </button>
            </div>

            {memory.attachments && memory.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memory.attachments.map((att: any) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-purple-600 shrink-0">
                        {att.type === "audio" && <Mic className="w-4 h-4" />}
                        {att.type === "image" && <ImageIcon className="w-4 h-4" />}
                        {(att.type === "pdf" || att.type === "document") && <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{att.fileName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {Math.round((att.fileSize || 0) / 1024)} KB • {att.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {att.type === "audio" && (
                      <audio controls className="w-full mt-2 h-8 rounded-lg" src={att.storagePath} />
                    )}

                    {/* Image Preview */}
                    {att.type === "image" && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                        <img
                          src={att.storagePath}
                          alt={att.fileName}
                          className="max-h-40 object-contain w-full"
                        />
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <a
                        href={att.storagePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                      >
                        <ExternalLink className="w-3 h-3" /> ফাইল খুলুন / ডাউনলোড
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                কোনো ফাইল সংযুক্ত নেই। আপনি অডিও, ছবি বা পিডিএফ যোগ করতে পারেন।
              </p>
            )}
          </div>

          {/* Linked Reminders Section (#107) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" /> লিংকড রিমাইন্ডার (Connected Reminder)
              </h3>
              {!memory.reminder && (
                <button
                  onClick={() => setIsRemindOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> রিমাইন্ডার তৈরি করুন
                </button>
              )}
            </div>

            {memory.reminder ? (
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{memory.reminder.title}</h4>
                    <p className="text-xs text-purple-700 mt-0.5">
                      ⏰ সময়: {formatFriendlyDate(new Date(memory.reminder.dueAt))} • স্ট্যাটাস:{" "}
                      <span className="font-semibold">{memory.reminder.status}</span>
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/reminders"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline"
                >
                  রিমাইন্ডারে দেখুন
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                এই মেমোরির সাথে কোনো নির্দিষ্ট রিমাইন্ডার সংযুক্ত নেই।
              </p>
            )}
          </div>

          {/* Timeline History Section (#108) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> মেমোরি টাইমলাইন হিস্ট্রি (Timeline)
            </h3>

            {memory.timeline && memory.timeline.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                {memory.timeline.map((event: any) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-white shadow-xs" />
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{event.description}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.createdAt).toLocaleString("bn-BD")}
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">
                        উৎস: {event.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">টাইমলাইন রেকর্ড লোড করা হয়নি।</p>
            )}
          </div>
        </div>
      </div>

      {/* Attachment Modal */}
      {isAttachOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-purple-600" /> নতুন ফাইল সংযুক্ত করুন
            </h3>
            <form onSubmit={handleUploadAttachment} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  id="attach-file-input"
                  onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="attach-file-input" className="cursor-pointer block">
                  <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-purple-600">
                    {attachFile ? attachFile.name : "ফাইল নির্বাচন করুন (ছবি, অডিও, পিডিএফ)"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">সর্বোচ্চ ৫০ মেগাবাইট পর্যন্ত সাপোর্ট করে</p>
                </label>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAttachOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!attachFile || uploadingAttach}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {uploadingAttach ? "আপলোড হচ্ছে..." : "আপলোড করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Reminder Modal */}
      {isRemindOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" /> মেমোরি থেকে রিমাইন্ডার তৈরি
            </h3>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">রিমাইন্ডার শিরোনাম</label>
                <input
                  type="text"
                  value={remindTitle}
                  onChange={(e) => setRemindTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={remindDate}
                    onChange={(e) => setRemindDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">সময়</label>
                  <input
                    type="time"
                    value={remindTime}
                    onChange={(e) => setRemindTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRemindOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creatingRemind}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {creatingRemind ? "তৈরি হচ্ছে..." : "রিমাইন্ডার সেট করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
