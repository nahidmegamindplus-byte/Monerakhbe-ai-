import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { UserSession } from "@/types";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "monerakhbe-fallback-jwt-secret-key-32chars";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<UserSession | null> {
  // 1. Check Authorization header
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Check Cookie
  if (!token) {
    const cookie = req.cookies.get("token");
    if (cookie) {
      token = cookie.value;
    }
  }

  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  const cleanEmail = session.email ? session.email.toLowerCase().trim() : "";
  const isMasterAdmin = 
    cleanEmail === "admin@monerakhbe.ai" || 
    cleanEmail === (process.env.ADMIN_EMAIL || "").toLowerCase().trim() || 
    session.role === "ADMIN";

  try {
    // 1. Try finding user by ID
    let user = session.id ? await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, role: true, timezone: true, language: true, plan: true, isSuspended: true },
    }).catch(() => null) : null;

    // 2. Fallback: Try finding user by Email (handles serverless instance cold switches)
    if (!user && cleanEmail) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, email: true, name: true, role: true, timezone: true, language: true, plan: true, isSuspended: true },
      }).catch(() => null);
    }

    // 3. Auto-provision master admin if missing in current container
    if (!user && isMasterAdmin && cleanEmail) {
      const { ensureMasterAdmin } = await import("@/lib/bootstrap");
      const created = await ensureMasterAdmin(cleanEmail);
      if (created) {
        user = {
          id: created.id,
          email: created.email,
          name: created.name,
          role: "ADMIN",
          timezone: created.timezone,
          language: created.language,
          plan: created.plan,
          isSuspended: false,
        };
      }
    }

    if (user && user.isSuspended) return null;

    if (user) {
      const userCleanEmail = user.email.toLowerCase().trim();
      const isAdminEmail = userCleanEmail === "admin@monerakhbe.ai" || userCleanEmail === (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      let resolvedRole = user.role;
      if (isAdminEmail || isMasterAdmin) {
        resolvedRole = "ADMIN";
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: resolvedRole as any,
        timezone: user.timezone,
        language: user.language,
        plan: user.plan as any,
      };
    }

    // If valid token exists and has user data, return token payload
    if (session.id && session.email) {
      return {
        ...session,
        role: isMasterAdmin ? "ADMIN" : session.role,
      };
    }

    return null;
  } catch (err) {
    console.warn("[Auth getSessionUser fallback]", err);
    if (session.id && session.email) {
      return {
        ...session,
        role: isMasterAdmin ? "ADMIN" : session.role,
      };
    }
    return null;
  }
}
