// app/api/trash/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth"; // your helper

const RETENTION_DAYS = Number(process.env.TRASH_RETENTION_DAYS ?? "30");

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trashed = await prisma.note.findMany({
    where: { userId: session.userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, title: true, content: true, deletedAt: true, updatedAt: true },
  });

  // compute when it will be permanently deleted
  const response = trashed.map((t) => {
    const deletedAt = t.deletedAt as Date;
    const willBePermanentlyDeletedAt = new Date(deletedAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((willBePermanentlyDeletedAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return { ...t, willBePermanentlyDeletedAt: willBePermanentlyDeletedAt.toISOString(), daysLeft };
  });

  return NextResponse.json(response);
}
