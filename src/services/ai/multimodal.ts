import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { saveUploadedFile, checkFileLimit, detectFileType } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { recordAiUsage, checkUserAiLimit } from "@/lib/usage";
import { formatFriendlyDate } from "@/lib/date-utils";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface MultimodalInputOptions {
  userId: string;
  inputType?: "text" | "voice" | "image" | "document" | "pdf";
  fileBuffer?: Buffer;
  mimeType?: string;
  fileName?: string;
  text?: string;
  caption?: string;
  channel?: "TELEGRAM" | "WEB" | "API";
  userTimezone?: string;
  autoCreateReminder?: boolean; // if true or user explicitly confirmed
}

export interface MultimodalMemoryResult {
  success: boolean;
  message: string;
  memory?: any;
  reminder?: any;
  transcript?: string;
  ocrText?: string;
  summary?: string;
  confidence: number;
  candidateReminder?: {
    title: string;
    date?: string;
    time?: string;
    description?: string;
  } | null;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
}

const MULTIMODAL_MEMORY_PROMPT = `
You are MoneRakhbe AI's central Multimodal Memory & Intelligence engine.
Your task is to analyze user input (which can be raw text, voice audio transcription, an uploaded image/screenshot/receipt/business card, or a document/PDF) and extract high-value structured memory.

CRITICAL RULES:
1. Distinguish between:
   - MEMORY: Storing permanent facts, notes, documents, birthdays, addresses, rent details, info.
   - REMINDER: A time-based alert or notification at a specific date/time.
   - TASK: An action item to do.
2. Voice & Natural Language Intent Rule:
   - If user says "মনে রেখো" / "save this" / "remember this" but does NOT explicitly ask for a reminder (e.g. "মনে করিয়ে দিও"), save strictly as MEMORY (do NOT create reminder).
   - If user explicitly says "মনে করিয়ে দিও" / "remind me", indicate reminderRequested = true.
3. Image & Document Extraction:
   - For images (appointments, bills, receipts, cards, prescriptions, screenshots), extract:
     - title: concise title (e.g. "Doctor Appointment", "House Rent Agreement", "Electricity Bill")
     - category: one of [Personal, Family, Work, Finance, Health, Travel, Education, Business, Important Dates, Contacts, Documents, Other]
     - summary: 1-2 sentence overview
     - key_facts: bullet points of extracted facts
     - structured_data: JSON object containing all identified dates, times, amounts, names, phone numbers, addresses, policy numbers, landlord name, rent amount, etc.
     - candidate_event: if the document/image contains a specific upcoming appointment or due date, include { title, date: "YYYY-MM-DD", time: "HH:mm", description }.
4. Multilingual support:
   - Support Bangla (বাংলা), Banglish (amr ma er birthday 15 january), English, and Mixed language.
   - Return a polite, natural confirmation response in Bengali (e.g., "ঠিক আছে, মনে রাখলাম। আপনার মায়ের জন্মদিন ১৫ জানুয়ারি।").

OUTPUT FORMAT (Must be valid JSON only):
{
  "title": "Office Address",
  "category": "Work",
  "content": "House 11, Banasree",
  "summary": "Brief summary",
  "extracted_text": "Full extracted text or voice transcript",
  "tags": ["work", "address", "office"],
  "confidence": 0.95,
  "language": "bn",
  "reminder_requested": false,
  "candidate_event": {
    "title": "Doctor Appointment",
    "date": "2026-10-20",
    "time": "17:00",
    "description": "With Dr. Rahman"
  },
  "friendly_reply_bn": "ঠিক আছে, মনে রাখলাম। আপনার অফিসের ঠিকানা House 11, Banasree।"
}
`;

export async function processMemoryInput(options: MultimodalInputOptions): Promise<MultimodalMemoryResult> {
  const {
    userId,
    fileBuffer,
    mimeType = "text/plain",
    fileName = "note.txt",
    text = "",
    caption = "",
    channel = "WEB",
    userTimezone = "Asia/Dhaka",
    autoCreateReminder = false,
  } = options;

  // 1. Check AI Limit
  const limitCheck = await checkUserAiLimit(userId);
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: limitCheck.reason || "AI limit exceeded",
      confidence: 0,
    };
  }

  // 2. Fetch User Plan for Storage Limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, language: true },
  });
  const userPlan = user?.plan || "FREE";

  // 3. Process File Attachment if provided
  let savedFile: { storagePath: string; publicUrl: string; fileType: "image" | "audio" | "pdf" | "document" | "text"; size: number } | null = null;
  let fileType = options.inputType || detectFileType(mimeType, fileName);

  if (fileBuffer && fileBuffer.length > 0) {
    const sizeCheck = checkFileLimit(fileBuffer.length, userPlan);
    if (!sizeCheck.allowed) {
      return {
        success: false,
        message: sizeCheck.message || "File limit exceeded",
        confidence: 0,
      };
    }

    savedFile = await saveUploadedFile({
      buffer: fileBuffer,
      fileName,
      mimeType,
      userId,
    });
    fileType = savedFile.fileType;
  }

  // 4. Multimodal AI Extraction with Gemini / Fallback
  let aiResult: any = null;
  let tokensUsed = 150;

  if (genAI && apiKey.trim()) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const parts: any[] = [];
      parts.push({ text: MULTIMODAL_MEMORY_PROMPT });

      const contextPrompt = `
Current Reference Date & Time: ${new Date().toISOString()}
Timezone: ${userTimezone}
Input Type: ${fileType}
User Caption/Text: "${caption || text}"
File Name: "${fileName}"
`;
      parts.push({ text: contextPrompt });

      // Add inline file data for Audio / Image / PDF if provided
      if (fileBuffer && fileBuffer.length > 0) {
        let validMime = mimeType;
        if (fileType === "audio" && (!validMime || validMime === "application/octet-stream")) {
          validMime = fileName.endsWith(".mp3") ? "audio/mp3" : "audio/ogg";
        }
        if (fileType === "image" && (!validMime || validMime === "application/octet-stream")) {
          validMime = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        }
        if (fileType === "pdf") {
          validMime = "application/pdf";
        }

        parts.push({
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: validMime,
          },
        });
      }

      const response = await model.generateContent(parts);
      const resText = response.response.text();
      aiResult = JSON.parse(resText);
      tokensUsed = response.response.usageMetadata?.totalTokenCount || 300;
      await recordAiUsage(userId, tokensUsed);
    } catch (err) {
      console.error("[Multimodal AI Analysis Error, falling back]", err);
    }
  }

  // Fallback heuristic if AI unavailable or parsing failed
  if (!aiResult) {
    const rawContent = text || caption || fileName;
    aiResult = {
      title: fileName ? fileName.replace(/\.[^/.]+$/, "") : "Saved Memory",
      category: "Personal",
      content: rawContent,
      summary: rawContent.slice(0, 150),
      extracted_text: rawContent,
      tags: ["memory", fileType],
      confidence: 0.85,
      language: "bn",
      reminder_requested: /মনে করিয়ে দিও|remind me|notify me/i.test(rawContent),
      candidate_event: null,
      friendly_reply_bn: `ঠিক আছে, তথ্যটি মেমোরিতে সংরক্ষণ করা হয়েছে: "${rawContent.slice(0, 50)}..."`,
    };
  }

  const memoryTitle = aiResult.title || fileName || "Memory";
  const memoryCategory = aiResult.category || "Personal";
  const memoryContent = aiResult.content || aiResult.summary || text || caption || "Saved note";
  const tagsStr = Array.isArray(aiResult.tags) ? aiResult.tags.join(",") : (aiResult.tags || "");
  const confidence = typeof aiResult.confidence === "number" ? aiResult.confidence : 0.9;
  const extractedText = aiResult.extracted_text || text || caption || "";
  const summary = aiResult.summary || memoryContent.slice(0, 200);
  const structuredDataStr = JSON.stringify(aiResult.structured_data || aiResult.candidate_event || {});

  // Determine Source Tag
  let sourceTag = "manual_text";
  if (channel === "TELEGRAM") {
    if (fileType === "voice" || fileType === "audio") sourceTag = "telegram_voice";
    else if (fileType === "image") sourceTag = "telegram_image";
    else if (fileType === "pdf" || fileType === "document") sourceTag = "telegram_document";
    else sourceTag = "telegram_text";
  } else {
    if (fileType === "voice" || fileType === "audio") sourceTag = "web_voice";
    else if (fileType === "image") sourceTag = "web_image";
    else if (fileType === "pdf" || fileType === "document") sourceTag = "web_document";
    else if (channel === "WEB") sourceTag = "web_chat";
  }

  // 5. Save Structured Memory in Database
  const memory = await prisma.memory.create({
    data: {
      userId,
      category: memoryCategory,
      key: memoryTitle,
      value: memoryContent,
      tags: tagsStr,
      source: sourceTag,
      confidence,
      summary,
      extractedText,
      structuredData: structuredDataStr,
    },
  });

  // 6. Save Attachment Record if file uploaded
  if (savedFile) {
    await prisma.memoryAttachment.create({
      data: {
        memoryId: memory.id,
        userId,
        type: savedFile.fileType,
        fileName,
        mimeType,
        fileSize: savedFile.size,
        storagePath: savedFile.publicUrl, // accessible path
        extractedText,
      },
    });
  }

  // 7. Save Initial Timeline Entry (#108)
  const sourceLabelMap: Record<string, string> = {
    telegram_voice: "Telegram Voice Message",
    telegram_image: "Telegram Image / Screenshot",
    telegram_document: "Telegram Document / PDF",
    telegram_text: "Telegram Message",
    web_voice: "Web Voice Recording",
    web_image: "Web Image Upload",
    web_document: "Web Document / PDF Upload",
    web_chat: "Web Chat",
    manual_text: "Manual Entry",
  };

  await prisma.memoryTimeline.create({
    data: {
      memoryId: memory.id,
      userId,
      action: "CREATED",
      source: sourceTag,
      description: `মেমোরি সংরক্ষণ করা হয়েছে (${sourceLabelMap[sourceTag] || sourceTag})`,
    },
  });

  // 8. Index Search Chunks & Embeddings (#89, #94)
  const chunksToSave = [
    memoryTitle,
    memoryContent,
    summary,
    extractedText,
  ].filter(Boolean);

  for (let i = 0; i < chunksToSave.length; i++) {
    const chunkText = chunksToSave[i].slice(0, 1000);
    await prisma.memoryEmbedding.create({
      data: {
        userId,
        memoryId: memory.id,
        chunkId: `chunk_${i}`,
        chunkText,
      },
    });
  }

  // 9. Handle Candidate Event & Reminders (#85, #87, #99)
  let createdReminder: any = null;
  const candidate = aiResult.candidate_event;
  const isExplicitReminder = Boolean(aiResult.reminder_requested || autoCreateReminder);

  if (candidate && candidate.date && isExplicitReminder) {
    // Automatically create reminder if requested
    const [y, m, d] = candidate.date.split("-").map(Number);
    const dueAt = new Date(y, m - 1, d);
    if (candidate.time) {
      const [h, min] = candidate.time.split(":").map(Number);
      dueAt.setHours(h || 9, min || 0, 0, 0);
    } else {
      dueAt.setHours(9, 0, 0, 0);
    }

    createdReminder = await prisma.reminder.create({
      data: {
        userId,
        title: candidate.title || memoryTitle,
        description: candidate.description || memoryContent,
        dueAt,
        timezone: userTimezone,
        status: "PENDING",
        priority: "NORMAL",
        categoryName: memoryCategory,
      },
    });

    // Link reminder to memory
    await prisma.memory.update({
      where: { id: memory.id },
      data: { reminderId: createdReminder.id },
    });

    // Schedule notification
    await prisma.reminderNotification.create({
      data: {
        userId,
        reminderId: createdReminder.id,
        scheduledFor: dueAt,
        status: "PENDING",
        channel: channel === "TELEGRAM" ? "TELEGRAM" : "WEB",
        deduplicationKey: `${createdReminder.id}_at_time_${dueAt.getTime()}`,
      },
    });

    await prisma.memoryTimeline.create({
      data: {
        memoryId: memory.id,
        userId,
        action: "REMINDER_LINKED",
        source: sourceTag,
        description: `রিমাইন্ডার তৈরি ও লিংক করা হয়েছে: ${formatFriendlyDate(dueAt)}`,
      },
    });
  }

  // 10. Construct User Reply Message & Confirmation Options
  let needsConfirmation = false;
  let confirmationMessage = "";

  if (candidate && candidate.date && !isExplicitReminder) {
    needsConfirmation = true;
    confirmationMessage = `আমি আপনার ফাইল থেকে একটি ইভেন্ট/তারিখ খুঁজে পেয়েছি:\n\n📌 <b>${candidate.title || memoryTitle}</b>\n⏰ তারিখ: ${candidate.date} ${candidate.time || ""}\n\nআপনি কি এর জন্য একটি <b>রিমাইন্ডার</b> সেট করতে চান?`;
  }

  let finalReply = aiResult.friendly_reply_bn || `ঠিক আছে, মনে রাখলাম। ${memoryTitle}: ${memoryContent}`;

  if (createdReminder) {
    finalReply += `\n\n🔔 সাথে ${formatFriendlyDate(createdReminder.dueAt)} তারিখে রিমাইন্ডার সেট করে দেওয়া হয়েছে।`;
  }

  await logAudit({
    userId,
    action: "MULTIMODAL_MEMORY_CREATED",
    entityType: "MEMORY",
    entityId: memory.id,
    details: { title: memoryTitle, source: sourceTag, hasFile: Boolean(savedFile) },
  });

  return {
    success: true,
    message: finalReply,
    memory,
    reminder: createdReminder,
    transcript: extractedText,
    ocrText: extractedText,
    summary,
    confidence,
    candidateReminder: candidate,
    needsConfirmation,
    confirmationMessage,
  };
}
