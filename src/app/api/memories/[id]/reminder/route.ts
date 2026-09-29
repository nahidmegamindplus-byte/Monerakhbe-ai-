import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatFriendlyDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memory = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const { title, dueAt, priority = "NORMAL", offsets = ["at_time"] } = await req.json();

    if (!title || !dueAt) {
      return NextResponse.json({ error: "Title and dueAt are required" }, { status: 400 });
    }

    const targetDueAt = new Date(dueAt);

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.id,
        title: title.trim(),
        description: memory.value || memory.summary,
        dueAt: targetDueAt,
        priority,
        categoryName: memory.category,
      },
    });

    await prisma.memory.update({
      where: { id: memory.id },
      data: { reminderId: reminder.id },
    });

    // Schedule notification
    await prisma.reminderNotification.create({
      data: {
        userId: session.id,
        reminderId: reminder.id,
        scheduledFor: targetDueAt,
        status: "PENDING",
        channel: "TELEGRAM",
        deduplicationKey: `${reminder.id}_at_time_${targetDueAt.getTime()}`,
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: memory.id,
        userId: session.id,
        action: "REMINDER_LINKED",
        source: "web_dashboard",
        description: `রিমাইন্ডার তৈরি ও লিংক করা হয়েছে: ${formatFriendlyDate(targetDueAt)}`,
      },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error: any) {
    console.error("[Create Reminder from Memory Error]", error);
    return NextResponse.json({ error: "Failed to link reminder" }, { status: 500 });
  }
}
