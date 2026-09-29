"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Tag,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";

type PaymentMethodType = "bkash" | "nagad" | "rocket";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("PRO");
  const [paymentMethodsList, setPaymentMethodsList] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Checkout loading
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam && ["PRO", "BUSINESS"].includes(planParam.toUpperCase())) {
      setSelectedPlanId(planParam.toUpperCase());
    }
    const cycleParam = searchParams.get("cycle");
    if (cycleParam && ["MONTHLY", "YEARLY"].includes(cycleParam.toUpperCase())) {
      setBillingCycle(cycleParam.toUpperCase() as "MONTHLY" | "YEARLY");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlans(data.plans.filter((p: any) => p.id !== "FREE"));
        }
      })
      .catch((err) => console.error(err));

    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
          setPaymentMethodsList(data.paymentMethods);
          setPaymentMethod(data.paymentMethods[0].code);
        } else {
          // Fallback defaults
          setPaymentMethodsList([
            { code: "bkash", name: "বিকাশ (bKash)" },
            { code: "nagad", name: "নগদ (Nagad)" },
            { code: "rocket", name: "রকেট (Rocket)" },
          ]);
        }
      })
      .catch(() => {
        setPaymentMethodsList([
          { code: "bkash", name: "বিকাশ (bKash)" },
          { code: "nagad", name: "নগদ (Nagad)" },
          { code: "rocket", name: "রকেট (Rocket)" },
        ]);
      });
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || {
    id: "PRO",
    name: "Pro Personal",
    monthlyPrice: 499,
    yearlyPrice: 4990,
  };

  const basePrice =
    billingCycle === "YEARLY"
      ? selectedPlan.yearlyPrice || 4990
      : selectedPlan.monthlyPrice || 499;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          planId: selectedPlanId,
          billingCycle,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAppliedCoupon(json.coupon);
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponError(json.error || "অবৈধ কুপন কোড");
      }
    } catch (err: any) {
      setCouponError("কুপন যাচাইয়ে ত্রুটি হয়েছে");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Submit Checkout
  const handleCheckout = async () => {
    if (!user) {
      router.push(`/login?redirect=/checkout?plan=${selectedPlanId}&cycle=${billingCycle}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle,
          paymentMethod,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const json = await res.json();

      if (json.success && json.redirectUrl) {
        window.location.href = json.redirectUrl;
      } else {
        setErrorMsg(json.error || "পেমেন্ট গেটওয়ে শুরু করা সম্ভব হয়নি");
        setSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "পেমেন্ট শুরু করতে ত্রুটি হয়েছে");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-rose-500 selection:text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>প্রাইসিং ও প্ল্যানে ফিরে যান</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span>SSL / TLS ২৫৬-বিট সুরক্ষিত চেকআউট</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            MoneRakhbe AI সাবস্ক্রিপশন চেকআউট
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            বিকাশ, নগদ বা রকেট দিয়ে তাৎক্ষণিক ও স্বয়ংক্রিয়ভাবে আপনার প্রো প্ল্যান অ্যাক্টিভ করুন
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Plan & Payment Method Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Choose Plan */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  ১. প্যাকেজ নির্বাচন করুন
                </h3>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    onClick={() => {
                      setBillingCycle("MONTHLY");
                      setAppliedCoupon(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      billingCycle === "MONTHLY"
                        ? "bg-white text-slate-900 shadow-sm font-black"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    মাসিক
                  </button>
                  <button
                    onClick={() => {
                      setBillingCycle("YEARLY");
                      setAppliedCoupon(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      billingCycle === "YEARLY"
                        ? "bg-white text-slate-900 shadow-sm font-black"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>বাৎসরিক</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-extrabold">
                      ২ মাস ফ্রি
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const price = billingCycle === "YEARLY" ? p.yearlyPrice : p.monthlyPrice;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        setAppliedCoupon(null);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{p.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-black text-slate-900">৳{price}</span>
                        <span className="text-[10px] text-slate-500">/{billingCycle === "YEARLY" ? "বছর" : "মাস"}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Bangladesh Payment Method */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-600" />
                ২. পেমেন্ট মাধ্যম নির্বাচন করুন (Bangladesh Gateways)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentMethodsList.map((method) => {
                  const isSelected = paymentMethod === method.code;
                  const isBkash = method.code === "bkash";
                  const isNagad = method.code === "nagad";
                  const isRocket = method.code === "rocket";

                  const activeColor = isBkash
                    ? "bg-pink-50/70 border-pink-500 ring-1 ring-pink-500 text-pink-700"
                    : isNagad
                    ? "bg-amber-50/70 border-amber-500 ring-1 ring-amber-500 text-amber-700"
                    : isRocket
                    ? "bg-purple-50/70 border-purple-500 ring-1 ring-purple-500 text-purple-700"
                    : "bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700";

                  const badgeBg = isBkash
                    ? "bg-pink-100 text-pink-800"
                    : isNagad
                    ? "bg-amber-100 text-amber-800"
                    : isRocket
                    ? "bg-purple-100 text-purple-800"
                    : "bg-indigo-100 text-indigo-800";

                  return (
                    <div
                      key={method.code}
                      onClick={() => setPaymentMethod(method.code)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? activeColor
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{method.name || method.code}</span>
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={isSelected}
                          onChange={() => setPaymentMethod(method.code)}
                          className="accent-indigo-600"
                        />
                      </div>
                      <div className={`p-2 rounded-xl text-[11px] font-bold text-center ${badgeBg}`}>
                        Pay with {method.name || method.code}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Coupon Code */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                ডিসকাউন্ট বা প্রমো কোড (ঐচ্ছিক)
              </h3>

              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="যেমন: LAUNCH20"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 uppercase tracking-wider focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white transition-all disabled:opacity-50"
                  >
                    {couponLoading ? "যাচাই হচ্ছে..." : "প্রয়োগ করুন"}
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <strong className="text-emerald-800 font-mono font-bold">{appliedCoupon.code}</strong>
                      <span className="text-emerald-700 text-[11px]"> (৳{appliedCoupon.discountAmount} ডিসকাউন্ট সক্রিয়)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              )}

              {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
            </div>
          </div>

          {/* Right Column: Order Summary & Pay Action */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-md sticky top-8">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              অর্ডার সারাংশ (Order Summary)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>নির্বাচিত প্যাকেজ</span>
                <strong className="text-slate-900 font-bold">{selectedPlan.name}</strong>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>বিলিং মেয়াদ</span>
                <span className="text-slate-800">{billingCycle === "YEARLY" ? "১ বছর (১২ মাস)" : "১ মাস (৩০ দিন)"}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>মূল মূল্য</span>
                <span>৳{basePrice}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>ডিসকাউন্ট ({appliedCoupon?.code})</span>
                  <span>-৳{discountAmount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>ভ্যাট / ট্যাক্স</span>
                <span className="text-slate-500">৳০.০০ (অন্তর্ভুক্ত)</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">সর্বমোট প্রদেয়</p>
                  <p className="text-[10px] text-slate-500">মুদ্রা: BDT (বাংলাদেশি টাকা)</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-rose-600">৳{finalPrice}</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
                paymentMethod === "bkash"
                  ? "bg-[#e2136e] hover:bg-[#c00f5c] shadow-pink-600/20"
                  : paymentMethod === "nagad"
                  ? "bg-[#f7941d] hover:bg-[#de7e0f] shadow-amber-600/20"
                  : "bg-[#8c3494] hover:bg-[#72277a] shadow-purple-600/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পেমেন্ট গেটওয়ে প্রস্তুত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === "bkash" && "bKash দিয়ে পেমেন্ট করুন"}
                    {paymentMethod === "nagad" && "Nagad দিয়ে পেমেন্ট করুন"}
                    {paymentMethod === "rocket" && "Rocket দিয়ে পেমেন্ট করুন"} (৳{finalPrice})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Guarantees */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>সফল পেমেন্টের সাথে সাথেই প্যাকেজ স্বয়ংক্রিয়ভাবে অ্যাক্টিভ হবে</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>টেলিগ্রাম ও ড্যাশবোর্ডে তাত্ক্ষণিক কনফার্মেশন ও ডিজিটাল ইনভয়েস</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
