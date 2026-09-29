import prisma from "@/lib/prisma";
import { sendReminderTelegramAlert, sendOverdueTelegramFollowUp } from "@/services/telegram/bot";
import { calculateNextOccurrence } from "@/lib/date-utils";
import { logAudit } from "@/lib/audit";
import { subHours } from "date-fns";

export async function processDueNotifications() {
  const now = new Date();

  // 1. Fetch pending notifications scheduled on or before current time
  const pendingNotifications = await prisma.reminderNotification.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    include: {
      reminder: true,
      user: {
        include: {
          telegramConnection: true,
        },
      },
    },
    take: 50,
  });

  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const notif of pendingNotifications) {
    results.processed++;

    // Check if reminder was cancelled or deleted
    if (notif.reminder.status === "CANCELLED" || notif.reminder.deletedAt) {
      await prisma.reminderNotification.update({
        where: { id: notif.id },
        data: { status: "CANCELLED" },
      });
      results.skipped++;
      continue;
    }

    const tgConn = notif.user.telegramConnection;

    if (notif.channel === "TELEGRAM" && tgConn && tgConn.isConnected && tgConn.chatId) {
      try {
        const sendRes = await sendReminderTelegramAlert({
          chatId: tgConn.chatId,
          reminder: notif.reminder,
        });

        if (sendRes.ok) {
          await prisma.reminderNotification.update({
            where: { id: notif.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });

          await logAudit({
            userId: notif.userId,
            action: "NOTIFICATION_SENT",
            entityType: "NOTIFICATION",
            entityId: notif.id,
            details: { reminderId: notif.reminderId, channel: "TELEGRAM" },
          });

          results.sent++;
        } else {
          throw new Error("Telegram send failed");
        }
      } catch (err: any) {
        console.error(`[Worker Failed Notification ${notif.id}]`, err);
        await prisma.reminderNotification.update({
          where: { id: notif.id },
          data: {
            status: notif.retryCount >= 3 ? "FAILED" : "PENDING",
            retryCount: { increment: 1 },
            errorMessage: String(err?.message || err),
          },
        });
        results.failed++;
      }
    } else {
      // Mock / Web channel success
      await prisma.reminderNotification.update({
        where: { id: notif.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
      results.sent++;
    }

    // 2. If recurring reminder, advance recurrence
    if (notif.reminder.recurrenceId) {
      const recurrence = await prisma.recurrence.findUnique({
        where: { id: notif.reminder.recurrenceId },
      });

      if (recurrence && recurrence.isActive) {
        const nextOccurrence = calculateNextOccurrence(
          recurrence.frequency,
          notif.reminder.dueAt,
          recurrence.interval,
          recurrence.timeOfDay
        );

        await prisma.recurrence.update({
          where: { id: recurrence.id },
          data: { nextOccurrence },
        });
      }
    }
  }

  // 3. Process Smart Overdue Follow-ups (2 hours past due, pending status, not yet notified of overdue)
  const overdueReminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      dueAt: { lte: subHours(now, 2) },
      deletedAt: null,
    },
    include: {
      user: {
        include: { telegramConnection: true },
      },
    },
    take: 10,
  });

  for (const reminder of overdueReminders) {
    const tgConn = reminder.user.telegramConnection;
    if (tgConn && tgConn.isConnected && tgConn.chatId) {
      // Mark reminder as OVERDUE
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "OVERDUE" },
      });

      await sendOverdueTelegramFollowUp({
        chatId: tgConn.chatId,
        reminder,
      });
    }
  }

  return results;
}
