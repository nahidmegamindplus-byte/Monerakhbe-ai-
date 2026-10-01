import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { autoSyncTelegramWebhook } from "@/services/telegram/sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    autoSyncTelegramWebhook(req).catch(() => {});
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    let botUsername = process.env.TELEGRAM_BOT_USERNAME || "";

    // Fallback: Check Database for saved Telegram bot config
    if (!botToken) {
      try {
        const dbConfig = await prisma.paymentMethodConfig.findUnique({
          where: { code: "system_telegram_bot" },
        });
        if (dbConfig && dbConfig.accountNumber) {
          botToken = dbConfig.accountNumber;
          botUsername = dbConfig.instructions || botUsername;
          process.env.TELEGRAM_BOT_TOKEN = botToken;
          if (botUsername) process.env.TELEGRAM_BOT_USERNAME = botUsername;
        }
      } catch (err) {
        console.warn("[Telegram Config DB Read Warn]", err);
      }
    }

    return NextResponse.json({
      success: true,
      hasToken: Boolean(botToken && botToken.trim()),
      botUsername,
      maskedToken: botToken ? `${botToken.slice(0, 6)}...${botToken.slice(-4)}` : "",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { botToken, botUsername } = await req.json();

    if (!botToken || !botToken.trim()) {
      return NextResponse.json({ error: "Bot Token is required" }, { status: 400 });
    }

    const cleanToken = botToken.trim();
    const cleanUsername = (botUsername || "MoneRakhbeBot").replace(/^@/, "").trim();

    // 1. Verify token with Telegram API
    try {
      const testRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const testData = await testRes.json();

      if (!testData.ok) {
        return NextResponse.json(
          { error: "টেলিগ্রাম টোকেনটি সঠিক নয়! অনুগ্রহ করে BotFather থেকে প্রাপ্ত সঠিক টোকেন দিন।" },
          { status: 400 }
        );
      }

      const actualUsername = testData.result?.username || cleanUsername;

      // 2. Persist in Database for Serverless / Multi-instance persistence
      try {
        await prisma.paymentMethodConfig.upsert({
          where: { code: "system_telegram_bot" },
          create: {
            code: "system_telegram_bot",
            name: "Telegram Bot System Config",
            type: "SYSTEM",
            accountNumber: cleanToken,
            instructions: actualUsername,
            isActive: true,
          },
          update: {
            accountNumber: cleanToken,
            instructions: actualUsername,
            isActive: true,
          },
        });
      } catch (dbErr) {
        console.warn("[Telegram Config DB Save Warning]", dbErr);
      }

      // 3. Update runtime process.env
      process.env.TELEGRAM_BOT_TOKEN = cleanToken;
      process.env.TELEGRAM_BOT_USERNAME = actualUsername;

      // 4. Try updating local .env file (if filesystem is writable)
      try {
        const envPath = path.join(process.cwd(), ".env");
        let envContent = "";
        try {
          envContent = await fs.readFile(envPath, "utf-8");
        } catch {
          envContent = "";
        }

        if (envContent.includes("TELEGRAM_BOT_TOKEN=")) {
          envContent = envContent.replace(
            /TELEGRAM_BOT_TOKEN=.*/,
            `TELEGRAM_BOT_TOKEN="${cleanToken}"`
          );
        } else {
          envContent += `\nTELEGRAM_BOT_TOKEN="${cleanToken}"`;
        }

        if (envContent.includes("TELEGRAM_BOT_USERNAME=")) {
          envContent = envContent.replace(
            /TELEGRAM_BOT_USERNAME=.*/,
            `TELEGRAM_BOT_USERNAME="${actualUsername}"`
          );
        } else {
          envContent += `\nTELEGRAM_BOT_USERNAME="${actualUsername}"`;
        }

        await fs.writeFile(envPath, envContent, "utf-8");
      } catch (fsErr) {
        // Safe to ignore on read-only serverless filesystem (Vercel/Netlify)
        console.log("[Telegram Config] Serverless read-only filesystem detected. Saved to DB & Memory.");
      }

      // 5. Automatically sync Telegram Webhook or Long Polling
      await autoSyncTelegramWebhook(req, cleanToken).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `বট সফলভাবে কনফিগার ও সিঙ্ক হয়েছে: @${actualUsername}`,
        botUsername: actualUsername,
      });
    } catch (apiErr: any) {
      return NextResponse.json(
        { error: "টেলিগ্রাম সার্ভারে সংযোগ করতে সমস্যা হয়েছে: " + (apiErr.message || "") },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("[Telegram Config Save Error]", err);
    return NextResponse.json({ error: "টোকেন সেভ করতে সমস্যা হয়েছে: " + (err.message || "") }, { status: 500 });
  }
}
