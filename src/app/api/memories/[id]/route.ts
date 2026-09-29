import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memory = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
      include: {
        attachments: true,
        reminder: true,
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    console.error("[Memory Detail GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch memory detail" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category, key, value, tags, summary } = await req.json();

    const existing = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const updated = await prisma.memory.update({
      where: { id: params.id },
      data: {
        category: category || existing.category,
        key: key !== undefined ? key.trim() : existing.key,
        value: value !== undefined ? value.trim() : existing.value,
        summary: summary !== undefined ? summary : existing.summary,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(",") : tags) : existing.tags,
      },
      include: {
        attachments: true,
        reminder: true,
        timeline: { orderBy: { createdAt: "desc" } },
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: updated.id,
        userId: session.id,
        action: "EDITED",
        source: "web_dashboard",
        description: `মেমোরি সম্পাদনা করা হয়েছে।`,
      },
    });

    await logAudit({
      userId: session.id,
      action: "MEMORY_EDITED",
      entityType: "MEMORY",
      entityId: updated.id,
      details: { key: updated.key, category: updated.category },
    });

    return NextResponse.json({ success: true, memory: updated });
  } catch (error) {
    console.error("[Memory PUT Error]", error);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memory = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    await prisma.memory.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: session.id,
      action: "MEMORY_DELETED",
      entityType: "MEMORY",
      entityId: params.id,
      details: { key: memory.key },
    });

    return NextResponse.json({ success: true, message: "Memory deleted successfully" });
  } catch (error) {
    console.error("[Memory DELETE Error]", error);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
