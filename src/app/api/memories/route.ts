import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let whereClause: any = { userId: session.id };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { key: { contains: q } },
        { value: { contains: q } },
        { summary: { contains: q } },
        { extractedText: { contains: q } },
        { tags: { contains: q } },
        { structuredData: { contains: q } },
      ];
    }

    const memories = await prisma.memory.findMany({
      where: whereClause,
      include: {
        attachments: true,
        reminder: true,
        timeline: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, memories });
  } catch (error) {
    console.error("[Memories GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category = "Personal", key, value, tags, source = "manual_text" } = await req.json();

    if (!key || !value) {
      return NextResponse.json({ error: "Key and Value are required" }, { status: 400 });
    }

    const memory = await prisma.memory.create({
      data: {
        userId: session.id,
        category,
        key: key.trim(),
        value: value.trim(),
        tags: tags ? (Array.isArray(tags) ? tags.join(",") : tags) : null,
        source,
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: memory.id,
        userId: session.id,
        action: "CREATED",
        source,
        description: `মেমোরি ম্যানুয়ালি যোগ করা হয়েছে।`,
      },
    });

    await logAudit({
      userId: session.id,
      action: "MEMORY_CREATED",
      entityType: "MEMORY",
      entityId: memory.id,
      details: { category, key, value },
    });

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    console.error("[Memories POST Error]", error);
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  }
}

