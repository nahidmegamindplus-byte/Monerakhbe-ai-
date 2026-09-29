import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Vercel Serverless / AWS Lambda SQLite handling
function setupVercelDatabase() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
    if (!dbUrl || dbUrl.startsWith("file:")) {
      const tmpDbPath = "/tmp/dev.db";
      if (!fs.existsSync(tmpDbPath)) {
        const potentialSources = [
          path.join(process.cwd(), "dev.db"),
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join("/var/task", "dev.db"),
          path.join("/var/task", "prisma", "dev.db"),
        ];

        for (const src of potentialSources) {
          if (fs.existsSync(src)) {
            try {
              fs.copyFileSync(src, tmpDbPath);
              console.log(`[Prisma Init] Copied seed DB from ${src} to ${tmpDbPath}`);
              break;
            } catch (err) {
              console.error("[Prisma Init] Failed to copy SQLite db to /tmp:", err);
            }
          }
        }
      }
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
    }
  }
}

setupVercelDatabase();

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

globalThis.prisma = prisma;

export default prisma;
