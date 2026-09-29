import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user: any = session.id ? await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        telegramConnection: {
          select: {
            isConnected: true,
            username: true,
            firstName: true,
            connectedAt: true,
            connectionToken: true,
          },
        },
        _count: {
          select: {
            reminders: { where: { deletedAt: null } },
            memories: true,
            tasks: { where: { status: { not: "COMPLETED" } } },
          },
        },
      },
    }).catch(() => null) : null;

    if (!user && session.email) {
      user = await prisma.user.findUnique({
        where: { email: session.email.toLowerCase().trim() },
        include: {
          profile: true,
          telegramConnection: {
            select: {
              isConnected: true,
              username: true,
              firstName: true,
              connectedAt: true,
              connectionToken: true,
            },
          },
          _count: {
            select: {
              reminders: { where: { deletedAt: null } },
              memories: true,
              tasks: { where: { status: { not: "COMPLETED" } } },
            },
          },
        },
      }).catch(() => null);
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        user: {
          id: session.id,
          name: session.name || "User",
          email: session.email,
          role: session.role,
          timezone: session.timezone || "Asia/Dhaka",
          language: session.language || "bn",
          plan: session.plan || "FREE",
          stats: {
            remindersCount: 0,
            memoriesCount: 0,
            pendingTasksCount: 0,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        language: user.language,
        plan: user.plan,
        profile: user.profile,
        telegram: user.telegramConnection,
        stats: {
          remindersCount: user._count?.reminders ?? 0,
          memoriesCount: user._count?.memories ?? 0,
          pendingTasksCount: user._count?.tasks ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("[Auth/Me Error]", error);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
