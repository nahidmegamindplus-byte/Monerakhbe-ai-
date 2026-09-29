import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Serverless (Vercel, Netlify, AWS Lambda) SQLite handling
function getDatabaseUrl(): string {
  const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.NETLIFY || 
    process.env.AWS_LAMBDA_FUNCTION_NAME || 
    process.env.LAMBDA_TASK_ROOT
  );
  const currentUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (isServerless && currentUrl.startsWith("file:")) {
    const tmpDbPath = "/tmp/dev.db";
    
    // Check if tmp db already exists and has data
    let needsCopy = true;
    try {
      if (fs.existsSync(tmpDbPath) && fs.statSync(tmpDbPath).size > 0) {
        needsCopy = false;
      }
    } catch {
      needsCopy = true;
    }

    if (needsCopy) {
      const potentialSources = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join("/var/task", "dev.db"),
        path.resolve("./prisma/dev.db"),
        path.resolve("./dev.db"),
      ];

      let copied = false;
      for (const src of potentialSources) {
        try {
          if (fs.existsSync(src) && fs.statSync(src).size > 0) {
            fs.copyFileSync(src, tmpDbPath);
            console.log(`[Prisma Init] Successfully copied seed DB from ${src} to ${tmpDbPath} (${fs.statSync(tmpDbPath).size} bytes)`);
            copied = true;
            break;
          }
        } catch (err) {
          console.warn(`[Prisma Init] Candidate ${src} failed to copy:`, err);
        }
      }

      if (!copied) {
        console.warn("[Prisma Init] No pre-seeded SQLite DB found in candidates. Connecting to /tmp/dev.db directly.");
      }
    }

    const finalUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = finalUrl;
    return finalUrl;
  }

  return currentUrl;
}

const resolvedDbUrl = getDatabaseUrl();

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;

