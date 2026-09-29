import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function checkDuplicateReminder({
  userId,
  title,
  dueAt,
}: {
  userId: string;
  title: string;
  dueAt: Date;
}): Promise<{ isDuplicate: boolean; existingReminderId?: string; existingTitle?: string }> {
  try {
    const dayStart = new Date(dueAt);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dueAt);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.reminder.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "SNOOZED"] },
        dueAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existing) {
      // Check title similarity
      const cleanExisting = existing.title.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, "");
      const cleanNew = title.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, "");

      if (cleanExisting.includes(cleanNew) || cleanNew.includes(cleanExisting)) {
        return {
          isDuplicate: true,
          existingReminderId: existing.id,
          existingTitle: existing.title,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    return { isDuplicate: false };
  }
}
