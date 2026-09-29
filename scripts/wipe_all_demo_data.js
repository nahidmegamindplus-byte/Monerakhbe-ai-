const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("=== WIPING ALL DEMO & TEST DATA FROM MONERAKHBE AI DATABASE ===");

  // 1. Delete all transactional, reminder, memory, task, notification, payment records
  console.log("1. Deleting refunds, invoices, payment transactions, and orders...");
  await prisma.refund.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.order.deleteMany({});

  console.log("2. Deleting reminder notifications, recurrences, and reminders...");
  await prisma.reminderNotification.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.recurrence.deleteMany({});

  console.log("3. Deleting memory attachments, embeddings, timelines, and memories...");
  await prisma.memoryAttachment.deleteMany({});
  await prisma.memoryEmbedding.deleteMany({});
  await prisma.memoryTimeline.deleteMany({});
  await prisma.memory.deleteMany({});

  console.log("4. Deleting tasks, messages, usage logs, audit logs, and subscriptions...");
  await prisma.task.deleteMany({});
  await prisma.conversationMessage.deleteMany({});
  await prisma.usageLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.subscription.deleteMany({});

  console.log("5. Cleaning up non-admin test users...");
  await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" },
    },
  });

  console.log("6. Resetting admin connections and ensuring clean admin state...");
  await prisma.telegramConnection.deleteMany({});
  
  // Ensure default plans exist
  const plans = [
    {
      id: "FREE",
      name: "Free Basic",
      description: "ব্যক্তিগত সাধারণ কাজের জন্য আজীবন ফ্রি ব্যবহার করুন",
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: "BDT",
      memoryLimit: 15,
      reminderLimit: 30,
      taskLimit: 30,
      aiLimit: 50,
      fileSizeLimit: 5,
      telegramEnabled: true,
      advancedFeatures: false,
      isActive: true,
    },
    {
      id: "PRO",
      name: "Pro Personal",
      description: "প্রফেশনাল ও ফ্রিল্যান্সারদের জন্য স্মার্ট মেমোরি ও এআই রিমাইন্ডার",
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: "BDT",
      memoryLimit: 1000,
      reminderLimit: 2000,
      taskLimit: 2000,
      aiLimit: 1500,
      fileSizeLimit: 50,
      telegramEnabled: true,
      advancedFeatures: true,
      isActive: true,
    },
    {
      id: "BUSINESS",
      name: "Business Executive",
      description: "উদ্যোক্তা ও টিমের জন্য সীমাহীন মেমোরি ও সর্বোচ্চ প্রায়োরিটি বট",
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      currency: "BDT",
      memoryLimit: 10000,
      reminderLimit: 20000,
      taskLimit: 20000,
      aiLimit: 10000,
      fileSizeLimit: 200,
      telegramEnabled: true,
      advancedFeatures: true,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  // Ensure Admin user exists with clean state
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const passwordHash = await bcrypt.hash("Admin123456!", 10);
  if (!existingAdmin) {
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
      },
    });
    console.log("Created clean Admin user: admin@monerakhbe.ai / Admin123456!");
  } else {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: "ADMIN",
        plan: "BUSINESS",
        isSuspended: false,
      },
    });
    console.log("Admin account preserved and cleaned.");
  }

  const [users, reminders, memories, tasks, orders, subs] = await Promise.all([
    prisma.user.count(),
    prisma.reminder.count(),
    prisma.memory.count(),
    prisma.task.count(),
    prisma.order.count(),
    prisma.subscription.count(),
  ]);

  console.log("\n=== DATABASE CLEAN SUMMARY ===");
  console.log(`Users: ${users} (Admin only)`);
  console.log(`Reminders: ${reminders}`);
  console.log(`Memories: ${memories}`);
  console.log(`Tasks: ${tasks}`);
  console.log(`Orders: ${orders}`);
  console.log(`Subscriptions: ${subs}`);
  console.log("All demo and test data has been 100% wiped clean!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
