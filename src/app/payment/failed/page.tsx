"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get("error");
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-xl animate-in fade-in zoom-in-95">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
          <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900">পেমেন্ট সম্পন্ন হয়নি</h1>
          <p className="text-xs text-slate-500">
            আপনার অ্যাকাউন্ট থেকে কোনো অর্থ কাটা হয়নি। আপনি পুনরায় চেষ্টা করতে পারেন।
          </p>
        </div>

        {/* Possible Reasons */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-700">
          <p className="font-bold text-slate-900">সম্ভাব্য কারণসমূহ:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
            <li>পেমেন্ট গেটওয়েতে লেনদেন বাতিল করা হয়েছে</li>
            <li>অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্সের ঘাটতি বা পিন ভেরিফিকেশন ব্যর্থ</li>
            <li>পেমেন্ট গেটওয়ের সংযোগে সময়সীমা (Timeout) অতিক্রম করেছে</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/checkout?plan=PRO"
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>পুনরায় চেষ্টা করুন (Try Again)</span>
          </Link>

          <Link
            href="/checkout"
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>অন্য পেমেন্ট মাধ্যম বেছে নিন</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 pt-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ড্যাশবোর্ডে ফিরে যান</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
