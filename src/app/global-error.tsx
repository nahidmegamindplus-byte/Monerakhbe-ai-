"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global client exception:", error);
  }, [error]);

  return (
    <html lang="bn">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              অ্যাপ্লিকেশনে ত্রুটি ঘটেছে
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              একটি অপ্রত্যাশিত ক্লায়েন্ট এরর হয়েছে। পেজটি পুনরায় লোড করতে নিচের বাটনে ক্লিক করুন।
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পেজ রিফ্রেশ করুন (Reload Page)</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
