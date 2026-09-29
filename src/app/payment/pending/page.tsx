"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Clock, RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checkPaymentStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/payments/status?orderId=${orderId}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrderData(data.order);

        if (data.isPaid) {
          setIsConfirmed(true);
          // Wait 1.5 seconds so user sees the success state, then redirect to Dashboard
          setTimeout(() => {
            router.push(`/payment/success?orderId=${orderId}`);
          }, 1500);
        } else if (data.isFailed) {
          setIsRejected(true);
        }
      } else {
        setErrorMsg(data.error || "অর্ডারের স্ট্যাটাস যাচাই করা যায়নি");
      }
    } catch {
      setErrorMsg("সার্ভার সংযোগে সমস্যা হয়েছে। রিফ্রেশ করে আবার দেখুন।");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkPaymentStatus();

    // Real-time polling every 3 seconds
    const timer = setInterval(() => {
      if (!isConfirmed && !isRejected) {
        checkPaymentStatus();
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [orderId, isConfirmed, isRejected]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-xl relative z-10 animate-in fade-in zoom-in-95">
        {/* State 1: Confirmed by Admin */}
        {isConfirmed ? (
          <div className="space-y-5 animate-in zoom-in-90">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm animate-bounce">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                ✓ অ্যাডমিন কনফার্মেশন সম্পন্ন
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">পেমেন্ট অনুমোদিত হয়েছে!</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                আপনার প্যাকেজটি সফলভাবে অ্যাক্টিভ করা হয়েছে। আপনাকে ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে...
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-center gap-2 text-emerald-800 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...</span>
            </div>
          </div>
        ) : isRejected ? (
          /* State 2: Rejected / Failed */
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
              <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
                পেমেন্ট যাচাই ব্যর্থ
              </span>
              <h1 className="text-2xl font-black text-slate-900">পেমেন্ট কনফার্ম করা যায়নি</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                প্রদত্ত TrxID বা নম্বরের সাথে পেমেন্ট রেকর্ড মেলেনি। অনুগ্রহ করে সঠিক বিকাশ/নগদ TrxID দিয়ে পুনরায় পেমেন্ট করে অর্ডার সাবমিট করুন।
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/checkout?plan=PRO"
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় পেমেন্ট করুন (Try Again)</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ড্যাশবোর্ডে ফিরে যান</span>
              </Link>
            </div>
          </div>
        ) : (
          /* State 3: Pending Admin Confirmation */
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
              <Clock className="w-10 h-10 stroke-[2.5] animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> অ্যাডমিন ভেরিফিকেশন অপেক্ষমান
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">পেমেন্ট যাচাই করা হচ্ছে</h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                আপনার পেমেন্ট অর্ডারটি সফলভাবে জমা হয়েছে। অ্যাডমিন প্যানেল থেকে TrxID যাচাই ও কনফার্ম করার সাথে সাথেই আপনার অ্যাকাউন্ট সক্রিয় হবে এবং আপনাকে স্বয়ংক্রিয়ভাবে ড্যাশবোর্ডে নিয়ে যাওয়া হবে।
              </p>
            </div>

            {/* Order Details Receipt Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">অর্ডার নম্বর:</span>
                <strong className="font-mono text-slate-900 font-bold">{orderData?.orderNumber || "MNR-PROCESSING"}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">নির্বাচিত প্যাকেজ:</span>
                <span className="text-slate-900 font-bold">{orderData?.planName || "Pro Personal"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">পরিশোধিত টাকা:</span>
                <strong className="text-rose-600 font-black text-sm">৳{orderData?.amount || "499"} BDT</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>
                <span className="uppercase font-semibold text-slate-800">{orderData?.paymentMethod || "bKash"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">প্রদত্ত TrxID:</span>
                <span className="font-mono text-indigo-700 font-bold">{orderData?.providerTransactionId || "যাচাই হচ্ছে..."}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">বর্তমান স্ট্যাটাস:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                  PENDING (অপেক্ষমান)
                </span>
              </div>
            </div>

            {/* Real-time Status Indicator */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-800 flex items-center justify-center gap-2 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <span>রিয়েল-টাইম কনফার্মেশন চেক করা হচ্ছে...</span>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={checkPaymentStatus}
                disabled={checking}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                <span>ম্যানুয়ালি স্ট্যাটাস চেক করুন</span>
              </button>

              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>ড্যাশবোর্ডে যান (ফ্রি মোডে চলবে)</span>
              </Link>
            </div>
          </div>
        )}

        {/* Security badge footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>MoneRakhbe AI — নিরাপদ ভেরিফাইড সাবস্ক্রিপশন সিস্টেম</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <PaymentPendingContent />
    </Suspense>
  );
}
