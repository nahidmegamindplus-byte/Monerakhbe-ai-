import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        timezone: true,
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        assistantName: "MoneRakhbe",
        userName: user?.name,
        email: user?.email,
        language: user?.language || "bn",
        timezone: user?.timezone || "Asia/Dhaka",
        defaultMorningTime: user?.profile?.defaultMorningTime || "09:00",
        defaultEveningTime: user?.profile?.defaultEveningTime || "17:00",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch assistant profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userName, language, timezone, defaultMorningTime, defaultEveningTime } = body;

    const updateData: any = {};
    if (userName) updateData.name = userName.trim();
    if (language) updateData.language = language;
    if (timezone) updateData.timezone = timezone;

    await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    await prisma.profile.upsert({
      where: { userId: session.id },
      update: {
        defaultMorningTime: defaultMorningTime || "09:00",
        defaultEveningTime: defaultEveningTime || "17:00",
      },
      create: {
        userId: session.id,
        defaultMorningTime: defaultMorningTime || "09:00",
        defaultEveningTime: defaultEveningTime || "17:00",
      },
    });

    return NextResponse.json({ success: true, message: "অ্যাসিস্ট্যান্ট প্রোফাইল আপডেট করা হয়েছে!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
