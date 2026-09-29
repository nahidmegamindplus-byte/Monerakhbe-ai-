import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureDefaultSystemData } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

const FALLBACK_PLANS = [
  {
    id: "FREE",
    name: "Free Basic",
    description: "ব্যক্তিগত সাধারণ কাজের জন্য আজীবন ফ্রি ব্যবহার করুন",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "BDT",
    memoryLimit: 15,
    reminderLimit: 30,
    taskLimit: 30,
    aiLimit: 50,
    fileSizeLimit: 5,
    telegramEnabled: true,
    advancedFeatures: false,
    isActive: true,
  },
  {
    id: "PRO",
    name: "Pro Personal",
    description: "প্রফেশনাল ও ফ্রিল্যান্সারদের জন্য স্মার্ট মেমোরি ও এআই রিমাইন্ডার",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: "BDT",
    memoryLimit: 1000,
    reminderLimit: 2000,
    taskLimit: 2000,
    aiLimit: 1500,
    fileSizeLimit: 50,
    telegramEnabled: true,
    advancedFeatures: true,
    isActive: true,
  },
  {
    id: "BUSINESS",
    name: "Business Pro",
    description: "উদ্যোক্তা ও টিমের জন্য সীমাহীন মেমোরি ও সর্বোচ্চ প্রায়োরিটি বট",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: "BDT",
    memoryLimit: 10000,
    reminderLimit: 20000,
    taskLimit: 20000,
    aiLimit: 10000,
    fileSizeLimit: 200,
    telegramEnabled: true,
    advancedFeatures: true,
    isActive: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    let plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
    });

    if (!plans || plans.length === 0) {
      await ensureDefaultSystemData();
      plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { monthlyPrice: "asc" },
      });
    }

    if (!plans || plans.length === 0) {
      plans = FALLBACK_PLANS as any;
    }

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("[Plans GET Error]", error);
    return NextResponse.json({ success: true, plans: FALLBACK_PLANS });
  }
}
