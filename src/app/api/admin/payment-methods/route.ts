import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/payment-methods - List all payment methods for admin
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ success: true, paymentMethods });
  } catch (error: any) {
    console.error("[Admin Payment Methods GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payment methods" }, { status: 500 });
  }
}

// POST /api/admin/payment-methods - Create a new payment method
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      name,
      type = "WALLET",
      accountNumber,
      accountType = "Personal",
      instructions,
      qrCodeUrl,
      chargePercent = 0,
      isActive = true,
      displayOrder = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "মেথডের নাম আবশ্যক (যেমনঃ বিকাশ, নগদ, রকেট, ব্যাংক)" }, { status: 400 });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return NextResponse.json({ error: "একাউন্ট / ওয়ালেট নাম্বার আবশ্যক" }, { status: 400 });
    }

    // Generate code from name/code
    const cleanCode = (code || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 30);

    const existing = await prisma.paymentMethodConfig.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: `এই কোড '${cleanCode}' সম্বলিত মেথড ইতিমধ্যে রয়েছে।` }, { status: 400 });
    }

    const created = await prisma.paymentMethodConfig.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        type: type || "WALLET",
        accountNumber: accountNumber.trim(),
        accountType: accountType || "Personal",
        instructions: instructions?.trim() || "",
        qrCodeUrl: qrCodeUrl?.trim() || null,
        chargePercent: parseFloat(chargePercent || 0),
        isActive: Boolean(isActive),
        displayOrder: parseInt(displayOrder || 0, 10),
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PAYMENT_METHOD_CREATED",
      entityType: "PAYMENT_METHOD",
      entityId: created.id,
      details: created,
    });

    return NextResponse.json({ success: true, paymentMethod: created });
  } catch (error: any) {
    console.error("[Admin Payment Methods POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create payment method" }, { status: 500 });
  }
}

// PUT /api/admin/payment-methods - Update payment method details
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
      type,
      accountNumber,
      accountType,
      instructions,
      qrCodeUrl,
      chargePercent,
      isActive,
      displayOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber.trim();
    if (accountType !== undefined) updateData.accountType = accountType;
    if (instructions !== undefined) updateData.instructions = instructions.trim();
    if (qrCodeUrl !== undefined) updateData.qrCodeUrl = qrCodeUrl?.trim() || null;
    if (chargePercent !== undefined) updateData.chargePercent = parseFloat(chargePercent);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder, 10);

    const updated = await prisma.paymentMethodConfig.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PAYMENT_METHOD_UPDATED",
      entityType: "PAYMENT_METHOD",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, paymentMethod: updated });
  } catch (error: any) {
    console.error("[Admin Payment Methods PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update payment method" }, { status: 500 });
  }
}

// DELETE /api/admin/payment-methods - Delete payment method
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    await prisma.paymentMethodConfig.delete({
      where: { id },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_PAYMENT_METHOD_DELETED",
      entityType: "PAYMENT_METHOD",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "পেমেন্ট মেথড সফলভাবে মুছে ফেলা হয়েছে!" });
  } catch (error: any) {
    console.error("[Admin Payment Methods DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment method" }, { status: 500 });
  }
}
