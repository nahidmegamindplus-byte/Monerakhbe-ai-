import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalTelegramConnections,
      totalReminders,
      completedReminders,
      pendingReminders,
      totalMemories,
      totalTasks,
      totalAiRequests,
      failedNotifications,
      activeSubscriptions,
      recentUsers,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSuspended: false } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.telegramConnection.count({ where: { isConnected: true } }),
      prisma.reminder.count({ where: { deletedAt: null } }),
      prisma.reminder.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.reminder.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.memory.count(),
      prisma.task.count(),
      prisma.usageLog.count({ where: { actionType: "AI_REQUEST" } }),
      prisma.reminderNotification.count({ where: { status: "FAILED" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          isSuspended: true,
          createdAt: true,
          telegramConnection: { select: { isConnected: true, username: true } },
          _count: { select: { reminders: true, memories: true, tasks: true } },
        },
      }),
      prisma.auditLog.findMany({
        take: 25,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalTelegramConnections,
        totalReminders,
        completedReminders,
        pendingReminders,
        totalMemories,
        totalTasks,
        totalAiRequests,
        failedNotifications,
        activeSubscriptions,
      },
      users: recentUsers,
      auditLogs: recentAuditLogs,
    });
  } catch (error: any) {
    console.error("[Admin GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch admin overview data" }, { status: 500 });
  }
}
