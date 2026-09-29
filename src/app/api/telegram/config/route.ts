import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "";

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
    const testRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const testData = await testRes.json();

    if (!testData.ok) {
      return NextResponse.json(
        { error: "টেলিগ্রাম টোকেনটি সঠিক নয়! অনুগ্রহ করে BotFather থেকে প্রাপ্ত সঠিক টোকেন দিন।" },
        { status: 400 }
      );
    }

    const actualUsername = testData.result?.username || cleanUsername;

    // 2. Update .env file on disk
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch {
      envContent = "";
    }

    // Replace or append TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME
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

    // Update runtime process.env
    process.env.TELEGRAM_BOT_TOKEN = cleanToken;
    process.env.TELEGRAM_BOT_USERNAME = actualUsername;

    return NextResponse.json({
      success: true,
      message: `বট সফলভাবে কনফিগার হয়েছে: @${actualUsername}`,
      botUsername: actualUsername,
    });
  } catch (err: any) {
    console.error("[Telegram Config Save Error]", err);
    return NextResponse.json({ error: "টোকেন সেভ করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
