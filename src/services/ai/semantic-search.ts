import prisma from "@/lib/prisma";
import { generateContentWithFallback } from "./gemini-client";


export interface SemanticSearchResult {
  answer: string;
  foundMemories: any[];
  sourceAttachments: any[];
  confidence: number;
}

export async function searchMemoriesAndAskAI({
  userId,
  query,
}: {
  userId: string;
  query: string;
}): Promise<SemanticSearchResult> {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Fetch user memories with attachments, embeddings, and reminders
  const allMemories = await prisma.memory.findMany({
    where: { userId },
    include: {
      attachments: true,
      embeddings: true,
      reminder: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (allMemories.length === 0) {
    return {
      answer: "আপনার কোনো সংরক্ষিত মেমোরি বা ডকুমেন্টস পাওয়া যায়নি।",
      foundMemories: [],
      sourceAttachments: [],
      confidence: 0,
    };
  }

  // 2. Rank memories by matching query keywords in title, value, summary, OCR, tags, and structured data
  const scoredMemories = allMemories.map((m) => {
    let score = 0;
    const title = (m.key || "").toLowerCase();
    const content = (m.value || "").toLowerCase();
    const summary = (m.summary || "").toLowerCase();
    const ocr = (m.extractedText || "").toLowerCase();
    const tags = (m.tags || "").toLowerCase();
    const structured = (m.structuredData || "").toLowerCase();

    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);

    for (const token of queryTokens) {
      if (title.includes(token)) score += 15;
      if (tags.includes(token)) score += 10;
      if (content.includes(token)) score += 8;
      if (summary.includes(token)) score += 8;
      if (ocr.includes(token)) score += 6;
      if (structured.includes(token)) score += 10;
    }

    // Semantic term synonyms (workplace <-> office, birthday <-> জন্মদিন, rent <-> ভাড়া, etc.)
    const synonyms: Record<string, string[]> = {
      workplace: ["office", "work", "job", "অফিস", "কাজের জায়গা", "ঠিকানা"],
      office: ["workplace", "work", "অফিস", "ঠিকানা", "banani", "banasree"],
      birthday: ["জন্মদিন", "birth", "date", "jonmodin"],
      জন্মদিন: ["birthday", "jonmodin", "জন্ম"],
      insurance: ["বীমা", "policy", "premium", "ইনস্যুরেন্স"],
      rent: ["ভাড়া", "বাড়ি ভাড়া", "house rent", "agreement", "চুক্তি"],
      doctor: ["ডাক্তার", "appointment", "প্রেসক্রিপশন", "prescription", "হাসপাতাল"],
    };

    for (const [key, synList] of Object.entries(synonyms)) {
      if (cleanQuery.includes(key)) {
        for (const syn of synList) {
          if (title.includes(syn) || content.includes(syn) || ocr.includes(syn)) {
            score += 12;
          }
        }
      }
    }

    return { memory: m, score };
  });

  scoredMemories.sort((a, b) => b.score - a.score);
  const matched = scoredMemories.filter((item) => item.score > 0).map((item) => item.memory);
  const relevantMemories = matched.length > 0 ? matched.slice(0, 5) : allMemories.slice(0, 10);

  // 3. Extract source attachments for verification
  const sourceAttachments: any[] = [];
  for (const m of relevantMemories) {
    if (m.attachments && m.attachments.length > 0) {
      sourceAttachments.push(...m.attachments);
    }
  }

  // 4. Synthesize direct natural language answer with Gemini / Fallback
  try {
    const contextText = relevantMemories
      .map(
        (m, idx) => `
[Memory #${idx + 1}]
Title: ${m.key}
Category: ${m.category}
Content: ${m.value}
Summary: ${m.summary || "N/A"}
Extracted Text/OCR: ${m.extractedText || "N/A"}
Structured Data: ${m.structuredData || "N/A"}
Source: ${m.source}
Date: ${m.createdAt.toISOString()}
`
      )
      .join("\n---\n");

    const prompt = `
You are MoneRakhbe AI's Memory & Document search assistant.
The user is asking a question about their saved memories, documents, voice notes, or photos.

USER QUESTION: "${query}"

AVAILABLE USER MEMORIES & EXTRACTED DOCUMENTS:
${contextText}

INSTRUCTIONS:
1. Answer the user's question directly, concisely, and accurately in natural Bengali (or English if user asked in English).
2. If the information was found in a specific document or image or voice message, mention the title and source.
3. If the answer is clearly present (e.g. rent amount, insurance expiry date, doctor appointment, office address), state the exact fact clearly.
4. If not found in the stored memory, state politely that the specific info was not found. Do NOT invent facts.
`;

    const aiRes = await generateContentWithFallback({
      prompt,
      isJson: false,
      temperature: 0.2,
    });

    if (aiRes && aiRes.text) {
      return {
        answer: aiRes.text.trim(),
        foundMemories: relevantMemories,
        sourceAttachments,
        confidence: matched.length > 0 ? 0.95 : 0.6,
      };
    }
  } catch (e) {
    console.error("[Semantic Search AI Error, using rule synthesis]", e);
  }


  // Fallback direct synthesis
  if (relevantMemories.length > 0 && matched.length > 0) {
    const top = relevantMemories[0];
    return {
      answer: `আপনার "${top.key}" মেমোরি অনুযায়ী: ${top.value}`,
      foundMemories: relevantMemories,
      sourceAttachments,
      confidence: 0.85,
    };
  }

  return {
    answer: `আপনার প্রশ্নের সাথে সম্পর্কিত কোনো নির্দিষ্ট মেমোরি খুঁজে পাওয়া যায়নি।`,
    foundMemories: [],
    sourceAttachments: [],
    confidence: 0.4,
  };
}
