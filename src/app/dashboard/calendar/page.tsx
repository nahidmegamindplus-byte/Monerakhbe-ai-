"use client";

import Topbar from "@/components/layout/Topbar";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <div>
      <Topbar
        title="ইন্টারেক্টিভ ক্যালেন্ডার 📆"
        subtitle="আপনার সমস্ত রিমাইন্ডার এবং কাজের তারিখভিত্তিক সময়সূচী"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <CalendarView />
      </div>
    </div>
  );
}
