import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("[Plans GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
