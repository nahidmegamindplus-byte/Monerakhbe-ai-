import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateEveningSummary } from "@/services/ai/briefing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await generateEveningSummary(session.id);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Assistant Summary Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
