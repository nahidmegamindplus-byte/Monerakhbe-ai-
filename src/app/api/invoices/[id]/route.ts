import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }, { orderId: invoiceId }],
      },
      include: {
        order: {
          include: {
            plan: true,
            user: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("[Invoice GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
