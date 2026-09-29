import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/reminders
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (userId && userId !== "ALL") {
      where.userId = userId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { categoryName: { contains: query } },
      ];
    }

    const [total, reminders] = await Promise.all([
      prisma.reminder.count({ where }),
      prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          notifications: {
            select: { id: true, status: true, scheduledFor: true, channel: true, sentAt: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reminders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Reminders GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reminders" }, { status: 500 });
  }
}

// POST /api/admin/reminders - Create reminder for any user
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, title, description, dueAt, priority = "NORMAL", categoryName = "General", status = "PENDING" } = body;

    if (!userId || !title || !dueAt) {
      return NextResponse.json({ error: "User ID, title, and due date/time are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Selected user not found" }, { status: 404 });
    }

    const dueDateObj = new Date(dueAt);

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        dueAt: dueDateObj,
        priority,
        categoryName,
        status,
        timezone: user.timezone || "Asia/Dhaka",
        notifications: {
          create: {
            userId,
            scheduledFor: dueDateObj,
            channel: "TELEGRAM",
            deduplicationKey: `admin_rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_REMINDER_CREATED",
      entityType: "REMINDER",
      entityId: reminder.id,
      details: { title: reminder.title, targetUser: user.email },
    });

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Reminders POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create reminder" }, { status: 500 });
  }
}

// PUT /api/admin/reminders - Edit reminder
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, dueAt, priority, categoryName, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (dueAt !== undefined) updateData.dueAt = new Date(dueAt);
    if (priority !== undefined) updateData.priority = priority;
    if (categoryName !== undefined) updateData.categoryName = categoryName;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED") updateData.completedAt = new Date();
      else if (status === "PENDING") updateData.completedAt = null;
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_REMINDER_UPDATED",
      entityType: "REMINDER",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, reminder: updatedReminder });
  } catch (error: any) {
    console.error("[Admin Reminders PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update reminder" }, { status: 500 });
  }
}

// DELETE /api/admin/reminders - Hard/soft delete reminder
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.reminderNotification.deleteMany({ where: { reminderId: id } }),
      prisma.memory.updateMany({ where: { reminderId: id }, data: { reminderId: null } }),
      prisma.reminder.delete({ where: { id } }),
    ]);

    await logAudit({
      userId: session.id,
      action: "ADMIN_REMINDER_DELETED",
      entityType: "REMINDER",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Reminder deleted successfully" });
  } catch (error: any) {
    console.error("[Admin Reminders DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete reminder" }, { status: 500 });
  }
}
