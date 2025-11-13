// src/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value ?? null;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  // 返回安全字段
  return { id: session.id, userId: session.userId, expiresAt: session.expiresAt };
}
