import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const noteId = Number(params.id);
  if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // only owner can restore (choose your policy)
  if (note.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.note.update({ where: { id: noteId }, data: { deletedAt: null } });
  return NextResponse.json({ ok: true });
}
