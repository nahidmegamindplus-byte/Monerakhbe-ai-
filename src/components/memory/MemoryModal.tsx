"use client";

import { useState, useRef } from "react";
import {
  X,
  BrainCircuit,
  Sparkles,
  Mic,
  Square,
  Image as ImageIcon,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Bell,
  Play,
  Pause,
} from "lucide-react";

const CATEGORIES = [
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

export default function MemoryModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [tab, setTab] = useState<"text" | "voice" | "image" | "document">("text");

  // Manual Text fields
  const [category, setCategory] = useState("Personal");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [tags, setTags] = useState("");

  // Multimodal file upload
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [autoReminder, setAutoReminder] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Processing state & AI preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);

  if (!isOpen) return null;

  // Voice Recording Handlers
  const startRecording = async () => {
    setError("");
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
        setRecordedAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError("মাইক্রোফোন চালু করা যায়নি। পারমিশন চেক করুন।");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMultimodalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "text") {
        if (!key.trim() || !value.trim()) {
          throw new Error("কীওয়ার্ড ও মূল তথ্য লিখুন");
        }
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            key: key.trim(),
            value: value.trim(),
            tags: tags.trim() || null,
            source: "manual_text",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save");
      } else {
        const formData = new FormData();
        formData.append("inputType", tab === "voice" ? "audio" : tab);
        formData.append("caption", caption);
        formData.append("autoCreateReminder", String(autoReminder));

        if (tab === "voice" && recordedAudioBlob) {
          formData.append("file", recordedAudioBlob, `voice_${Date.now()}.ogg`);
        } else if (file) {
          formData.append("file", file);
        } else {
          throw new Error("অনুগ্রহ করে একটি ফাইল নির্বাচন বা রেকর্ড করুন");
        }

        const res = await fetch("/api/memories/multimodal", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to process multimodal input");

        setAiResult(data);
      }

      onCreated?.();
      if (tab === "text") {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "প্রসেস করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setAiResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">মাল্টিমোডাল মেমোরি সংরক্ষণ</h3>
              <p className="text-[11px] text-slate-500">টেক্সট, ভয়েস, ছবি ও ডকুমেন্ট থেকে AI মেমোরি তৈরি করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Mode Navigation Tabs */}
        {!aiResult && (
          <div className="grid grid-cols-4 gap-1.5 mt-4 p-1 bg-slate-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTab("text");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === "text" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> টেক্সট
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("voice");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === "voice" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" /> ভয়েস
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("image");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === "image" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> ছবি / OCR
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("document");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === "document" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-600" /> PDF / Doc
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* AI Multimodal Extraction Success View */}
        {aiResult ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold">মেমোরি সফলভাবে তৈরি ও সংরক্ষণ হয়েছে!</h4>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">{aiResult.message}</p>
            </div>

            {aiResult.memory && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{aiResult.memory.key}</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold">
                    {aiResult.memory.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{aiResult.memory.value}</p>
                {aiResult.candidateReminder && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      তারিখ পাওয়া গেছে: <b>{aiResult.candidateReminder.date}</b> ({aiResult.candidateReminder.time || "সময় নেই"})
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMultimodalSubmit} className="mt-4 space-y-4">
            {/* Tab 1: Manual Text */}
            {tab === "text" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কীওয়ার্ড / বিষয় (Title / Key) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ভাইয়ের জন্মদিন, অফিসের ঠিকানা, পাসপোর্ট নম্বর"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংরক্ষিত তথ্য (Content / Value) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="যেমন: ১২ ডিসেম্বর, House 11, Banasree..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)
                  </label>
                  <input
                    type="text"
                    placeholder="office, address, banasree"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}

            {/* Tab 2: Voice Audio Recording */}
            {tab === "voice" && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <Mic className={`w-8 h-8 ${isRecording ? "animate-pulse text-red-600" : ""}`} />
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    {isRecording ? "🔴 আপনার কথা রেকর্ড হচ্ছে... (বলুন)" : "মাইক্রোফোনে কথা বলুন অথবা অডিও ফাইল নির্বাচন করুন"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    বাংলা, বাংলিশ বা মিশ্র ভাষায় বলুন — যেমন: <i>&ldquo;মনে রেখো, আমার মায়ের জন্মদিন ১৫ জানুয়ারি&rdquo;</i>
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" /> রেকর্ড শুরু করুন
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                      >
                        <Square className="w-4 h-4" /> রেকর্ড থামান
                      </button>
                    )}
                  </div>

                  {audioUrl && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-[11px] font-semibold text-emerald-800 mb-1">রেকর্ড করা অডিও প্রিভিউ:</p>
                      <audio controls src={audioUrl} className="w-full h-8 rounded-lg" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অথবা অডিও ফাইল আপলোড করুন
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setRecordedAudioBlob(null);
                      setAudioUrl(null);
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Image / OCR */}
            {tab === "image" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="modal-image-input"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="modal-image-input" className="cursor-pointer block">
                    <ImageIcon className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {file ? file.name : "প্রেসক্রিপশন, বিল, রসিদ বা ডাক্তারের অ্যাপয়েন্টমেন্টের ছবি নির্বাচন করুন"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP সাপোর্ট করে</p>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অতিরিক্ত নোট বা ক্যাপশন (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ডাক্তারের ভিজিট সংক্রান্ত প্রেসক্রিপশন"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Document / PDF */}
            {tab === "document" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="modal-doc-input"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="modal-doc-input" className="cursor-pointer block">
                    <FileText className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {file ? file.name : "পিডিএফ, বাসা ভাড়ার চুক্তি বা ইন্স্যুরেন্স ফাইল নির্বাচন করুন"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, TXT সাপোর্ট করে</p>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অতিরিক্ত বিবরণ (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ২০২৬ সালের ফ্ল্যাট ভাড়ার চুক্তিপত্র"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Auto Reminder Checkbox for Multimodal uploads */}
            {tab !== "text" && (
              <label className="flex items-center gap-2 p-3 rounded-xl bg-purple-50/60 border border-purple-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReminder}
                  onChange={(e) => setAutoReminder(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-purple-900">
                  তারিখ/ইভেন্ট পাওয়া গেলে স্বয়ংক্রিয়ভাবে রিমাইন্ডার সেট করুন
                </span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading || (tab === "voice" && !recordedAudioBlob && !file)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? "AI এক্সট্র্যাক্ট করছে..." : "মেমোরি সেভ করুন"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
