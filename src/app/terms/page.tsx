import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">ব্যবহারের শর্তাবলী (Terms of Service)</h1>
            <p className="text-xs text-slate-500">সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm leading-relaxed space-y-4 text-slate-600">
          <p>
            MoneRakhbe AI ওয়েবসাইট এবং টেলিগ্রাম বট ব্যবহারের মাধ্যমে আপনি নিচের শর্তাবলীর সাথে সম্মত হচ্ছেন।
          </p>

          <h3 className="text-base font-bold text-slate-900">১. সেবার পরিধি</h3>
          <p>
            MoneRakhbe AI ব্যবহারকারীদের দৈনন্দিন রিমাইন্ডার, টাস্ক শিডিউলিং এবং ব্যক্তিগত তথ্য ব্যবস্থাপনায় সহায়তা প্রদান করে।
          </p>

          <h3 className="text-base font-bold text-slate-900">২. সঠিক ও ন্যায্য ব্যবহার</h3>
          <p>
            ইউজার কোনো ক্ষতিকর, বেআইনি বা স্প্যামিং কার্যক্রমে MoneRakhbe AI ব্যবহার করতে পারবেন না। এই ধরনের অপব্যবহারের ক্ষেত্রে তাৎক্ষণিকভাবে অ্যাকাউন্ট স্থগিত করা হতে পারে।
          </p>
        </div>
      </div>
    </div>
  );
}
