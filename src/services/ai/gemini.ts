import { AIIntentResult } from "@/types";
import { SYSTEM_NLU_PROMPT } from "./prompt";
import { parseMessageFallback } from "./fallback-parser";
import { generateContentWithFallback } from "./gemini-client";

export async function parseUserMessageWithGemini(
  message: string,
  userTimezone: string = "Asia/Dhaka",
  currentIsoTime?: string
): Promise<{ result: AIIntentResult; tokensUsed: number }> {
  const now = currentIsoTime ? new Date(currentIsoTime) : new Date();

  const userPrompt = `
Reference Current Date & Time: ${now.toISOString()} (${now.toLocaleDateString("en-US", { timeZone: userTimezone })})
User Timezone: ${userTimezone}
User Message: "${message}"

Parse this message and return the exact JSON schema defined in system prompt.
`;

  try {
    const aiResponse = await generateContentWithFallback({
      prompt: userPrompt,
      systemInstruction: SYSTEM_NLU_PROMPT,
      isJson: true,
      temperature: 0.1,
    });

    if (aiResponse && aiResponse.parsedJson) {
      const parsed = aiResponse.parsedJson as AIIntentResult;

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
        tokensUsed: aiResponse.tokensUsed,
      };
    }
  } catch (error) {
    console.error("[Gemini AI Parser Error, using fallback]", error);
  }

  const fallbackResult = parseMessageFallback(message, now);
  return { result: fallbackResult, tokensUsed: 0 };
}

