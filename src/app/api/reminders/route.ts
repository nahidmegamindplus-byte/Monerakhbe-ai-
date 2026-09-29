import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateNotificationDate } from "@/lib/date-utils";
import { logAudit } from "@/lib/audit";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const now = new Date();
    let whereClause: any = {
      userId: session.id,
      deletedAt: null,
    };

    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (filter === "today") {
      whereClause.dueAt = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (filter === "tomorrow") {
      const tom = addDays(now, 1);
      whereClause.dueAt = { gte: startOfDay(tom), lte: endOfDay(tom) };
    } else if (filter === "next_7_days") {
      whereClause.dueAt = { gte: startOfDay(now), lte: endOfDay(addDays(now, 7)) };
    } else if (filter === "this_week") {
      whereClause.dueAt = { gte: startOfWeek(now), lte: endOfWeek(now) };
    } else if (filter === "this_month") {
      whereClause.dueAt = { gte: startOfMonth(now), lte: endOfMonth(now) };
    } else if (filter === "recurring") {
      whereClause.recurrenceId = { not: null };
    } else if (filter === "overdue") {
      whereClause.status = "OVERDUE";
      whereClause.dueAt = { lt: now };
    }

    const reminders = await prisma.reminder.findMany({
      where: whereClause,
      include: {
        recurrence: true,
        notifications: {
          orderBy: { scheduledFor: "asc" },
        },
      },
      orderBy: { dueAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    console.error("[Reminders GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      title,
      description,
      dueAt,
      priority = "NORMAL",
      categoryName = "General",
      offsets = ["at_time"],
      recurrence,
    } = await req.json();

    if (!title || !dueAt) {
      return NextResponse.json({ error: "Title and due date/time are required" }, { status: 400 });
    }

    const targetDueAt = new Date(dueAt);

    let recurrenceId: string | null = null;
    if (recurrence && recurrence.frequency) {
      const rec = await prisma.recurrence.create({
        data: {
          userId: session.id,
          frequency: recurrence.frequency,
          interval: recurrence.interval || 1,
          dayOfWeek: recurrence.dayOfWeek ?? null,
          dayOfMonth: recurrence.dayOfMonth ?? null,
          month: recurrence.month ?? null,
          timeOfDay: recurrence.timeOfDay || null,
          nextOccurrence: targetDueAt,
          isActive: true,
        },
      });
      recurrenceId = rec.id;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.id,
        title,
        description: description || null,
        dueAt: targetDueAt,
        timezone: session.timezone,
        status: "PENDING",
        priority,
        categoryName,
        recurrenceId,
      },
      include: { recurrence: true },
    });

    // Create notifications for each offset
    for (const offset of offsets) {
      const scheduledFor = calculateNotificationDate(targetDueAt, offset);
      const deduplicationKey = `${reminder.id}_${offset}_${scheduledFor.getTime()}`;

      await prisma.reminderNotification.create({
        data: {
          userId: session.id,
          reminderId: reminder.id,
          scheduledFor,
          status: "PENDING",
          channel: "TELEGRAM",
          deduplicationKey,
        },
      });
    }

    await logAudit({
      userId: session.id,
      action: "REMINDER_CREATED",
      entityType: "REMINDER",
      entityId: reminder.id,
      details: { title, dueAt: targetDueAt, recurrence },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error("[Reminders POST Error]", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
