import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/admin/subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    return NextResponse.json({ success: true, subscriptions });
  } catch (error: any) {
    console.error("[Admin Subscriptions GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch subscriptions" }, { status: 500 });
  }
}

// POST /api/admin/subscriptions - Create / Grant subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, planId = "PRO", billingCycle = "MONTHLY", durationMonths = 1, paymentMethod = "manual_admin" } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + parseInt(durationMonths, 10));

    const [subscription] = await prisma.$transaction([
      prisma.subscription.create({
        data: {
          userId,
          planId,
          status: "ACTIVE",
          billingCycle,
          validUntil,
          paymentMethod,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { plan: planId },
      }),
    ]);

    await logAudit({
      userId: session.id,
      action: "ADMIN_SUBSCRIPTION_GRANTED",
      entityType: "SUBSCRIPTION",
      entityId: subscription.id,
      details: { planId, durationMonths, targetUser: subscription.user.email },
    });

    return NextResponse.json({ success: true, subscription }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Subscriptions POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create subscription" }, { status: 500 });
  }
}

// PUT /api/admin/subscriptions - Edit subscription
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, planId, status, billingCycle, validUntil, paymentMethod } = body;

    if (!id) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (planId !== undefined) updateData.planId = planId;
    if (status !== undefined) updateData.status = status;
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (planId) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: { plan: planId },
      });
    }

    await logAudit({
      userId: session.id,
      action: "ADMIN_SUBSCRIPTION_UPDATED",
      entityType: "SUBSCRIPTION",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    console.error("[Admin Subscriptions PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update subscription" }, { status: 500 });
  }
}

// DELETE /api/admin/subscriptions - Delete subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (sub) {
      await prisma.subscription.delete({ where: { id } });
      await prisma.user.update({
        where: { id: sub.userId },
        data: { plan: "FREE" },
      });
    }

    return NextResponse.json({ success: true, message: "Subscription revoked and user reset to FREE" });
  } catch (error: any) {
    console.error("[Admin Subscriptions DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete subscription" }, { status: 500 });
  }
}
