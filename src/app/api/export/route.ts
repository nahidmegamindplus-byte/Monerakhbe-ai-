import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const [reminders, memories, tasks] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId: session.id, deletedAt: null },
        include: { recurrence: true },
      }),
      prisma.memory.findMany({
        where: { userId: session.id },
      }),
      prisma.task.findMany({
        where: { userId: session.id },
      }),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      user: { id: session.id, email: session.email, name: session.name },
      reminders,
      memories,
      tasks,
    };

    if (format === "csv") {
      // Build simple CSV
      let csv = "Type,ID,Title/Key,Content/Value,Date/DueAt,Status/Category\n";
      reminders.forEach((r) => {
        csv += `"Reminder","${r.id}","${r.title.replace(/"/g, '""')}","${(r.description || "").replace(/"/g, '""')}","${r.dueAt.toISOString()}","${r.status}"\n`;
      });
      memories.forEach((m) => {
        csv += `"Memory","${m.id}","${m.key.replace(/"/g, '""')}","${m.value.replace(/"/g, '""')}","${m.createdAt.toISOString()}","${m.category}"\n`;
      });
      tasks.forEach((t) => {
        csv += `"Task","${t.id}","${t.title.replace(/"/g, '""')}","${(t.description || "").replace(/"/g, '""')}","${t.dueDate ? t.dueDate.toISOString() : ""}","${t.status}"\n`;
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="monerakhbe-export-${Date.now()}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="monerakhbe-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[Export Error]", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
