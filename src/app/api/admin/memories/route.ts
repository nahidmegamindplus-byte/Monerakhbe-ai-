import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/admin/memories
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const category = searchParams.get("category") || "";
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== "ALL") {
      where.userId = userId;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (query) {
      where.OR = [
        { key: { contains: query } },
        { value: { contains: query } },
        { tags: { contains: query } },
        { summary: { contains: query } },
      ];
    }

    const [total, memories] = await Promise.all([
      prisma.memory.count({ where }),
      prisma.memory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          attachments: true,
          _count: {
            select: { timeline: true, embeddings: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      memories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Memories GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch memories" }, { status: 500 });
  }
}

// POST /api/admin/memories - Add memory for any user
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, category = "Personal", key, value, tags, source = "admin_panel" } = body;

    if (!userId || !key || !value) {
      return NextResponse.json({ error: "User ID, key/title, and memory content are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Selected user not found" }, { status: 404 });
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        category,
        key: key.trim(),
        value: value.trim(),
        tags: tags ? (Array.isArray(tags) ? JSON.stringify(tags) : String(tags)) : null,
        source,
        confidence: 1.0,
        timeline: {
          create: {
            userId,
            action: "CREATED",
            source: "admin_panel",
            description: `Admin (${session.name}) added memory`,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_MEMORY_CREATED",
      entityType: "MEMORY",
      entityId: memory.id,
      details: { key: memory.key, targetUser: user.email },
    });

    return NextResponse.json({ success: true, memory }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Memories POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create memory" }, { status: 500 });
  }
}

// PUT /api/admin/memories - Edit memory
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, category, key, value, tags, summary } = body;

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (key !== undefined) updateData.key = key.trim();
    if (value !== undefined) updateData.value = value.trim();
    if (summary !== undefined) updateData.summary = summary ? summary.trim() : null;
    if (tags !== undefined) updateData.tags = tags ? (Array.isArray(tags) ? JSON.stringify(tags) : String(tags)) : null;

    const updatedMemory = await prisma.memory.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_MEMORY_UPDATED",
      entityType: "MEMORY",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, memory: updatedMemory });
  } catch (error: any) {
    console.error("[Admin Memories PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update memory" }, { status: 500 });
  }
}

// DELETE /api/admin/memories - Delete memory
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.memoryAttachment.deleteMany({ where: { memoryId: id } }),
      prisma.memoryEmbedding.deleteMany({ where: { memoryId: id } }),
      prisma.memoryTimeline.deleteMany({ where: { memoryId: id } }),
      prisma.memory.delete({ where: { id } }),
    ]);

    await logAudit({
      userId: session.id,
      action: "ADMIN_MEMORY_DELETED",
      entityType: "MEMORY",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Memory deleted successfully" });
  } catch (error: any) {
    console.error("[Admin Memories DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete memory" }, { status: 500 });
  }
}
