import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক ব্লক বা বন্ধ (Off) করা হয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
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
