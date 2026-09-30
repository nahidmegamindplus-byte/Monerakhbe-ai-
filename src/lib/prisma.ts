import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// SQL DDL statements for SQLite self-healing
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "language" TEXT NOT NULL DEFAULT 'bn',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultMorningTime" TEXT NOT NULL DEFAULT '09:00',
    "defaultEveningTime" TEXT NOT NULL DEFAULT '17:00',
    "defaultOffsetsJson" TEXT NOT NULL DEFAULT '["at_time"]',
    "notificationPreferences" TEXT NOT NULL DEFAULT '{"telegram":true,"email":false,"web":true}',
    "aiPreferences" TEXT NOT NULL DEFAULT '{"languageStyle":"natural","confirmDeletions":true}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "telegram_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT,
    "chatId" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "connectionToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "connectedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "telegram_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "categoryName" TEXT NOT NULL DEFAULT 'General',
    "recurrenceId" TEXT,
    "completedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "recurrences" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "recurrences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "month" INTEGER,
    "timeOfDay" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "nextOccurrence" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recurrences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "reminder_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "channel" TEXT NOT NULL DEFAULT 'TELEGRAM',
    "deduplicationKey" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminder_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminder_notifications_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "memories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Personal',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tags" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual_text',
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "summary" TEXT,
    "extractedText" TEXT,
    "structuredData" TEXT,
    "reminderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memories_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "memory_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "extractedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memory_attachments_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "memory_embeddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embeddingJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memory_embeddings_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "memory_timelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memory_timelines_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueDate" DATETIME,
    "dueTime" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Work',
    "tags" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "conversation_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "usage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" REAL NOT NULL DEFAULT 0,
    "yearlyPrice" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "memoryLimit" INTEGER NOT NULL DEFAULT 10,
    "reminderLimit" INTEGER NOT NULL DEFAULT 20,
    "taskLimit" INTEGER NOT NULL DEFAULT 20,
    "aiLimit" INTEGER NOT NULL DEFAULT 50,
    "fileSizeLimit" INTEGER NOT NULL DEFAULT 5,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT true,
    "advancedFeatures" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "amount" REAL NOT NULL,
    "originalAmount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "providerTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerTrxId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawReference" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL DEFAULT 'FREE',
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "paymentMethod" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "validUntil" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "coupons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" REAL NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minOrderAmount" REAL NOT NULL DEFAULT 0,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "refunds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentTransactionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "providerRefundId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "refunds_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionExpiresAt" DATETIME,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "payment_method_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WALLET',
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'Personal',
    "instructions" TEXT,
    "qrCodeUrl" TEXT,
    "chargePercent" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "profiles_userId_key" ON "profiles"("userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connections_userId_key" ON "telegram_connections"("userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connections_telegramUserId_key" ON "telegram_connections"("telegramUserId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connections_connectionToken_key" ON "telegram_connections"("connectionToken");`,
  `CREATE INDEX IF NOT EXISTS "reminders_userId_status_dueAt_idx" ON "reminders"("userId", "status", "dueAt");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reminder_notifications_deduplicationKey_key" ON "reminder_notifications"("deduplicationKey");`,
  `CREATE INDEX IF NOT EXISTS "reminder_notifications_status_scheduledFor_idx" ON "reminder_notifications"("status", "scheduledFor");`,
  `CREATE INDEX IF NOT EXISTS "memories_userId_category_idx" ON "memories"("userId", "category");`,
  `CREATE INDEX IF NOT EXISTS "memories_userId_source_idx" ON "memories"("userId", "source");`,
  `CREATE INDEX IF NOT EXISTS "memory_attachments_memoryId_idx" ON "memory_attachments"("memoryId");`,
  `CREATE INDEX IF NOT EXISTS "memory_attachments_userId_idx" ON "memory_attachments"("userId");`,
  `CREATE INDEX IF NOT EXISTS "memory_embeddings_userId_memoryId_idx" ON "memory_embeddings"("userId", "memoryId");`,
  `CREATE INDEX IF NOT EXISTS "memory_timelines_memoryId_idx" ON "memory_timelines"("memoryId");`,
  `CREATE INDEX IF NOT EXISTS "memory_timelines_userId_idx" ON "memory_timelines"("userId");`,
  `CREATE INDEX IF NOT EXISTS "tasks_userId_status_idx" ON "tasks"("userId", "status");`,
  `CREATE INDEX IF NOT EXISTS "conversation_messages_userId_channel_createdAt_idx" ON "conversation_messages"("userId", "channel", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "usage_logs_userId_createdAt_idx" ON "usage_logs"("userId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "orders_transactionId_key" ON "orders"("transactionId");`,
  `CREATE INDEX IF NOT EXISTS "orders_userId_status_idx" ON "orders"("userId", "status");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_transactionId_key" ON "payment_transactions"("transactionId");`,
  `CREATE INDEX IF NOT EXISTS "payment_transactions_orderId_status_idx" ON "payment_transactions"("orderId", "status");`,
  `CREATE INDEX IF NOT EXISTS "payment_transactions_userId_idx" ON "payment_transactions"("userId");`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");`,
  `CREATE INDEX IF NOT EXISTS "refunds_orderId_idx" ON "refunds"("orderId");`,
  `CREATE INDEX IF NOT EXISTS "refunds_userId_idx" ON "refunds"("userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "invoices_orderId_key" ON "invoices"("orderId");`,
  `CREATE INDEX IF NOT EXISTS "invoices_userId_idx" ON "invoices"("userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payment_method_configs_code_key" ON "payment_method_configs"("code");`
];

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabaseReady(client: PrismaClient): Promise<void> {
  if (isInitialized) return;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const dbUrl = process.env.DATABASE_URL || "";
      const isSqlite = dbUrl.startsWith("file:") || dbUrl.includes("sqlite");

      if (isSqlite) {
        // Check if users table exists in SQLite
        const tables: any[] = await client.$queryRawUnsafe(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
        ).catch(() => []);

        const needsSchema = !tables || tables.length === 0;

        if (needsSchema) {
          console.log("[DB Auto-Init] Initializing SQLite database schema...");
          for (const statement of SCHEMA_STATEMENTS) {
            try {
              await client.$executeRawUnsafe(statement);
            } catch (err: any) {
              console.warn("[DB Auto-Init] Statement notice:", err.message);
            }
          }
          console.log("[DB Auto-Init] Schema created successfully.");
        }
      }

      // Ensure Plans exist
      const planCount = await client.plan.count().catch(() => 0);
      if (planCount === 0) {
        console.log("[DB Auto-Init] Seeding default plans...");
        await client.plan.createMany({
          data: [
            {
              id: "FREE",
              name: "Free",
              description: "নতুন ব্যবহারকারীদের জন্য বেসিক মেমোরি ও রিমাইন্ডার",
              monthlyPrice: 0,
              yearlyPrice: 0,
              currency: "BDT",
              memoryLimit: 10,
              reminderLimit: 20,
              taskLimit: 20,
              aiLimit: 50,
              fileSizeLimit: 5,
              telegramEnabled: true,
              advancedFeatures: false,
              isActive: true,
            },
            {
              id: "PRO",
              name: "Pro",
              description: "ব্যক্তিগত ও প্রফেশনাল ব্যবহারের জন্য আনলিমিটেড পাওয়ার",
              monthlyPrice: 299,
              yearlyPrice: 2990,
              currency: "BDT",
              memoryLimit: 500,
              reminderLimit: 1000,
              taskLimit: 1000,
              aiLimit: 1000,
              fileSizeLimit: 25,
              telegramEnabled: true,
              advancedFeatures: true,
              isActive: true,
            },
            {
              id: "BUSINESS",
              name: "Business",
              description: "ব্যবসা ও টিমের জন্য সর্বোচ্চ মেমোরি ও অগ্রাধিকার সাপোর্ট",
              monthlyPrice: 799,
              yearlyPrice: 7990,
              currency: "BDT",
              memoryLimit: 5000,
              reminderLimit: 10000,
              taskLimit: 10000,
              aiLimit: 5000,
              fileSizeLimit: 100,
              telegramEnabled: true,
              advancedFeatures: true,
              isActive: true,
            },
          ],
        }).catch((e) => console.warn("[DB Auto-Init] Seed plans notice:", e.message));
      }

      // Ensure Admin user exists
      const adminEmail = (process.env.ADMIN_EMAIL || "admin@monerakhbe.ai").toLowerCase().trim();
      const existingAdmin = await client.user.findUnique({ where: { email: adminEmail } }).catch(() => null);
      if (!existingAdmin) {
        console.log(`[DB Auto-Init] Creating master admin user (${adminEmail})...`);
        const passwordHash = await bcrypt.hash("Admin123456!", 10);
        await client.user.create({
          data: {
            name: "Super Admin",
            email: adminEmail,
            passwordHash,
            role: "ADMIN",
            plan: "BUSINESS",
            profile: {
              create: {
                defaultMorningTime: "09:00",
                defaultEveningTime: "17:00",
                notificationPreferences: JSON.stringify({ telegram: true, email: true, web: true }),
              },
            },
          },
        }).catch((e) => console.warn("[DB Auto-Init] Seed admin notice:", e.message));
      }

      // Ensure Payment Methods exist
      const methodCount = await client.paymentMethodConfig.count().catch(() => 0);
      if (methodCount === 0) {
        console.log("[DB Auto-Init] Seeding payment methods...");
        await client.paymentMethodConfig.createMany({
          data: [
            {
              code: "bkash",
              name: "বিকাশ (bKash)",
              type: "WALLET",
              accountNumber: "01886123456",
              accountType: "Personal",
              instructions: "বিকাশ অ্যাপ থেকে 'Send Money' করুন উপরের নম্বরে। তারপর TrxID নিচে লিখুন।",
              chargePercent: 0,
              displayOrder: 1,
              isActive: true,
            },
            {
              code: "nagad",
              name: "নগদ (Nagad)",
              type: "WALLET",
              accountNumber: "01712345678",
              accountType: "Personal",
              instructions: "নগদ অ্যাপ থেকে 'Send Money' করুন উপরের নম্বরে। তারপর TrxID নিচে লিখুন।",
              chargePercent: 0,
              displayOrder: 2,
              isActive: true,
            },
            {
              code: "rocket",
              name: "রকেট (Rocket)",
              type: "WALLET",
              accountNumber: "019123456789",
              accountType: "Personal",
              instructions: "রকেট অ্যাপ থেকে 'Send Money' করুন উপরের নম্বরে। তারপর TrxID নিচে লিখুন।",
              chargePercent: 0,
              displayOrder: 3,
              isActive: true,
            },
          ],
        }).catch((e) => console.warn("[DB Auto-Init] Seed methods notice:", e.message));
      }

      isInitialized = true;
      console.log("[DB Auto-Init] Database ready.");
    } catch (err: any) {
      console.error("[DB Auto-Init] Error:", err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// Ensure database URL matches PostgreSQL protocol for Prisma schema validation
function getDatabaseUrl(): string {
  let currentUrl = (process.env.DATABASE_URL || "").trim();

  // If missing or legacy SQLite file: path is passed, ensure standard postgresql protocol
  if (!currentUrl || (!currentUrl.startsWith("postgresql://") && !currentUrl.startsWith("postgres://"))) {
    console.warn("[Prisma Init] DATABASE_URL was missing or invalid for PostgreSQL provider. Defaulting to Supabase PostgreSQL configuration.");
    currentUrl = "postgresql://postgres:[YOUR-PASSWORD]@db.ialbrmbfummsbtywpsfg.supabase.co:5432/postgres";
    process.env.DATABASE_URL = currentUrl;
  }

  return currentUrl;
}

const resolvedDbUrl = getDatabaseUrl();

const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          await ensureDatabaseReady(baseClient);
          return query(args);
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ExtendedPrismaClient;
}

export const prisma = (globalThis.prisma ?? createPrismaClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma as any;
}

export default prisma;
