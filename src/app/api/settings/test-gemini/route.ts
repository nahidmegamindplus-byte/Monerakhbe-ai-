import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const CANDIDATE_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let testKey = (body.apiKey || process.env.GEMINI_API_KEY || "").trim();
    if ((testKey.startsWith('"') && testKey.endsWith('"')) || (testKey.startsWith("'") && testKey.endsWith("'"))) {
      testKey = testKey.slice(1, -1).trim();
    }

    if (!testKey) {
      return NextResponse.json(
        { success: false, error: "কোনো Gemini API Key পাওয়া যায়নি। দয়া করে ইনপুট বক্সে আপনার API Key দিন।" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const genAI = new GoogleGenerativeAI(testKey);

    let lastError: any = null;
    let successfulModel = "";
    let replyText = "";

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "MoneRakhbe AI এর জন্য একটি ছোট ১ বাক্যের টেস্ট শুভেচ্ছা দিন।";
        const result = await model.generateContent(prompt);
        replyText = result.response.text().trim();
        successfulModel = modelName;
        break;
      } catch (mErr: any) {
        lastError = mErr;
      }
    }

    if (!successfulModel) {
      throw lastError || new Error("Failed to connect with any Gemini model");
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      model: successfulModel,
      latencyMs,
      reply: replyText,
      message: `✅ টেস্ট সফল! ${successfulModel} সক্রিয় রয়েছে (${latencyMs}ms)।`,
    });
  } catch (err: any) {
    console.error("[Test Gemini Error]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Gemini API Key টেস্ট ব্যর্থ হয়েছে: " + (err.message || "Invalid API key or network error"),
      },
      { status: 400 }
    );
  }
}

