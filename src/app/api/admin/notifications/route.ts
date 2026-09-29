import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/notifications - List notification delivery queue
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const channel = searchParams.get("channel") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (channel && channel !== "ALL") where.channel = channel;

    const [total, notifications] = await Promise.all([
      prisma.reminderNotification.count({ where }),
      prisma.reminderNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledFor: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          reminder: { select: { id: true, title: true, dueAt: true, categoryName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Notifications GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST /api/admin/notifications - Action dispatcher (Retry failed, reset single, purge)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === "RETRY_ALL_FAILED") {
      const result = await prisma.reminderNotification.updateMany({
        where: { status: "FAILED" },
        data: { status: "PENDING", retryCount: 0, errorMessage: null },
      });

      await logAudit({
        userId: session.id,
        action: "ADMIN_RETRY_FAILED_NOTIFICATIONS",
        entityType: "NOTIFICATION",
        details: { count: result.count },
      });

      return NextResponse.json({ success: true, message: `${result.count} failed notifications reset to PENDING` });
    }

    if (action === "RETRY_SINGLE" && notificationId) {
      const updated = await prisma.reminderNotification.update({
        where: { id: notificationId },
        data: { status: "PENDING", retryCount: 0, errorMessage: null },
      });

      return NextResponse.json({ success: true, notification: updated });
    }

    if (action === "PURGE_OLD_SENT") {
      const result = await prisma.reminderNotification.deleteMany({
        where: { status: "SENT" },
      });

      return NextResponse.json({ success: true, message: `Purged ${result.count} sent notifications` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Notifications POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process notification action" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications - Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.reminderNotification.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    console.error("[Admin Notifications DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete notification" }, { status: 500 });
  }
}
