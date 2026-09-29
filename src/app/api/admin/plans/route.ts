import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/plans
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
      include: {
        _count: { select: { orders: true, subscriptions: true } },
      },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("[Admin Plans GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch plans" }, { status: 500 });
  }
}

// POST /api/admin/plans - Create a new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      reminderLimit,
      memoryLimit,
      taskLimit,
      aiLimit,
      fileSizeLimit,
      telegramEnabled = true,
      advancedFeatures = false,
      isActive = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "প্যাকেজের নাম আবশ্যক" }, { status: 400 });
    }

    // Generate clean ID from name if not provided
    const planId = (id || name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "_")
      .slice(0, 30);

    // Check if ID exists
    const existing = await prisma.plan.findUnique({ where: { id: planId } });
    if (existing) {
      return NextResponse.json({ error: `এই প্ল্যান আইডি '${planId}' ইতিমধ্যে বিদ্যমান রয়েছে। অন্য একটি নাম বা আইডি দিন।` }, { status: 400 });
    }

    const createdPlan = await prisma.plan.create({
      data: {
        id: planId,
        name: name.trim(),
        description: description?.trim() || "",
        monthlyPrice: parseFloat(monthlyPrice || 0),
        yearlyPrice: parseFloat(yearlyPrice || (parseFloat(monthlyPrice || 0) * 10)),
        currency: "BDT",
        reminderLimit: parseInt(reminderLimit || 100, 10),
        memoryLimit: parseInt(memoryLimit || 100, 10),
        taskLimit: parseInt(taskLimit || 100, 10),
        aiLimit: parseInt(aiLimit || 100, 10),
        fileSizeLimit: parseInt(fileSizeLimit || 10, 10),
        telegramEnabled: Boolean(telegramEnabled),
        advancedFeatures: Boolean(advancedFeatures),
        isActive: Boolean(isActive),
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PLAN_CREATED",
      entityType: "PLAN",
      entityId: createdPlan.id,
      details: createdPlan,
    });

    return NextResponse.json({ success: true, plan: createdPlan });
  } catch (error: any) {
    console.error("[Admin Plans POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create plan" }, { status: 500 });
  }
}

// PUT /api/admin/plans - Update plan prices and limits
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      reminderLimit,
      memoryLimit,
      taskLimit,
      aiLimit,
      fileSizeLimit,
      telegramEnabled,
      advancedFeatures,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (monthlyPrice !== undefined) updateData.monthlyPrice = parseFloat(monthlyPrice);
    if (yearlyPrice !== undefined) updateData.yearlyPrice = parseFloat(yearlyPrice);
    if (reminderLimit !== undefined) updateData.reminderLimit = parseInt(reminderLimit, 10);
    if (memoryLimit !== undefined) updateData.memoryLimit = parseInt(memoryLimit, 10);
    if (taskLimit !== undefined) updateData.taskLimit = parseInt(taskLimit, 10);
    if (aiLimit !== undefined) updateData.aiLimit = parseInt(aiLimit, 10);
    if (fileSizeLimit !== undefined) updateData.fileSizeLimit = parseInt(fileSizeLimit, 10);
    if (telegramEnabled !== undefined) updateData.telegramEnabled = Boolean(telegramEnabled);
    if (advancedFeatures !== undefined) updateData.advancedFeatures = Boolean(advancedFeatures);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PLAN_UPDATED",
      entityType: "PLAN",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error("[Admin Plans PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status: 500 });
  }
}

// DELETE /api/admin/plans - Remove a plan
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    if (planId === "FREE") {
      return NextResponse.json({ error: "বেসিক 'FREE' প্ল্যান মুছে ফেলা যাবে না, কারণ এটি সিস্টেমের ডিফল্ট প্ল্যান।" }, { status: 400 });
    }

    // Check if there are orders or subscriptions attached
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: { select: { orders: true, subscriptions: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan._count.subscriptions > 0 || plan._count.orders > 0) {
      // Soft disable if historical records exist to preserve data integrity
      await prisma.plan.update({
        where: { id: planId },
        data: { isActive: false },
      });

      await logAudit({
        userId: session.id,
        action: "ADMIN_PLAN_DEACTIVATED",
        entityType: "PLAN",
        entityId: planId,
        details: { reason: "Has existing subscriptions/orders, marked inactive" },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `প্ল্যানটিতে পূর্বের ${plan._count.orders}টি অর্ডার বা গ্রাহক থাকায় ডাটা সুরক্ষার জন্য এটি মুছে ফেলার পরিবর্তে 'নিষ্ক্রিয় (Inactive)' করা হয়েছে। নতুন কোনো গ্রাহক এটি দেখতে পাবে না।`,
      });
    }

    // Hard delete if clean
    await prisma.plan.delete({
      where: { id: planId },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PLAN_DELETED",
      entityType: "PLAN",
      entityId: planId,
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `প্যাকেজ '${plan.name}' সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error("[Admin Plans DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete plan" }, { status: 500 });
  }
}
