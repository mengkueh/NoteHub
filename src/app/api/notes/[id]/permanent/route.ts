import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

// permanent delete allowed only by owner
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const noteId = Number(params.id);
  if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (note.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // delete associated joins first if needed (cascade may already do it)
  await prisma.$transaction([
    prisma.noteTag.deleteMany({ where: { noteId } }),
    prisma.noteAccess.deleteMany({ where: { noteId } }),
    prisma.note.delete({ where: { id: noteId } }),
  ]);

  return NextResponse.json({ ok: true });
}
