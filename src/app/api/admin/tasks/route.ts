import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== "ALL") where.userId = userId;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { category: { contains: query } },
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Tasks GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/admin/tasks - Create task for any user
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, title, description, status = "TODO", priority = "NORMAL", dueDate, dueTime, category = "Work" } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: "User ID and title are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Selected user not found" }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
        category,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      details: { title: task.title, targetUser: user.email },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Tasks POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}

// PUT /api/admin/tasks - Edit task
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, status, priority, dueDate, dueTime, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (dueTime !== undefined) updateData.dueTime = dueTime || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED") updateData.completedAt = new Date();
      else updateData.completedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_TASK_UPDATED",
      entityType: "TASK",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("[Admin Tasks PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/admin/tasks - Delete task
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await prisma.task.delete({ where: { id } });

    await logAudit({
      userId: session.id,
      action: "ADMIN_TASK_DELETED",
      entityType: "TASK",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("[Admin Tasks DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
