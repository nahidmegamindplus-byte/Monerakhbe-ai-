import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { ensureMasterAdmin, ensureDefaultSystemData } = await import("@/lib/bootstrap");
    await ensureDefaultSystemData();

    const session = await getSessionUser(req);
    let targetUser: any = null;

    if (session) {
      targetUser = await prisma.user.update({
        where: { id: session.id },
        data: { role: "ADMIN", isSuspended: false },
      });
    } else {
      // If no session, auto-provision and authenticate master admin
      targetUser = await ensureMasterAdmin();
    }

    if (!targetUser) {
      return NextResponse.json({ error: "অ্যাডমিন এক্সেস প্রদান করা সম্ভব হয়নি।" }, { status: 500 });
    }

    // Re-issue JWT token with ADMIN role
    const token = signToken({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: "ADMIN",
      timezone: targetUser.timezone,
      language: targetUser.language,
      plan: targetUser.plan as any,
    });

    const response = NextResponse.json({
      success: true,
      message: "আপনার অ্যাকাউন্টকে সফলভাবে অ্যাডমিন এক্সেস দেওয়া হয়েছে!",
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: "ADMIN",
      },
    });

    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Promote Admin Error]", error);
    return NextResponse.json({ error: "অ্যাডমিন এক্সেস প্রদানে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
