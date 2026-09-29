import { executeAssistantConversation, AssistantResponse, AssistantInput } from "./assistant";
import { generateDailyBriefing, generateEveningSummary, generateWeeklyReview } from "./briefing";

export {
  executeAssistantConversation,
  generateDailyBriefing,
  generateEveningSummary,
  generateWeeklyReview,
};

export type ProcessMessageResponse = AssistantResponse;

/**
 * Universal User Message Processing Pipeline (#158 - #200)
 */
export async function processUserMessage(options: AssistantInput): Promise<AssistantResponse> {
  return executeAssistantConversation(options);
}

