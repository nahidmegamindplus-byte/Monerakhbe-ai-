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

  // Verify user still exists in DB and is active
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, role: true, timezone: true, language: true, plan: true, isSuspended: true },
    });

    if (!user || user.isSuspended) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      timezone: user.timezone,
      language: user.language,
      plan: user.plan as any,
    };
  } catch {
    return session;
  }
}
