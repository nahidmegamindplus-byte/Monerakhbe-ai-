import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, createToken, setTokenCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন।" }, { status: 401 });
    }

    // Update current user role to ADMIN in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { role: "ADMIN", isSuspended: false },
    });

    // Re-issue JWT token with ADMIN role
    const token = await createToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: "ADMIN",
      timezone: updatedUser.timezone,
      language: updatedUser.language,
      plan: updatedUser.plan,
    });

    const response = NextResponse.json({
      success: true,
      message: "আপনার অ্যাকাউন্টকে সফলভাবে অ্যাডমিন এক্সেস দেওয়া হয়েছে!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: "ADMIN",
      },
    });

    return setTokenCookie(response, token);
  } catch (error: any) {
    console.error("[Promote Admin Error]", error);
    return NextResponse.json({ error: "অ্যাডমিন এক্সেস প্রদানে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
