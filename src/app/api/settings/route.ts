import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        telegramConnection: true,
      },
    });

    const geminiKey = process.env.GEMINI_API_KEY || "";

    return NextResponse.json({
      success: true,
      user,
      hasGeminiKey: Boolean(geminiKey && geminiKey.trim()),
      maskedGeminiKey: geminiKey ? `${geminiKey.slice(0, 6)}...${geminiKey.slice(-4)}` : "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      timezone,
      language,
      defaultMorningTime,
      defaultEveningTime,
      defaultOffsets,
      notificationPreferences,
      geminiApiKey,
    } = body;

    // Save Gemini API Key if supplied
    if (geminiApiKey !== undefined) {
      const cleanKey = geminiApiKey.trim();
      const envPath = path.join(process.cwd(), ".env");
      let envContent = "";
      try {
        envContent = await fs.readFile(envPath, "utf-8");
      } catch {
        envContent = "";
      }

      if (envContent.includes("GEMINI_API_KEY=")) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY="${cleanKey}"`);
      } else {
        envContent += `\nGEMINI_API_KEY="${cleanKey}"`;
      }

      await fs.writeFile(envPath, envContent, "utf-8");
      process.env.GEMINI_API_KEY = cleanKey;
    }

    // Update User
    let userUpdates: any = {};
    if (name) userUpdates.name = name;
    if (timezone) userUpdates.timezone = timezone;
    if (language) userUpdates.language = language;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: session.id },
        data: userUpdates,
      });
    }

    // Update Profile
    let profileUpdates: any = {};
    if (defaultMorningTime) profileUpdates.defaultMorningTime = defaultMorningTime;
    if (defaultEveningTime) profileUpdates.defaultEveningTime = defaultEveningTime;
    if (defaultOffsets) profileUpdates.defaultOffsetsJson = JSON.stringify(defaultOffsets);
    if (notificationPreferences) profileUpdates.notificationPreferences = JSON.stringify(notificationPreferences);

    if (Object.keys(profileUpdates).length > 0) {
      await prisma.profile.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          ...profileUpdates,
        },
        update: profileUpdates,
      });
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("[Settings PATCH Error]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Permanently delete user and cascade all data
    await prisma.user.delete({
      where: { id: session.id },
    });

    const response = NextResponse.json({ success: true, message: "Account and all associated data deleted successfully" });
    response.cookies.delete("token");
    return response;
  } catch (error) {
    console.error("[Account Deletion Error]", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
