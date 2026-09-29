"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Trash2,
  Tag,
  Calendar,
  Building2,
  User,
  Wallet,
  Phone,
  Mic,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Paperclip,
  Bell,
  ArrowRight,
  HeartPulse,
  Plane,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export interface MemoryAttachmentItem {
  id: string;
  type: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
}

export interface MemoryItem {
  id: string;
  category: string;
  key: string;
  value: string;
  summary?: string | null;
  tags?: string | null;
  source?: string;
  confidence?: number;
  extractedText?: string | null;
  reminderId?: string | null;
  reminder?: {
    id: string;
    title: string;
    dueAt: string;
    status: string;
  } | null;
  attachments?: MemoryAttachmentItem[];
  createdAt: string;
}

export default function MemoryCard({
  memory,
  onDelete,
}: {
  memory: MemoryItem;
  onDelete?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Family":
        return <User className="w-4 h-4 text-rose-500" />;
      case "Work":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "Finance":
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case "Health":
        return <HeartPulse className="w-4 h-4 text-red-500" />;
      case "Travel":
        return <Plane className="w-4 h-4 text-sky-500" />;
      case "Education":
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case "Business":
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      case "Important Dates":
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case "Contacts":
        return <Phone className="w-4 h-4 text-purple-500" />;
      default:
        return <BrainCircuit className="w-4 h-4 text-purple-500" />;
    }
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    if (source.includes("voice")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
          <Mic className="w-2.5 h-2.5" /> Voice
        </span>
      );
    }
    if (source.includes("image")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
          <ImageIcon className="w-2.5 h-2.5" /> Image OCR
        </span>
      );
    }
    if (source.includes("document") || source.includes("pdf")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
          <FileText className="w-2.5 h-2.5" /> Document
        </span>
      );
    }
    if (source.includes("telegram")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full">
          <MessageSquare className="w-2.5 h-2.5" /> Telegram
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
        <FileText className="w-2.5 h-2.5" /> Text
      </span>
    );
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`আপনি কি "${memory.key}" সম্পর্কিত এই মেমোরি ডিলিট করতে চান?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      onDelete?.(memory.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 hover:border-purple-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              {getCategoryIcon(memory.category)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {memory.category}
            </span>
            {getSourceBadge(memory.source)}
          </div>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            title="মেমোরি মুছুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3">
          <Link
            href={`/dashboard/memory/${memory.id}`}
            className="text-sm font-bold text-slate-900 leading-snug hover:text-purple-600 transition-colors block"
          >
            {memory.key}
          </Link>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 line-clamp-3">
            {memory.value}
          </p>
        </div>

        {/* Attachments and Linked Reminder indicator */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
          {memory.attachments && memory.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md font-medium">
              <Paperclip className="w-3 h-3 text-slate-400" />
              {memory.attachments.length} attachment{memory.attachments.length > 1 ? "s" : ""}
            </span>
          )}

          {memory.reminder && (
            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200/50 px-2 py-0.5 rounded-md font-medium">
              <Bell className="w-3 h-3 text-purple-600" />
              রিমাইন্ডার সেট করা
            </span>
          )}
        </div>

        {memory.tags && (
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <Tag className="w-3 h-3 text-slate-400" />
            {memory.tags.split(",").map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium"
              >
                #{t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {new Date(memory.createdAt).toLocaleDateString("bn-BD", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        <Link
          href={`/dashboard/memory/${memory.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
        >
          বিস্তারিত দেখুন <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
