import { GoogleGenerativeAI } from "@google/generative-ai";

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export function getGeminiApiKey(): string {
  let key = (process.env.GEMINI_API_KEY || "").trim();
  // Strip surrounding quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function cleanAndParseJson<T = any>(rawText: string): T | null {
  if (!rawText) return null;
  let text = rawText.trim();

  // Strip markdown code block fences if present
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/```\s*$/i, "").trim();
  }

  // Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try finding outer JSON braces { ... }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const substring = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(substring) as T;
      } catch (err2) {
        console.error("[cleanAndParseJson Error on substring]", err2);
      }
    }
    console.error("[cleanAndParseJson Error] Failed to parse text:", text.slice(0, 200));
    return null;
  }
}

export async function generateContentWithFallback({
  prompt,
  systemInstruction,
  inlineParts,
  isJson = true,
  temperature = 0.1,
}: {
  prompt: string;
  systemInstruction?: string;
  inlineParts?: any[];
  isJson?: boolean;
  temperature?: number;
}): Promise<{ text: string; parsedJson: any | null; modelUsed: string; tokensUsed: number } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const modelConfig: any = {
        model: modelName,
        generationConfig: {
          temperature,
          ...(isJson ? { responseMimeType: "application/json" } : {}),
        },
      };

      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      let contentPayload: any = prompt;
      if (inlineParts && inlineParts.length > 0) {
        contentPayload = [...inlineParts, prompt];
      }

      const response = await model.generateContent(contentPayload);
      const resText = response.response.text();
      const tokensUsed = response.response.usageMetadata?.totalTokenCount || 200;

      let parsedJson = null;
      if (isJson) {
        parsedJson = cleanAndParseJson(resText);
      }

      return {
        text: resText,
        parsedJson,
        modelUsed: modelName,
        tokensUsed,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Model ${modelName} failed, trying fallback...]`, err.message);
    }
  }

  console.error("[All Gemini Models Failed]", lastError);
  return null;
}
