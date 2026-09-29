import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processMemoryInput } from "@/services/ai/multimodal";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // A. Handle Multipart / FormData (File Uploads, Images, Audio, Documents)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = (formData.get("text") as string) || "";
      const caption = (formData.get("caption") as string) || "";
      const inputType = (formData.get("inputType") as any) || "document";
      const autoCreateReminder = formData.get("autoCreateReminder") === "true";

      let fileBuffer: Buffer | undefined;
      let fileName = "upload.bin";
      let mimeType = "application/octet-stream";

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileName = file.name || "upload.bin";
        mimeType = file.type || "application/octet-stream";
      }

      const result = await processMemoryInput({
        userId: session.id,
        inputType,
        fileBuffer,
        fileName,
        mimeType,
        text,
        caption,
        channel: "WEB",
        autoCreateReminder,
      });

      return NextResponse.json(result);
    }

    // B. Handle JSON Payload (Direct text or base64 input)
    const body = await req.json();
    const { text, caption, inputType = "text", autoCreateReminder = false } = body;

    const result = await processMemoryInput({
      userId: session.id,
      inputType,
      text,
      caption,
      channel: "WEB",
      autoCreateReminder,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Multimodal Memory API Error]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process multimodal input" },
      { status: 500 }
    );
  }
}
