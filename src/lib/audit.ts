import prisma from "@/lib/prisma";

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: typeof details === "object" ? JSON.stringify(details) : details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error]", error);
  }
}
