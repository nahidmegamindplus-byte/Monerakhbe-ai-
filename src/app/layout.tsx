import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MoneRakhbe AI — আপনার পার্সোনাল মেমোরি ও রিমাইন্ডার অ্যাসিস্ট্যান্ট",
  description: "Telegram ও Web-এ স্বাভাবিক বাংলায় কথা বলুন। AI আপনার কাজ, reminder ও তথ্য মনে রাখবে এবং সঠিক সময়ে জানিয়ে দেবে।",
  keywords: ["MoneRakhbe AI", "Telegram Reminder Bot", "Bangla AI Reminder", "Smart Memory Assistant", "Personal AI"],
  authors: [{ name: "MoneRakhbe AI Team" }],
  openGraph: {
    title: "MoneRakhbe AI — আপনি ভুলে গেলেও, MoneRakhbe মনে রাখবে",
    description: "Telegram-এ শুধু বলে দিন কী মনে রাখতে হবে। AI আপনার কাজ ও গুরুত্বপূর্ণ তথ্য মনে রাখবে এবং সময়ে মনে করিয়ে দেবে।",
    type: "website",
    url: "https://monerakhbe.ai",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
