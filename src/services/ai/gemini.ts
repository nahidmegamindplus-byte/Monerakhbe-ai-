import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIIntentResult } from "@/types";
import { SYSTEM_NLU_PROMPT } from "./prompt";
import { parseMessageFallback } from "./fallback-parser";

export async function parseUserMessageWithGemini(
  message: string,
  userTimezone: string = "Asia/Dhaka",
  currentIsoTime?: string
): Promise<{ result: AIIntentResult; tokensUsed: number }> {
  const now = currentIsoTime ? new Date(currentIsoTime) : new Date();
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  // If no Gemini key is provided, use the robust rule-based NLU engine
  if (!apiKey) {
    const fallbackResult = parseMessageFallback(message, now);
    return { result: fallbackResult, tokensUsed: 0 };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const userPrompt = `
Reference Current Date & Time: ${now.toISOString()} (${now.toLocaleDateString("en-US", { timeZone: userTimezone })})
User Timezone: ${userTimezone}
User Message: "${message}"

Parse this message and return the exact JSON schema defined in system prompt.
`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_NLU_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will parse all incoming messages strictly following the rules and output valid JSON." }],
        },
      ],
    });

    const response = await chat.sendMessage(userPrompt);
    const text = response.response.text();
    const parsed = JSON.parse(text) as AIIntentResult;

    // Safety checks against hallucinated recurrence:
    const lower = message.toLowerCase();
    const hasRecurrenceKeyword =
      lower.includes("প্রতি") ||
      lower.includes("every") ||
      lower.includes("daily") ||
      lower.includes("weekly") ||
      lower.includes("monthly") ||
      lower.includes("yearly") ||
      lower.includes("protidin") ||
      lower.includes("proti");

    if (!hasRecurrenceKeyword && parsed.recurrence) {
      parsed.recurrence = null;
    }

    return {
      result: parsed,
      tokensUsed: response.response.usageMetadata?.totalTokenCount || 250,
    };
  } catch (error) {
    console.error("[Gemini AI Parser Error, using fallback]", error);
    const fallback = parseMessageFallback(message, now);
    return { result: fallback, tokensUsed: 0 };
  }
}
