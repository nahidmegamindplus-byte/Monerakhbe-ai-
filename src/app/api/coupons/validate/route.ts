import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, planId, billingCycle = "MONTHLY" } = await req.json();

    if (!code || !planId) {
      return NextResponse.json({ error: "Coupon code and plan ID required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const basePrice = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "অবৈধ বা মেয়াদোত্তীর্ণ কুপন কোড" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "এই কুপনটির মেয়াদ শেষ হয়ে গেছে" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "কুপনটির ব্যবহারের সর্বোচ্চ সীমা শেষ হয়েছে" }, { status: 400 });
    }

    if (basePrice < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `এই কুপন ব্যবহারের জন্য নূন্যতম ৳${coupon.minOrderAmount} টাকার প্যাকেজ নির্বাচন করতে হবে`,
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (basePrice * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    if (discountAmount > basePrice) discountAmount = basePrice;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        basePrice,
        finalPrice,
      },
    });
  } catch (error: any) {
    console.error("[Coupon Validate Error]", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
