"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, Printer, ArrowLeft, Download, CheckCircle2, ShieldCheck, Calendar, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invoiceId) {
      fetch(`/api/invoices/${invoiceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.invoice) {
            setInvoice(data.invoice);
          } else {
            setError(data.error || "ইনভয়েস পাওয়া যায়নি");
          }
        })
        .catch(() => setError("ইনভয়েস লোড করতে ত্রুটি হয়েছে"))
        .finally(() => setLoading(false));
    }
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 text-center">
        <h2 className="text-xl font-bold text-rose-600">{error || "ইনভয়েস পাওয়া যায়নি"}</h2>
        <Link
          href="/dashboard/billing"
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          বিলিং পেজে ফিরে যান
        </Link>
      </div>
    );
  }

  const invoiceDate = format(new Date(invoice.invoiceDate), "dd MMMM yyyy");
  const expiryDate = invoice.subscriptionExpiresAt
    ? format(new Date(invoice.subscriptionExpiresAt), "dd MMMM yyyy")
    : "N/A";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 selection:bg-rose-500 selection:text-white print:bg-white print:text-black print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Print Controls (Hidden on Print) */}
        <div className="flex items-center justify-between print:hidden border-b border-slate-200 pb-4">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>বিলিং ড্যাশবোর্ডে ফিরে যান</span>
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF সংরক্ষণ করুন</span>
          </button>
        </div>

        {/* Invoice Paper Document */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm print:bg-white print:border-none print:shadow-none print:p-0 print:text-black">
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 print:border-slate-300 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 print:text-black">MoneRakhbe AI</h1>
                <p className="text-xs text-slate-500 print:text-slate-600">
                  স্মার্ট পার্সোনাল মেমোরি ও রিমাইন্ডার অ্যাসিস্ট্যান্ট
                </p>
                <p className="text-[10px] text-slate-400 print:text-slate-500 font-mono">
                  Dhaka, Bangladesh • support@monerakhbe.ai
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider print:border-emerald-600 print:text-emerald-700">
                ✓ পরিশোধিত (PAID)
              </span>
              <p className="text-sm font-black text-slate-900 print:text-black mt-2 font-mono">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 print:text-slate-600">তারিখ: {invoiceDate}</p>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1 bg-slate-50 print:bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600">গ্রাহকের তথ্য (Billed To):</p>
              <p className="text-sm font-bold text-slate-900 print:text-black">{invoice.customerName}</p>
              <p className="text-slate-600 print:text-slate-600">{invoice.customerEmail}</p>
              <p className="text-slate-400 print:text-slate-500 text-[11px]">বাংলাদেশ (Bangladesh)</p>
            </div>

            <div className="space-y-1 bg-slate-50 print:bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600">লেনদেন ও অর্ডার বিবরণ:</p>
              <p className="text-slate-700 print:text-black">
                <strong>অর্ডার নং:</strong> <span className="font-mono text-indigo-700 font-bold">{invoice.order?.orderNumber || invoice.orderId}</span>
              </p>
              <p className="text-slate-700 print:text-black">
                <strong>পেমেন্ট মেথড:</strong> <span className="uppercase font-semibold">{invoice.paymentMethod}</span>
              </p>
              <p className="text-slate-700 print:text-black">
                <strong>TrxID:</strong> <span className="font-mono font-bold text-emerald-700">{invoice.transactionId}</span>
              </p>
              <p className="text-slate-700 print:text-black">
                <strong>মেয়াদ উত্তীর্ণ:</strong> <span>{expiryDate}</span>
              </p>
            </div>
          </div>

          {/* Table of Line Items */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 print:bg-slate-100 text-slate-600 print:text-slate-700 uppercase text-[10px] border-b border-slate-200 print:border-slate-300">
                <tr>
                  <th className="p-3.5">বিবরণ (Description)</th>
                  <th className="p-3.5">বিলিং সাইকেল</th>
                  <th className="p-3.5 text-right">পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-slate-200 text-slate-700 print:text-black">
                <tr>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 print:text-black">{invoice.planName} Subscription</p>
                    <p className="text-[11px] text-slate-500 print:text-slate-600">
                      MoneRakhbe AI প্রিমিয়াম এআই মেমোরি, রিমাইন্ডার ও টেলিগ্রাম বট সার্ভিস
                    </p>
                  </td>
                  <td className="p-3.5 capitalize">{invoice.billingCycle.toLowerCase()}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 print:text-black">
                    ৳{invoice.amount + (invoice.discountAmount || 0)} BDT
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end text-xs">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex items-center justify-between text-slate-500 print:text-slate-600">
                <span>উপ-মোট (Subtotal):</span>
                <span>৳{invoice.amount + (invoice.discountAmount || 0)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 print:text-emerald-700 font-semibold">
                  <span>ডিসকাউন্ট:</span>
                  <span>-৳{invoice.discountAmount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-500 print:text-slate-600">
                <span>ভ্যাট / কর (VAT 0%):</span>
                <span>৳০.০০</span>
              </div>

              <div className="pt-2 border-t border-slate-200 print:border-slate-300 flex items-center justify-between font-black text-sm text-slate-900 print:text-black">
                <span>সর্বমোট পরিশোধিত:</span>
                <span className="text-base text-rose-600 print:text-black">৳{invoice.amount} BDT</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-200 print:border-slate-200 text-center text-[11px] text-slate-500 print:text-slate-500 space-y-1">
            <p>এটি একটি কম্পিউটার-জেনারেটেড অফিশিয়াল ইনভয়েস, কোনো স্বাক্ষরের প্রয়োজন নেই।</p>
            <p>MoneRakhbe AI — আপনার পার্সোনাল মেমোরি ও স্মার্ট রিমাইন্ডার অ্যাসিস্ট্যান্ট।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
