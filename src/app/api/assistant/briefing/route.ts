import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateDailyBriefing } from "@/services/ai/briefing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const briefing = await generateDailyBriefing(session.id);
    return NextResponse.json({ success: true, briefing });
  } catch (error: any) {
    console.error("[Assistant Briefing Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate briefing" }, { status: 500 });
  }
}
