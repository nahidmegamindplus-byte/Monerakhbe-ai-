"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Wallet,
  ArrowRight,
  FileText,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function BillingPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState<any[]>([]);
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/plans").then((res) => res.json()),
      fetch("/api/billing/history").then((res) => res.json()),
    ])
      .then(([plansRes, billingRes]) => {
        if (plansRes.success) setPlans(plansRes.plans);
        if (billingRes.success) setBillingData(billingRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const activeSub = billingData?.subscription;
  const orders = billingData?.orders || [];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-12">
      <Topbar
        title="বিলিং ও সাবস্ক্রিপশন প্ল্যান 💳"
        subtitle="আপনার প্যাকেজ, পেমেন্ট হিস্ট্রি ও ডিজিটাল ইনভয়েস পরিচালনা করুন"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Active Subscription Summary Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 text-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-black uppercase tracking-wider">
                বর্তমান প্ল্যান
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {user?.plan || "FREE"} {activeSub ? `(${activeSub.billingCycle})` : "Basic"}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {activeSub?.expiresAt ? (
                <span>
                  মেয়াদ শেষ হবে:{" "}
                  <strong className="text-slate-800 font-bold">
                    {format(new Date(activeSub.expiresAt), "dd MMMM yyyy")}
                  </strong>
                </span>
              ) : (
                "আজীবন ফ্রি একাউন্ট সক্রিয় আছে"
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/checkout?plan=PRO"
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{user?.plan === "FREE" ? "প্ল্যান আপগ্রেড করুন" : "রিনিউ বা পরিবর্তন করুন"}</span>
            </Link>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              মাসিক (Monthly)
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>বাৎসরিক (Yearly)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">
                ২ মাস ফ্রি
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => {
            const isCurrent = user?.plan === p.id;
            const isPro = p.id === "PRO";
            const price = billingCycle === "yearly" ? p.yearlyPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all bg-white ${
                  isPro
                    ? "border-2 border-indigo-600 shadow-xl relative scale-102 ring-4 ring-indigo-50"
                    : "border border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                    {isCurrent ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
                        বর্তমান প্ল্যান
                      </span>
                    ) : isPro ? (
                      <span className="text-[10px] bg-indigo-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        সর্বাধিক জনপ্রিয়
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-slate-500 mt-2">{p.description}</p>

                  <div className="mt-5 mb-6">
                    <span className="text-4xl font-black text-slate-900">৳{price}</span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {p.id === "FREE" ? " / আজীবন" : billingCycle === "yearly" ? " / বছর" : " / মাস"}
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{p.reminderLimit}টি রিমাইন্ডার</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{p.memoryLimit}টি মেমোরি ভল্ট স্টোরেজ</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{p.taskLimit}টি টাস্ক ট্র্যাকিং</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{p.aiLimit}টি AI জেমিনাই রিকোয়েস্ট</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>টেলিগ্রাম বট নোটিফিকেশন</span>
                    </li>
                    {p.advancedFeatures && (
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-indigo-700">অ্যাডভান্সড রিকারিং ও এআই মেমোরি</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100">
                  {p.id === "FREE" ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                    >
                      {isCurrent ? "অ্যাক্টিভ আছে" : "ফ্রি প্যাকেজ"}
                    </button>
                  ) : (
                    <Link
                      href={`/checkout?plan=${p.id}&cycle=${billingCycle.toUpperCase()}`}
                      className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] ${
                        isPro
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <span>{isCurrent ? "প্যাকেজ রিনিউ করুন" : "কিনুন (Checkout)"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment History & Invoices Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Clock className="w-4 h-4 text-indigo-600" />
              পেমেন্ট হিস্ট্রি ও ইনভয়েস (Payment History)
            </h3>
            <button
              onClick={fetchBillingData}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              রিফ্রেশ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5">প্যাকেজ</th>
                  <th className="p-3.5">পরিমাণ</th>
                  <th className="p-3.5">পেমেন্ট মেথড</th>
                  <th className="p-3.5">TrxID / অর্ডার</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right">ইনভয়েস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {format(new Date(o.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {o.plan?.name || o.planId}
                      </td>
                      <td className="p-3.5 font-black text-rose-600">৳{o.amount} BDT</td>
                      <td className="p-3.5 uppercase font-semibold text-slate-700">
                        {o.paymentMethod}
                      </td>
                      <td className="p-3.5 font-mono text-indigo-600 font-bold text-[11px]">
                        {o.providerTransactionId || o.orderNumber}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            o.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {o.invoice ? (
                          <Link
                            href={`/invoice/${o.invoice.id}`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>ইনভয়েস</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supported Bangladesh Payment Gateways Badge */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              অফিশিয়াল বাংলাদেশি পেমেন্ট চ্যানেল
            </h4>
            <p className="text-[11px] text-slate-500">
              বিকাশ, নগদ ও রকেট দিয়ে নিরাপদ ও সার্ভার-ভেরিফাইড পেমেন্ট
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> bKash (বিকাশ)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Nagad (নগদ)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Rocket (রকেট)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
