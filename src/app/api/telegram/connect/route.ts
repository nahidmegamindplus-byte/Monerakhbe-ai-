import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const connection = await prisma.telegramConnection.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        connectionToken: token,
        tokenExpiresAt: expiresAt,
      },
      update: {
        connectionToken: token,
        tokenExpiresAt: expiresAt,
      },
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "MoneRakhbeBot";
    const deepLink = `https://t.me/${botUsername}?start=connect_${token}`;

    return NextResponse.json({
      success: true,
      isConnected: connection.isConnected,
      telegramUsername: connection.username,
      firstName: connection.firstName,
      connectedAt: connection.connectedAt,
      token,
      deepLink,
    });
  } catch (error) {
    console.error("[Telegram Connect Error]", error);
    return NextResponse.json({ error: "Failed to generate Telegram connection" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.telegramConnection.update({
      where: { userId: session.id },
      data: {
        isConnected: false,
        telegramUserId: null,
        chatId: null,
        username: null,
        firstName: null,
        connectedAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Telegram disconnected successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to disconnect Telegram" }, { status: 500 });
  }
}
