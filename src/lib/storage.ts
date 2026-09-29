import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const STORAGE_LIMITS = {
  FREE: 5 * 1024 * 1024, // 5MB
  PRO: 50 * 1024 * 1024, // 50MB
  BUSINESS: 100 * 1024 * 1024, // 100MB
};

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const UPLOAD_BASE_DIR = isServerless
  ? path.join("/tmp", "uploads", "memories")
  : path.join(process.cwd(), "public", "uploads", "memories");

export async function ensureUploadDirectories() {
  const dirs = [
    path.join(UPLOAD_BASE_DIR, "images"),
    path.join(UPLOAD_BASE_DIR, "audio"),
    path.join(UPLOAD_BASE_DIR, "documents"),
    path.join(UPLOAD_BASE_DIR, "thumbnails"),
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // already exists or ignored
    }
  }
}

export function detectFileType(mimeType: string, fileName: string): "image" | "audio" | "pdf" | "document" | "text" {
  const lowerMime = (mimeType || "").toLowerCase();
  const ext = path.extname(fileName || "").toLowerCase();

  if (lowerMime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"].includes(ext)) {
    return "image";
  }
  if (lowerMime.startsWith("audio/") || [".mp3", ".ogg", ".oga", ".wav", ".m4a", ".aac", ".webm"].includes(ext)) {
    return "audio";
  }
  if (lowerMime === "application/pdf" || ext === ".pdf") {
    return "pdf";
  }
  if (
    lowerMime.includes("word") ||
    lowerMime.includes("officedocument") ||
    [".docx", ".doc", ".rtf", ".odt"].includes(ext)
  ) {
    return "document";
  }
  if (lowerMime.startsWith("text/") || [".txt", ".md", ".csv", ".json"].includes(ext)) {
    return "text";
  }
  return "document";
}

export function checkFileLimit(fileSizeBytes: number, userPlan: string = "FREE"): { allowed: boolean; maxAllowedBytes: number; message?: string } {
  const maxBytes = STORAGE_LIMITS[userPlan.toUpperCase() as keyof typeof STORAGE_LIMITS] || STORAGE_LIMITS.FREE;
  if (fileSizeBytes > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      allowed: false,
      maxAllowedBytes: maxBytes,
      message: `ফাইলের সাইজ আপনার ${userPlan} প্ল্যানের লিমিট (${maxMb}MB) অতিক্রম করেছে।`,
    };
  }
  return { allowed: true, maxAllowedBytes: maxBytes };
}

export async function saveUploadedFile({
  buffer,
  fileName,
  mimeType,
  userId,
}: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
}): Promise<{ storagePath: string; publicUrl: string; fileType: "image" | "audio" | "pdf" | "document" | "text"; size: number }> {
  const fileType = detectFileType(mimeType, fileName);
  const subFolder = fileType === "image" ? "images" : fileType === "audio" ? "audio" : "documents";
  
  const ext = path.extname(fileName) || (fileType === "image" ? ".jpg" : fileType === "audio" ? ".ogg" : ".bin");
  const randomHex = crypto.randomBytes(8).toString("hex");
  const safeBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const uniqueName = `${userId.slice(0, 8)}_${Date.now()}_${randomHex}_${safeBaseName}${ext}`;

  try {
    await ensureUploadDirectories();
    const destPath = path.join(UPLOAD_BASE_DIR, subFolder, uniqueName);
    await fs.writeFile(destPath, buffer);

    const publicUrl = `/uploads/memories/${subFolder}/${uniqueName}`;

    return {
      storagePath: destPath,
      publicUrl,
      fileType,
      size: buffer.length,
    };
  } catch (err) {
    // If disk write fails on serverless, fallback to data URI for image / audio previews
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;
    return {
      storagePath: `memory://${uniqueName}`,
      publicUrl: dataUri,
      fileType,
      size: buffer.length,
    };
  }
}
