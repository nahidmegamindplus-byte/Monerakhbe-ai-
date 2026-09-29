import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchMemoriesAndAskAI } from "@/services/ai/semantic-search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        answer: "অনুগ্রহ করে কোনো প্রশ্ন বা কীওয়ার্ড লিখুন।",
        foundMemories: [],
        sourceAttachments: [],
      });
    }

    const result = await searchMemoriesAndAskAI({
      userId: session.id,
      query,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Semantic Search API Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform semantic search" },
      { status: 500 }
    );
  }
}
