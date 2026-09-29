import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/telegram - List all telegram connections
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const connections = await prisma.telegramConnection.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    return NextResponse.json({ success: true, connections });
  } catch (error: any) {
    console.error("[Admin Telegram GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch telegram connections" }, { status: 500 });
  }
}

// PATCH /api/admin/telegram - Update/Reset telegram connection
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, chatId, username } = body;

    if (!id) {
      return NextResponse.json({ error: "Telegram Connection ID required" }, { status: 400 });
    }

    if (action === "DISCONNECT") {
      const updated = await prisma.telegramConnection.update({
        where: { id },
        data: {
          isConnected: false,
          chatId: null,
          telegramUserId: null,
          username: null,
          firstName: null,
          connectedAt: null,
          connectionToken: Math.random().toString(36).substring(2, 10).toUpperCase(),
        },
      });

      await logAudit({
        userId: session.id,
        action: "ADMIN_TELEGRAM_DISCONNECTED",
        entityType: "TELEGRAM",
        entityId: id,
      });

      return NextResponse.json({ success: true, connection: updated });
    }

    if (action === "REGENERATE_TOKEN") {
      const newToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      const updated = await prisma.telegramConnection.update({
        where: { id },
        data: { connectionToken: newToken },
      });

      return NextResponse.json({ success: true, connection: updated });
    }

    if (action === "EDIT_MANUAL") {
      const updated = await prisma.telegramConnection.update({
        where: { id },
        data: {
          chatId: chatId || null,
          username: username ? username.replace("@", "").trim() : null,
          isConnected: Boolean(chatId),
        },
      });

      return NextResponse.json({ success: true, connection: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Telegram PATCH Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update telegram connection" }, { status: 500 });
  }
}
