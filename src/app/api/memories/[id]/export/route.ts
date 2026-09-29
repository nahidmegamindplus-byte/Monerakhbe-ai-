import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memory = await prisma.memory.findUnique({
      where: { id: params.id, userId: session.id },
      include: {
        attachments: true,
        reminder: true,
        timeline: true,
      },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown";

    if (format === "json") {
      return new NextResponse(JSON.stringify(memory, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="memory_${memory.id.slice(0, 8)}.json"`,
        },
      });
    }

    const mdContent = `# ${memory.key}
**Category:** ${memory.category}
**Created:** ${memory.createdAt.toISOString()}
**Source:** ${memory.source}
**Confidence:** ${Math.round((memory.confidence || 1) * 100)}%

---

## Memory Details
${memory.value}

${memory.summary ? `## Summary\n${memory.summary}\n` : ""}
${memory.extractedText ? `## Extracted Text / Transcript\n\`\`\`\n${memory.extractedText}\n\`\`\`\n` : ""}

## Attachments (${memory.attachments.length})
${memory.attachments.map((a) => `- [${a.type.toUpperCase()}] ${a.fileName} (${a.storagePath})`).join("\n") || "No attachments"}

## Timeline
${memory.timeline.map((t) => `- **${t.createdAt.toISOString().slice(0, 10)}**: ${t.description}`).join("\n")}
`;

    return new NextResponse(mdContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${memory.key.replace(/[^a-zA-Z0-9_-]/g, "_")}.md"`,
      },
    });
  } catch (error) {
    console.error("[Export Memory Error]", error);
    return NextResponse.json({ error: "Failed to export memory" }, { status: 500 });
  }
}
