import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, orders, transactions] = await Promise.all([
      prisma.subscription.findFirst({
        where: { userId: session.id, status: "ACTIVE" },
        include: { plan: true },
        orderBy: { expiresAt: "desc" },
      }),
      prisma.order.findMany({
        where: { userId: session.id },
        include: { plan: true, invoice: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentTransaction.findMany({
        where: { userId: session.id },
        include: { order: { include: { plan: true, invoice: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      subscription,
      orders,
      transactions,
    });
  } catch (error: any) {
    console.error("[Billing History GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch billing history" }, { status: 500 });
  }
}
