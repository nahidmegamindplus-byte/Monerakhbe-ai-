import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let whereClause: any = { userId: session.id };
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("[Tasks GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, priority = "NORMAL", dueDate, dueTime, category = "Work", tags } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        userId: session.id,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime,
        category,
        tags: tags ? (Array.isArray(tags) ? tags.join(",") : tags) : null,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("[Tasks POST Error]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
