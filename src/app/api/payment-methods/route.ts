import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/payment-methods - Public active payment methods for checkout & gateway
export async function GET(req: NextRequest) {
  try {
    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        accountNumber: true,
        accountType: true,
        instructions: true,
        qrCodeUrl: true,
        chargePercent: true,
        displayOrder: true,
      },
    });

    return NextResponse.json({ success: true, paymentMethods });
  } catch (error: any) {
    console.error("[Public Payment Methods GET Error]", error);
    return NextResponse.json({ error: "Failed to load payment methods" }, { status: 500 });
  }
}
