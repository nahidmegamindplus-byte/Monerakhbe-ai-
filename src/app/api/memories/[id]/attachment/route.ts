import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { saveUploadedFile, checkFileLimit } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memory = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { plan: true },
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const limitCheck = checkFileLimit(buffer.length, user?.plan || "FREE");
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 400 });
    }

    const saved = await saveUploadedFile({
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      userId: session.id,
    });

    const attachment = await prisma.memoryAttachment.create({
      data: {
        memoryId: memory.id,
        userId: session.id,
        type: saved.fileType,
        fileName: file.name,
        mimeType: file.type,
        fileSize: saved.size,
        storagePath: saved.publicUrl,
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: memory.id,
        userId: session.id,
        action: "ATTACHMENT_ADDED",
        source: "web_upload",
        description: `নতুন ফাইল সংযুক্ত করা হয়েছে: ${file.name}`,
      },
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error: any) {
    console.error("[Add Attachment Error]", error);
    return NextResponse.json({ error: "Failed to add attachment" }, { status: 500 });
  }
}
