"use client";

import Topbar from "@/components/layout/Topbar";
import WebChatWidget from "@/components/chat/WebChatWidget";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      <Topbar
        title="MoneRakhbe AI সহকারী 💬"
        subtitle="প্রাকৃতিক ভাষায় মেসেজ পাঠিয়ে রিমাইন্ডার ও মেমোরি তৈরি করুন"
      />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-4 overflow-hidden">
        <WebChatWidget />
      </div>
    </div>
  );
}
