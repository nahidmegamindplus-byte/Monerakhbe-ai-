import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processUserMessage } from "@/services/ai";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const messages = await prisma.conversationMessage.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return NextResponse.json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error: any) {
    console.error("[Chat GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}

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
