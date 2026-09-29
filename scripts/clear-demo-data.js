const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up all demo data...");

  // Delete all memories, attachments, embeddings, timelines
  await prisma.memoryTimeline.deleteMany({});
  await prisma.memoryEmbedding.deleteMany({});
  await prisma.memoryAttachment.deleteMany({});
  await prisma.memory.deleteMany({});

  // Delete all reminders, notifications, recurrences
  await prisma.reminderNotification.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.recurrence.deleteMany({});

  // Delete all tasks, messages, logs
  await prisma.task.deleteMany({});
  await prisma.conversationMessage.deleteMany({});
  await prisma.usageLog.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log("All demo memories, reminders, tasks, and messages have been cleared!");

  // Ensure clean admin user exists without sample data
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin123456!", 10);
    await prisma.user.create({
      data: {
        name: "MoneRakhbe Admin",
        email: "admin@monerakhbe.ai",
        passwordHash,
        role: "ADMIN",
        plan: "BUSINESS",
        timezone: "Asia/Dhaka",
        language: "bn",
        profile: {
          create: {
            defaultMorningTime: "09:00",
            defaultEveningTime: "17:00",
            defaultOffsetsJson: JSON.stringify(["at_time", "1_day_before"]),
          },
        },
        telegramConnection: {
          create: {
            isConnected: false,
            connectionToken: "demo_admin_connection_token",
          },
        },
      },
    });
    console.log("Clean Admin user ready: admin@monerakhbe.ai / Admin123456!");
  } else {
    console.log("Admin account preserved.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
