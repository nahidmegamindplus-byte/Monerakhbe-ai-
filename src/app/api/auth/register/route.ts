import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, timezone, language } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = (await prisma.user.count()) === 0 ? "ADMIN" : "USER"; // First user becomes admin automatically

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: userRole,
        timezone: timezone || "Asia/Dhaka",
        language: language || "bn",
        plan: "FREE",
        profile: {
          create: {
            defaultMorningTime: "09:00",
            defaultEveningTime: "17:00",
            defaultOffsetsJson: JSON.stringify(["at_time", "1_day_before"]),
          },
        },
        telegramConnection: {
          create: {
            connectionToken: crypto.randomBytes(16).toString("hex"),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        language: true,
        plan: true,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      timezone: user.timezone,
      language: user.language,
      plan: user.plan as any,
    });

    const response = NextResponse.json({ success: true, user, token });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
