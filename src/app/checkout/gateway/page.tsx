"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Phone,
  KeyRound,
  AlertCircle,
  Copy,
  Check,
  Send,
  CreditCard,
  Sparkles,
} from "lucide-react";

function GatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = (searchParams.get("provider") || "bkash").toLowerCase();
  const orderId = searchParams.get("orderId") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const amount = searchParams.get("amount") || "499";

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "gateway">("direct");
  
  // Direct Manual / TrxID form state
  const [senderPhone, setSenderPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [copied, setCopied] = useState(false);

  // Automated Gateway Simulation state
  const [step, setStep] = useState<"phone" | "otp" | "pin" | "processing">("phone");
  const [simPhoneNumber, setSimPhoneNumber] = useState("01712345678");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("12345");

  // Payment Method Config from Database
  const [methodConfig, setMethodConfig] = useState<any | null>(null);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    // Fetch active payment methods from DB
    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.paymentMethods)) {
          const match = data.paymentMethods.find(
            (m: any) => m.code?.toLowerCase() === provider.toLowerCase()
          );
          if (match) {
            setMethodConfig(match);
          }
        }
      })
      .catch((err) => console.error("Error fetching payment methods:", err));
  }, [provider]);

  const isBkash = provider === "bkash";
  const isNagad = provider === "nagad";
  const isRocket = provider === "rocket";

  const brandColor = isBkash
    ? "bg-[#e2136e]"
    : isNagad
    ? "bg-[#f7941d]"
    : isRocket
    ? "bg-[#8c3494]"
    : "bg-indigo-700";

  const brandName =
    methodConfig?.name ||
    (isBkash
      ? "বিকাশ (bKash)"
      : isNagad
      ? "নগদ (Nagad)"
      : isRocket
      ? "রকেট (Rocket)"
      : provider.toUpperCase());

  // Dynamic Merchant / Wallet Number from Admin Config
  const merchantNumber =
    methodConfig?.accountNumber ||
    (isBkash
      ? "01886123456"
      : isNagad
      ? "01991234567"
      : "01711234567-8");

  const accountType = methodConfig?.accountType || "Personal";
  const customInstructions = methodConfig?.instructions;

  const copyMerchantNumber = () => {
    navigator.clipboard.writeText(merchantNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit via Direct Number & TrxID for Admin Confirmation
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      setError("অনুগ্রহ করে আপনার পেমেন্ট প্রেরক মোবাইল নম্বর লিখুন");
      return;
    }
    if (!trxId.trim()) {
      setError("অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) লিখুন");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/submit-trx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          senderPhone: senderPhone.trim(),
          trxId: trxId.trim().toUpperCase(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        // Route to Pending verification screen where it waits for Admin Confirmation
        router.push(`/payment/pending?orderId=${orderId}`);
      } else {
        setError(json.error || "পেমেন্ট তথ্য জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
        setLoading(false);
      }
    } catch (err: any) {
      setError("সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।");
      setLoading(false);
    }
  };

  // Submit via Simulated Gateway PIN
  const handleGatewayProcess = async () => {
    setLoading(true);
    setError("");

    try {
      const generatedTrxId = `${provider.toUpperCase()}_TRX_${Date.now().toString(36).toUpperCase()}`;

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId,
          trxId: generatedTrxId,
          providerTrxId: generatedTrxId,
          senderPhone: simPhoneNumber,
        }),
      });

      const json = await res.json();

      if (json.success && json.verified) {
        router.push(`/payment/success?orderId=${orderId}`);
      } else {
        router.push(`/payment/failed?orderId=${orderId}&error=${encodeURIComponent(json.error || "Payment verification failed")}`);
      }
    } catch (err: any) {
      router.push(`/payment/failed?orderId=${orderId}&error=Gateway+connection+error`);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Gateway Header Banner */}
        <div className={`${brandColor} text-white p-6 text-center space-y-2 relative shadow-inner`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Lock className="w-3.5 h-3.5" /> অফিসিয়াল পেমেন্ট পোর্টাল
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{brandName} পেমেন্ট</h2>
          
          <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm max-w-xs mx-auto">
            <span className="text-xs text-white/90">পরিশোধযোগ্য টাকা (Payable Amount):</span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight">৳{amount} BDT</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("direct")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "direct"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>নম্বর ও TrxID দিয়ে সাবমিট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gateway")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "gateway"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>স্যান্ডবক্স / ওটিপি গেটওয়ে</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* TAB 1: Direct Mobile Number & TrxID Submission */}
          {activeTab === "direct" && (
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              {/* Payment Instructions Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <span>পেমেন্ট পাঠানোর নিয়ম:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                    {accountType} ({accountType === "Merchant" ? "Payment" : "Send Money"})
                  </span>
                </div>
                
                {customInstructions ? (
                  <div className="whitespace-pre-line text-slate-700 text-[11px] leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/60 font-medium">
                    {customInstructions}
                  </div>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    <li>আপনার {brandName} অ্যাপ বা ডায়াল করে <strong>৳{amount}</strong> টাকা পাঠান।</li>
                    <li>নিচের একাউন্ট নম্বরে {accountType === "Merchant" ? "Payment" : "Send Money"} করুন:</li>
                  </ol>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-mono text-sm font-black text-slate-900">{merchantNumber}</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-medium">({accountType})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyMerchantNumber}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all border border-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ১. আপনার পেমেন্ট মোবাইল নম্বর (Sender Number) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="যেমন: 01712345678"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ২. ট্রানজেকশন আইডি (TrxID) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      placeholder="যেমন: BK789XYZ123"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-black text-emerald-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase tracking-wider"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>পেমেন্ট যাচাই ও অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>অর্ডার ও পেমেন্ট কনফার্ম করুন (৳{amount})</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Automated Simulator / Gateway */}
          {activeTab === "gateway" && (
            <div className="space-y-4">
              {step === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">আপনার ওয়ালেট নম্বর লিখুন</h3>
                    <p className="text-xs text-slate-500">স্যান্ডবক্স বা লাইভ ওটিপি পেমেন্টের জন্য নম্বর দিন</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={simPhoneNumber}
                        onChange={(e) => setSimPhoneNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>স্যান্ডবক্স মোড: যেকোনো ডেমো নম্বর দিয়ে এগিয়ে যান</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("otp")}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>পরবর্তী ধাপ (Next)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">ভেরিফিকেশন কোড (OTP)</h3>
                    <p className="text-xs text-slate-500">{simPhoneNumber} নম্বরে পাঠানো ৬-ডিজিটের কোড লিখুন</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">OTP কোড</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-black tracking-widest text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("pin")}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>OTP কনফার্ম করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === "pin" && (
                <div className="space-y-4">
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">গোপন পিন (PIN) লিখুন</h3>
                    <p className="text-xs text-slate-500">পেমেন্ট সম্পন্ন করতে আপনার {brandName} পিন দিন</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাকাউন্ট পিন</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        maxLength={5}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="•••••"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 tracking-widest"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("processing");
                      handleGatewayProcess();
                    }}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>পেমেন্ট প্রসেস হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>পেমেন্ট কনফার্ম করুন (৳{amount})</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "processing" && (
                <div className="py-8 text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">পেমেন্ট ও সাবস্ক্রিপশন যাচাই করা হচ্ছে...</h3>
                    <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন, পেজ রিফ্রেশ করবেন না।</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel button */}
          <button
            type="button"
            onClick={() => router.push(`/payment/failed?orderId=${orderId}&error=Payment+cancelled+by+user`)}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            পেমেন্ট বাতিল করুন (Cancel Payment)
          </button>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 text-center text-[11px] text-slate-500 font-medium">
          MoneRakhbe AI — অফিসিয়াল বাংলাদেশ পেমেন্ট গেটওয়ে
        </div>
      </div>
    </div>
  );
}

export default function GatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <GatewayContent />
    </Suspense>
  );
}
