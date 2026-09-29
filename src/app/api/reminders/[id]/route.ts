import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { addHours, addDays } from "date-fns";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderId = params.id;
    const body = await req.json();

    const existing = await prisma.reminder.findUnique({
      where: { id: reminderId, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    let updateData: any = {};

    if (body.action === "complete") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
    } else if (body.action === "snooze") {
      const duration = body.duration || "1h";
      let newDueAt = new Date();
      if (duration === "1h") newDueAt = addHours(new Date(), 1);
      else if (duration === "3h") newDueAt = addHours(new Date(), 3);
      else if (duration === "tomorrow") newDueAt = addDays(new Date(), 1);

      updateData.status = "SNOOZED";
      updateData.dueAt = newDueAt;

      // Create new notification for snoozed time
      await prisma.reminderNotification.create({
        data: {
          userId: session.id,
          reminderId: existing.id,
          scheduledFor: newDueAt,
          status: "PENDING",
          channel: "TELEGRAM",
          deduplicationKey: `${existing.id}_snooze_${newDueAt.getTime()}`,
        },
      });
    } else {
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.dueAt !== undefined) updateData.dueAt = new Date(body.dueAt);
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.categoryName !== undefined) updateData.categoryName = body.categoryName;
      if (body.status !== undefined) updateData.status = body.status;
    }

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
    });

    await logAudit({
      userId: session.id,
      action: `REMINDER_${body.action ? body.action.toUpperCase() : "UPDATED"}`,
      entityType: "REMINDER",
      entityId: reminderId,
      details: updateData,
    });

    return NextResponse.json({ success: true, reminder: updated });
  } catch (error) {
    console.error("[Reminder PATCH Error]", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderId = params.id;
    const existing = await prisma.reminder.findUnique({
      where: { id: reminderId, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: "CANCELLED",
        deletedAt: new Date(),
      },
    });

    await logAudit({
      userId: session.id,
      action: "REMINDER_DELETED",
      entityType: "REMINDER",
      entityId: reminderId,
    });

    return NextResponse.json({ success: true, message: "Reminder deleted" });
  } catch (error) {
    console.error("[Reminder DELETE Error]", error);
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
  }
}
