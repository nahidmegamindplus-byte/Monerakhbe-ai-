const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MoneRakhbe AI database...");

  // 1. Seed Plans
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
  console.log("✅ Plans seeded successfully (FREE, PRO, BUSINESS)");

  // 2. Seed Sample Coupons
  const coupons = [
    {
      code: "LAUNCH20",
      type: "PERCENTAGE",
      value: 20,
      maxUses: 500,
      usedCount: 0,
      minOrderAmount: 400,
      active: true,
    },
    {
      code: "SAVE100",
      type: "FIXED_AMOUNT",
      value: 100,
      maxUses: 200,
      usedCount: 0,
      minOrderAmount: 499,
      active: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log("✅ Coupons seeded (LAUNCH20, SAVE100)");

  // 3. Admin User
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
    console.log("✅ Admin user created: admin@monerakhbe.ai / Admin123456!");
  } else {
    console.log("✅ Admin user already exists.");
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
