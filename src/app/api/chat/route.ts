import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processUserMessage } from "@/services/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await processUserMessage({
      userId: session.id,
      message: message.trim(),
      channel: "WEB",
      userTimezone: session.timezone || "Asia/Dhaka",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json({
      success: false,
      intent: "error",
      message: "দুঃখিত, আপনার মেসেজটি প্রসেস করতে কিছুটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    });
  }
}
