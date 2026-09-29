import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/system - Telemetry & Database Diagnostics
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const [
      userCount,
      reminderCount,
      memoryCount,
      taskCount,
      notificationCount,
      telegramCount,
      subscriptionCount,
      auditLogCount,
      usageLogCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.reminder.count(),
      prisma.memory.count(),
      prisma.task.count(),
      prisma.reminderNotification.count(),
      prisma.telegramConnection.count(),
      prisma.subscription.count(),
      prisma.auditLog.count(),
      prisma.usageLog.count(),
    ]);

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: process.env.NODE_ENV || "development",
      telegramBotConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      geminiAiConfigured: Boolean(process.env.GEMINI_API_KEY),
      databaseUrlSet: Boolean(process.env.DATABASE_URL),
    };

    return NextResponse.json({
      success: true,
      counts: {
        users: userCount,
        reminders: reminderCount,
        memories: memoryCount,
        tasks: taskCount,
        notifications: notificationCount,
        telegramConnections: telegramCount,
        subscriptions: subscriptionCount,
        auditLogs: auditLogCount,
        usageLogs: usageLogCount,
      },
      system: systemInfo,
    });
  } catch (error: any) {
    console.error("[Admin System GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch system telemetry" }, { status: 500 });
  }
}

// POST /api/admin/system - System Actions (Export, Purge, Broadcast)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, targetTable } = body;

    if (action === "EXPORT_DATA") {
      let data: any = {};
      if (!targetTable || targetTable === "ALL") {
        const [users, reminders, memories, tasks, subscriptions, auditLogs] = await Promise.all([
          prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true } }),
          prisma.reminder.findMany(),
          prisma.memory.findMany(),
          prisma.task.findMany(),
          prisma.subscription.findMany(),
          prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" } }),
        ]);
        data = { exportedAt: new Date().toISOString(), users, reminders, memories, tasks, subscriptions, auditLogs };
      } else if (targetTable === "users") {
        data = await prisma.user.findMany();
      } else if (targetTable === "reminders") {
        data = await prisma.reminder.findMany();
      } else if (targetTable === "memories") {
        data = await prisma.memory.findMany();
      } else if (targetTable === "tasks") {
        data = await prisma.task.findMany();
      }

      await logAudit({
        userId: session.id,
        action: "ADMIN_SYSTEM_EXPORT",
        entityType: "SYSTEM",
        details: { targetTable: targetTable || "ALL" },
      });

      return NextResponse.json({ success: true, exportPayload: data });
    }

    if (action === "PURGE_AUDIT_LOGS") {
      const result = await prisma.auditLog.deleteMany();
      return NextResponse.json({ success: true, message: `Purged ${result.count} audit log records` });
    }

    if (action === "PURGE_USAGE_LOGS") {
      const result = await prisma.usageLog.deleteMany();
      return NextResponse.json({ success: true, message: `Purged ${result.count} usage log records` });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin System POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to execute system action" }, { status: 500 });
  }
}
