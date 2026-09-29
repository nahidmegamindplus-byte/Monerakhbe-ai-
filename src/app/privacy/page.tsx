import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> হোমপেজে ফিরুন
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">গোপনীয়তা নীতি (Privacy Policy)</h1>
            <p className="text-xs text-slate-500">সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm leading-relaxed space-y-4 text-slate-600">
          <p>
            MoneRakhbe AI আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা এবং গোপনীয়তা বজায় রাখতে প্রতিশ্রুতিবদ্ধ। এই নীতিমালায় ব্যাখ্যা করা হয়েছে কীভাবে আমরা আপনার ডেটা সংগ্রহ, ব্যবহার ও সুরক্ষা করি।
          </p>

          <h3 className="text-base font-bold text-slate-900">১. আমরা কী কী তথ্য সংগ্রহ করি?</h3>
          <p>
            • <b>অ্যাকাউন্ট তথ্য:</b> নাম, ইমেইল, এনক্রিপ্টেড পাসওয়ার্ড, টাইমজোন এবং ভাষার পছন্দ।<br />
            • <b>রিমাইন্ডার ও মেমোরি ডেটা:</b> আপনার নির্দেশিত রিমাইন্ডারের শিরোনাম, সময়সূচী, ব্যক্তিগত মেমোরি নোটস।<br />
            • <b>টেলিগ্রাম সংযোগ:</b> আপনার টেলিগ্রাম ইউজার আইডি এবং চ্যাট আইডি যাতে আমরা নোটিফিকেশন পাঠাতে পারি।
          </p>

          <h3 className="text-base font-bold text-slate-900">২. এআই প্রসেসিং ও নিরাপত্তা</h3>
          <p>
            আপনার পাঠানো মেসেজগুলো Google Gemini API এবং আমাদের সুরক্ষিত সার্ভিসের মাধ্যমে প্রসেস করা হয়। আপনার ডেটা কখনোই মডেলের পাবলিক ট্রেনিংয়ে ব্যবহৃত হয় না।
          </p>

          <h3 className="text-base font-bold text-slate-900">৩. ডেটা নিয়ন্ত্রণ ও স্থায়ীভাবে মুছে ফেলা</h3>
          <p>
            আপনি যেকোনো সময় ড্যাশবোর্ডের Settings থেকে আপনার সমস্ত ডেটা JSON/CSV ফরম্যাটে ডাউনলোড করতে পারেন অথবা এক ক্লিকে চিরতরে মুছে ফেলতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
}
