import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateWeeklyReview } from "@/services/ai/briefing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await generateWeeklyReview(session.id);
    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("[Assistant Weekly Review Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate weekly review" }, { status: 500 });
  }
}
