"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Check, Sparkles, Send, ArrowRight, Zap, ShieldCheck } from "lucide-react";

const PLANS = [
  {
    id: "FREE",
    name: "ফ্রি (Free Basic)",
    price: "৳০",
    period: "আজীবন ফ্রি",
    desc: "দৈনন্দিন সাধারণ রিমাইন্ডারের জন্য আদর্শ",
    features: [
      "প্রতিদিন ২০টি পর্যন্ত রিমাইন্ডার",
      "সর্বোচ্চ ৫০টি মেমোরি সংরক্ষণ",
      "টেলিগ্রাম বট কানেকশন",
      "বেসিক প্রাকৃতিক বাংলা প্রসেসিং",
      "স্ট্যান্ডার্ড নোটিফিকেশন",
    ],
    buttonText: "ফ্রি শুরু করুন",
    href: "/register",
    popular: false,
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: "PRO",
    name: "প্রো (Pro Personal)",
    price: "৳৪৯৯",
    period: "/মাস",
    yearlyPrice: "৳৪,৯৯০ /বছর (২ মাস ফ্রি)",
    desc: "ব্যক্তিগত ও পেশাগত কাজের সর্বোচ্চ সুবিধার জন্য",
    features: [
      "আনলিমিটেড এআই রিমাইন্ডার ও মেমোরি",
      "পৌনঃপুনিক (Recurring) স্মার্ট রিমাইন্ডার",
      "মাল্টিপল অফসেট এলার্ট (৩ দিন/১ দিন/১ ঘণ্টা আগে)",
      "ভয়েস মেসেজ ও ফটো ও ডকুমেন্ট ওসিআর প্রসেসিং",
      "দৈনিক সকালের ব্রিফিং ও সান্ধ্যকালীন সামারি",
      "প্রায়োরিটি সাপোর্ট ও ডাটা ব্যাকআপ",
    ],
    buttonText: "Pro শুরু করুন",
    href: "/checkout?plan=PRO",
    popular: true,
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
  },
  {
    id: "BUSINESS",
    name: "বিজনেস (Business Pro)",
    price: "৳৯৯৯",
    period: "/মাস",
    yearlyPrice: "৳৯,৯৯০ /বছর",
    desc: "টিম, উদ্যোক্তা ও ভারী ব্যবহারের জন্য সম্পূর্ণ সমাধান",
    features: [
      "Pro প্ল্যানের সকল ফিচারসমূহ",
      "টিম মেম্বার শেয়ারিং ও টাস্ক অ্যাসাইন",
      "কাস্টম টেলিগ্রাম চ্যানেল/গ্রুপ ব্রডকাস্ট",
      "এডভান্সড এআই মেমোরি এনালিটিক্স ও সার্চ",
      "ডেডিকেটেড ২৪/৭ ভিআইপি সাপোর্ট",
      "কাস্টম ডাটা এক্সপোর্ট (JSON/CSV/PDF)",
    ],
    buttonText: "Business শুরু করুন",
    href: "/checkout?plan=BUSINESS",
    popular: false,
    gradient: "from-amber-600 to-rose-600",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            আপনার সুবিধানুযায়ী সেরা প্যাকেজ বেছে নিন
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            কোনো লুকানো চার্জ নেই। বিকাশ, নগদ ও রকেটের মাধ্যমে খুব সহজেই পেমেন্ট করে তাৎক্ষণিক সাবস্ক্রিপশন সক্রিয় করুন।
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? "border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10"
                  : "border-slate-200/80 shadow-xs hover:shadow-md"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black shadow-md">
                  সবচেয়ে জনপ্রিয় (Most Popular)
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-500 font-semibold">{plan.period}</span>
                  {plan.yearlyPrice && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      {plan.yearlyPrice}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="p-0.5 rounded-full bg-emerald-50 text-emerald-600 mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={plan.href}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm ${
                    plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Guarantee Footer */}
        <div className="mt-16 text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট গেটওয়ে • বিকাশ, নগদ, রকেট সাপোর্টেড</span>
          </div>
        </div>
      </main>
    </div>
  );
}
