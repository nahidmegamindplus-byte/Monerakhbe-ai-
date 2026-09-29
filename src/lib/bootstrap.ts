import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@monerakhbe.ai").toLowerCase().trim();
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123456!";

/**
 * Ensures that the master admin user exists in the database with role: "ADMIN".
 * If not present, it creates the admin account automatically on-the-fly.
 */
export async function ensureMasterAdmin(providedEmail?: string, providedPassword?: string) {
  try {
    const targetEmail = (providedEmail || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
    const isMasterEmail = targetEmail === DEFAULT_ADMIN_EMAIL || targetEmail === "admin@monerakhbe.ai";

    let adminUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!adminUser && isMasterEmail) {
      const passwordToHash = providedPassword || DEFAULT_ADMIN_PASSWORD;
      const passwordHash = await bcrypt.hash(passwordToHash, 10);

      adminUser = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash,
          name: "MoneRakhbe Super Admin",
          role: "ADMIN",
          plan: "BUSINESS",
          isSuspended: false,
          timezone: "Asia/Dhaka",
          language: "bn",
        },
      });

      console.log(`[Bootstrap] Auto-created master admin: ${targetEmail}`);
    } else if (adminUser && isMasterEmail && adminUser.role !== "ADMIN") {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN", isSuspended: false },
      });
      console.log(`[Bootstrap] Promoted existing account to ADMIN: ${targetEmail}`);
    }

    return adminUser;
  } catch (error) {
    console.error("[Bootstrap Error: ensureMasterAdmin]", error);
    return null;
  }
}

/**
 * Ensures system initial default Plans and Payment Methods exist.
 */
export async function ensureDefaultSystemData() {
  try {
    // 1. Ensure Plans
    const planCount = await prisma.plan.count();
    if (planCount === 0) {
      await prisma.plan.createMany({
        data: [
          {
            id: "FREE",
            name: "বেসিক (ফ্রি)",
            description: "দৈনন্দিন ব্যক্তিগত সাধারণ রিমাইন্ডার ও মেমোরি সংরক্ষণ",
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
            name: "প্রো মেম্বারশিপ",
            description: "আনলিমিটেড এআই রিমাইন্ডার, স্মার্ট ভয়েস এবং রিকারিং শিডিউল",
            monthlyPrice: 199,
            yearlyPrice: 1990,
            currency: "BDT",
            memoryLimit: 500,
            reminderLimit: 1000,
            taskLimit: 1000,
            aiLimit: 2000,
            fileSizeLimit: 25,
            telegramEnabled: true,
            advancedFeatures: true,
            isActive: true,
          },
          {
            id: "BUSINESS",
            name: "বিজনেস ও আলটিমেট",
            description: "সম্পূর্ণ আনলিমিটেড মেমোরি, সর্বোচ্চ অগ্রাধিকার ও কাস্টম অ্যাসিস্ট্যান্ট",
            monthlyPrice: 499,
            yearlyPrice: 4990,
            currency: "BDT",
            memoryLimit: 5000,
            reminderLimit: 10000,
            taskLimit: 10000,
            aiLimit: 10000,
            fileSizeLimit: 100,
            telegramEnabled: true,
            advancedFeatures: true,
            isActive: true,
          },
        ],
      });
      console.log("[Bootstrap] Seeded default SaaS plans.");
    }

    // 2. Ensure Payment Methods
    const paymentMethodCount = await prisma.paymentMethodConfig.count();
    if (paymentMethodCount === 0) {
      await prisma.paymentMethodConfig.createMany({
        data: [
          {
            code: "bkash",
            name: "বিকাশ (bKash Personal / Send Money)",
            type: "WALLET",
            accountNumber: "01886123456",
            accountType: "Personal",
            instructions: "বিকাশ অ্যাপ বা *247# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।",
            chargePercent: 0,
            isActive: true,
            displayOrder: 1,
          },
          {
            code: "nagad",
            name: "নগদ (Nagad Send Money)",
            type: "WALLET",
            accountNumber: "01886123456",
            accountType: "Personal",
            instructions: "নগদ অ্যাপ বা *167# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।",
            chargePercent: 0,
            isActive: true,
            displayOrder: 2,
          },
          {
            code: "rocket",
            name: "রকেট (Rocket Send Money)",
            type: "WALLET",
            accountNumber: "018861234568",
            accountType: "Personal",
            instructions: "রকেট অ্যাপ বা *322# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি প্রদান করুন।",
            chargePercent: 0,
            isActive: true,
            displayOrder: 3,
          },
        ],
      });
      console.log("[Bootstrap] Seeded default payment methods.");
    }
  } catch (error) {
    console.error("[Bootstrap Error: ensureDefaultSystemData]", error);
  }
}
