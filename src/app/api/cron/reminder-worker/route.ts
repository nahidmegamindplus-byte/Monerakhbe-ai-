import { NextRequest, NextResponse } from "next/server";
import { processDueNotifications } from "@/services/scheduler/worker";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional secret check
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      // In dev allow without bearer if local
      const host = req.headers.get("host") || "";
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    const results = await processDueNotifications();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("[Cron Reminder Worker Error]", error);
    return NextResponse.json({ error: "Worker execution failed", message: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
