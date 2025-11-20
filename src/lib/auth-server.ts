// src/lib/auth-server.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getSessionFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
  });

  return session;
}
