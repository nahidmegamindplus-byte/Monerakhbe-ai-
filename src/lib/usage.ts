import prisma from "@/lib/prisma";
import { SubscriptionPlan } from "@/types";

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  {
    maxReminders: number;
    maxMemories: number;
    maxAiRequestsPerMonth: number;
    hasTelegram: boolean;
    hasCalendar: boolean;
    hasAdvancedRecurrence: boolean;
  }
> = {
  FREE: {
    maxReminders: 50,
    maxMemories: 30,
    maxAiRequestsPerMonth: 200,
    hasTelegram: true,
    hasCalendar: true,
    hasAdvancedRecurrence: false,
  },
  PRO: {
    maxReminders: 500,
    maxMemories: 1000,
    maxAiRequestsPerMonth: 2000,
    hasTelegram: true,
    hasCalendar: true,
    hasAdvancedRecurrence: true,
  },
  BUSINESS: {
    maxReminders: 10000,
    maxMemories: 50000,
    maxAiRequestsPerMonth: 20000,
    hasTelegram: true,
    hasCalendar: true,
    hasAdvancedRecurrence: true,
  },
};

export async function checkUserAiLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = (user?.plan || "FREE") as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

    // Count usage in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageCount = await prisma.usageLog.count({
      where: {
        userId,
        actionType: "AI_REQUEST",
        createdAt: { gte: startOfMonth },
      },
    });

    if (usageCount >= limits.maxAiRequestsPerMonth) {
      return {
        allowed: false,
        reason: `You have reached your monthly AI limit of ${limits.maxAiRequestsPerMonth} requests. Please upgrade to Pro for higher limits.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: true }; // Fail-open gracefully
  }
}

export async function recordAiUsage(userId: string, tokensUsed: number = 0, ipAddress?: string) {
  try {
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "AI_REQUEST",
        tokensUsed,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("[UsageLog Error]", err);
  }
}
