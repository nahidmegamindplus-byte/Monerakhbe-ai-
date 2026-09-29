import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMasterAdminAttempt = cleanEmail === "admin@monerakhbe.ai" || cleanEmail === (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    // Auto-bootstrap master admin and system initial data on-demand if necessary
    if (isMasterAdminAttempt) {
      const { ensureMasterAdmin, ensureDefaultSystemData } = await import("@/lib/bootstrap");
      await ensureMasterAdmin(cleanEmail, password);
      await ensureDefaultSystemData();
    }

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // If master admin attempt and user was not found or password matched master default, ensure admin user
    if (isMasterAdminAttempt && !user) {
      const { ensureMasterAdmin } = await import("@/lib/bootstrap");
      user = await ensureMasterAdmin(cleanEmail, password);
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক ব্লক বা বন্ধ (Off) করা হয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    let isMatch = await verifyPassword(password, user.passwordHash);
    
    // Master admin fallback recovery: if master admin logs in with default master password
    if (!isMatch && isMasterAdminAttempt && (
      password === "Admin123456!" || 
      password === "Admin@123456" || 
      password === process.env.ADMIN_PASSWORD
    )) {
      const { hashPassword } = await import("@/lib/auth");
      const newHash = await hashPassword(password);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, role: "ADMIN", isSuspended: false },
      });
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      timezone: user.timezone,
      language: user.language,
      plan: user.plan as any,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
        language: user.language,
        plan: user.plan,
      },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
