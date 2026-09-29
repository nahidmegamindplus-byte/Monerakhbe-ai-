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

    const user = await prisma.user.findUnique({
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
          remindersCount: user._count.reminders,
          memoriesCount: user._count.memories,
          pendingTasksCount: user._count.tasks,
        },
      },
    });
  } catch (error) {
    console.error("[Auth/Me Error]", error);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
