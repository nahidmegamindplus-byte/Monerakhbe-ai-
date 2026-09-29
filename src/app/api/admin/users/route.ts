import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/users - Search, filter, and paginate users
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role") || "";
    const plan = searchParams.get("plan") || "";
    const status = searchParams.get("status") || ""; // active, suspended
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { id: { contains: query } },
      ];
    }

    if (role && role !== "ALL") {
      whereClause.role = role;
    }

    if (plan && plan !== "ALL") {
      whereClause.plan = plan;
    }

    if (status === "suspended") {
      whereClause.isSuspended = true;
    } else if (status === "active") {
      whereClause.isSuspended = false;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          timezone: true,
          language: true,
          isSuspended: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          telegramConnection: {
            select: {
              id: true,
              telegramUserId: true,
              chatId: true,
              username: true,
              firstName: true,
              isConnected: true,
              connectionToken: true,
              connectedAt: true,
            },
          },
          _count: {
            select: {
              reminders: true,
              memories: true,
              tasks: true,
              notifications: true,
              subscriptions: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Users GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new user directly
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = "USER", plan = "FREE", timezone = "Asia/Dhaka", language = "bn" } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered in system" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const rawToken = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role === "ADMIN" ? "ADMIN" : "USER",
        plan: ["PRO", "BUSINESS"].includes(plan) ? plan : "FREE",
        timezone,
        language,
        profile: {
          create: {
            defaultMorningTime: "09:00",
            defaultEveningTime: "17:00",
            defaultOffsetsJson: JSON.stringify(["at_time", "1_day_before"]),
          },
        },
        telegramConnection: {
          create: {
            isConnected: false,
            connectionToken: rawToken,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        timezone: true,
        language: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: session.id,
      action: "ADMIN_USER_CREATED",
      entityType: "USER",
      entityId: newUser.id,
      details: { email: newUser.email, name: newUser.name, role: newUser.role, plan: newUser.plan },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Users POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT /api/admin/users - Edit user attributes, toggle block/active, or reset password
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, userId, identifier, name, email, role, plan, timezone, language, isSuspended, newPassword, action } = body;

    const targetIdentifier = id || userId || identifier;
    if (!targetIdentifier) {
      return NextResponse.json({ error: "User ID or Email is required" }, { status: 400 });
    }

    // Support finding by ID or Email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier },
          { email: targetIdentifier.toLowerCase().trim() },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "ইউজার খুঁজে পাওয়া যায়নি (User not found)" }, { status: 404 });
    }

    // Determine new suspended state
    let targetSuspendedState: boolean | undefined = undefined;
    if (action === "BLOCK" || action === "DEACTIVATE" || action === "TURN_OFF") {
      targetSuspendedState = true;
    } else if (action === "UNBLOCK" || action === "ACTIVATE" || action === "TURN_ON") {
      targetSuspendedState = false;
    } else if (action === "TOGGLE_STATUS" || action === "TOGGLE_BLOCK") {
      targetSuspendedState = !targetUser.isSuspended;
    } else if (isSuspended !== undefined) {
      targetSuspendedState = Boolean(isSuspended);
    }

    // Protect self-admin from blocking themselves
    if (targetUser.id === session.id && targetSuspendedState === true) {
      return NextResponse.json({
        error: "নিরাপত্তার স্বার্থে আপনি নিজের অ্যাডমিন অ্যাকাউন্ট ব্লক বা অফ করতে পারবেন না!",
      }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (plan !== undefined) updateData.plan = plan;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (language !== undefined) updateData.language = language;
    if (targetSuspendedState !== undefined) updateData.isSuspended = targetSuspendedState;

    if (newPassword && newPassword.trim().length > 0) {
      updateData.passwordHash = await hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        timezone: true,
        language: true,
        isSuspended: true,
        updatedAt: true,
      },
    });

    const isBlockAction = targetSuspendedState !== undefined && targetSuspendedState !== targetUser.isSuspended;
    const auditAction = isBlockAction
      ? targetSuspendedState
        ? "ADMIN_USER_BLOCKED"
        : "ADMIN_USER_UNBLOCKED"
      : "ADMIN_USER_UPDATED";

    await logAudit({
      userId: session.id,
      action: auditAction,
      entityType: "USER",
      entityId: targetUser.id,
      details: {
        ...updateData,
        email: targetUser.email,
        name: targetUser.name,
        previousSuspended: targetUser.isSuspended,
        currentSuspended: updatedUser.isSuspended,
        passwordChanged: Boolean(newPassword),
      },
    });

    const statusMessage = updatedUser.isSuspended
      ? `ইউজার "${updatedUser.name}" (${updatedUser.email}) সফলভাবে ব্লক ও অফ করা হয়েছে`
      : `ইউজার "${updatedUser.name}" (${updatedUser.email}) সফলভাবে আনব্লক ও সক্রিয় করা হয়েছে`;

    return NextResponse.json({
      success: true,
      message: statusMessage,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[Admin Users PUT Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Hard delete user with complete cascade safety
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "Security Exception: You cannot delete your own admin account!" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cascade deletion
    await prisma.$transaction([
      prisma.reminderNotification.deleteMany({ where: { userId: targetUserId } }),
      prisma.memoryAttachment.deleteMany({ where: { userId: targetUserId } }),
      prisma.memoryEmbedding.deleteMany({ where: { userId: targetUserId } }),
      prisma.memoryTimeline.deleteMany({ where: { userId: targetUserId } }),
      prisma.memory.deleteMany({ where: { userId: targetUserId } }),
      prisma.reminder.deleteMany({ where: { userId: targetUserId } }),
      prisma.recurrence.deleteMany({ where: { userId: targetUserId } }),
      prisma.task.deleteMany({ where: { userId: targetUserId } }),
      prisma.conversationMessage.deleteMany({ where: { userId: targetUserId } }),
      prisma.usageLog.deleteMany({ where: { userId: targetUserId } }),
      prisma.subscription.deleteMany({ where: { userId: targetUserId } }),
      prisma.refund.deleteMany({ where: { userId: targetUserId } }),
      prisma.invoice.deleteMany({ where: { userId: targetUserId } }),
      prisma.paymentTransaction.deleteMany({ where: { userId: targetUserId } }),
      prisma.order.deleteMany({ where: { userId: targetUserId } }),
      prisma.telegramConnection.deleteMany({ where: { userId: targetUserId } }),
      prisma.profile.deleteMany({ where: { userId: targetUserId } }),
      prisma.user.delete({ where: { id: targetUserId } }),
    ]);

    await logAudit({
      userId: session.id,
      action: "ADMIN_USER_DELETED",
      entityType: "USER",
      entityId: targetUserId,
      details: { deletedEmail: targetUser.email, deletedName: targetUser.name },
    });

    return NextResponse.json({ success: true, message: `User ${targetUser.email} completely deleted` });
  } catch (error: any) {
    console.error("[Admin Users DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
