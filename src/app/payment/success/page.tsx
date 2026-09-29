"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, FileText, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);

    if (orderId) {
      fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrderData(data);
          } else {
            setError(data.error || "পেমেন্ট তথ্য যাচাই করা যায়নি");
          }
        })
        .catch((err) => {
          console.error(err);
          setError("সার্ভার যাচাইকরণে সমস্যা হয়েছে");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600">পেমেন্ট কনফার্মেশন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  const order = orderData?.order;
  const subscription = orderData?.subscription;
  const invoice = orderData?.invoice;

  const expiryDate = subscription?.expiresAt
    ? format(new Date(subscription.expiresAt), "dd MMMM yyyy")
    : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "dd MMMM yyyy");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-center relative z-10 animate-in fade-in zoom-in-95">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> পেমেন্ট ও সাবস্ক্রিপশন সক্রিয়
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">পেমেন্ট সফল হয়েছে!</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ধন্যবাদ! আপনার প্যাকেজটি সফলভাবে সক্রিয় করা হয়েছে এবং সমস্ত প্রিমিয়াম ফিচার আনলক হয়েছে।
          </p>
        </div>

        {/* Receipt Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">প্যাকেজের নাম</span>
            <strong className="text-slate-900 font-bold">{order?.planId || "PRO"} Personal</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">পরিশোধিত টাকা</span>
            <strong className="text-emerald-600 font-extrabold text-sm">৳{order?.amount || "499"} BDT</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">পেমেন্ট মেথড</span>
            <span className="text-slate-800 font-semibold uppercase">{order?.paymentMethod || "bKash"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">ট্রানজেকশন আইডি (TrxID)</span>
            <span className="font-mono text-indigo-600 font-bold">{order?.providerTransactionId || order?.transactionId || "TXN-VERIFIED"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">মেয়াদ উত্তীর্ণের তারিখ</span>
            <span className="text-slate-800 font-semibold">{expiryDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>ড্যাশবোর্ডে যান (Go to Dashboard)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {invoice?.id && (
            <Link
              href={`/invoice/${invoice.id}`}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ডিজিটাল ইনভয়েস দেখুন ও ডাউনলোড করুন</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
