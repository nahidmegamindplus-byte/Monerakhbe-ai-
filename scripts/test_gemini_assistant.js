const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testAssistant() {
  const prompt = `
Current Reference Time: 2026-09-30T13:30:00.000Z
User Name: User
Timezone: Asia/Dhaka

--- RECENT CONVERSATION HISTORY ---
No previous conversation

--- USER'S ACTIVE REMINDERS ---
No active reminders

--- USER'S PENDING TASKS ---
No pending tasks

--- USER'S SAVED MEMORIES ---
No saved memories

--- NEW USER MESSAGE ---
"কাল ৫টায় রাকিবকে ফোন করতে হবে"
`;

  const SYSTEM_PROMPT = `
You are MoneRakhbe AI, an intelligent Personal Digital Assistant & Memory Keeper.
Return JSON strictly matching schema:
{
  "intent": "create_reminder" | "create_memory" | "create_task" | "query_memories" | "query_reminders" | "query_schedule" | "general_chat",
  "title": string | null,
  "description": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:mm" | null,
  "recurrence": null,
  "reminder_offsets": ["at_time"],
  "priority": "LOW" | "NORMAL" | "HIGH",
  "category": string,
  "memory_category": null,
  "memory_key": null,
  "memory_value": null,
  "target_reference": null,
  "query_scope": null,
  "preference_key": null,
  "preference_value": null,
  "reply_bn": string
}
`;

  console.log("--- Testing with systemInstruction ---");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });

  const res = await model.generateContent(prompt);
  const text = res.response.text();
  console.log("Response text:", text);
  try {
    const parsed = JSON.parse(text);
    console.log("PARSED JSON SUCCESSFULLY:", parsed);
  } catch (e) {
    console.error("JSON PARSE ERROR:", e.message);
  }
}

testAssistant().catch(console.error);
