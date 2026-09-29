import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureDefaultSystemData } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

const FALLBACK_PAYMENT_METHODS = [
  {
    id: "bkash-default",
    code: "bkash",
    name: "বিকাশ (bKash Personal / Send Money)",
    type: "WALLET",
    accountNumber: "01886123456",
    accountType: "Personal",
    instructions: "বিকাশ অ্যাপ বা *247# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।",
    qrCodeUrl: null,
    chargePercent: 0,
    displayOrder: 1,
  },
  {
    id: "nagad-default",
    code: "nagad",
    name: "নগদ (Nagad Send Money)",
    type: "WALLET",
    accountNumber: "01886123456",
    accountType: "Personal",
    instructions: "নগদ অ্যাপ বা *167# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।",
    qrCodeUrl: null,
    chargePercent: 0,
    displayOrder: 2,
  },
  {
    id: "rocket-default",
    code: "rocket",
    name: "রকেট (Rocket Send Money)",
    type: "WALLET",
    accountNumber: "018861234568",
    accountType: "Personal",
    instructions: "রকেট অ্যাপ বা *322# ডায়াল করে 'Send Money' করুন এবং ট্রানজেকশন আইডি প্রদান করুন।",
    qrCodeUrl: null,
    chargePercent: 0,
    displayOrder: 3,
  },
];

// GET /api/payment-methods - Public active payment methods for checkout & gateway
export async function GET(req: NextRequest) {
  try {
    let paymentMethods = await prisma.paymentMethodConfig.findMany({
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

    if (!paymentMethods || paymentMethods.length === 0) {
      await ensureDefaultSystemData();
      paymentMethods = await prisma.paymentMethodConfig.findMany({
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
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      paymentMethods = FALLBACK_PAYMENT_METHODS as any;
    }

    return NextResponse.json({ success: true, paymentMethods });
  } catch (error: any) {
    console.error("[Public Payment Methods GET Error]", error);
    return NextResponse.json({ success: true, paymentMethods: FALLBACK_PAYMENT_METHODS });
  }
}
