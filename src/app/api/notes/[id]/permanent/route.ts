// app/api/notes/[id]/permanent/route.ts\
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

/** small runtime type helpers */
function isPromiseLike(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as any).then === "function";
}
async function resolveParams(params: unknown): Promise<{ id: string } | null> {
  if (!params) return null;
  if (isPromiseLike(params)) {
    // params may be a Promise<{ id: string }>
    return (await params) as { id: string } | null;
  }
  return params as { id: string } | null;
}

/**
 * DELETE /api/notes/[id]/permanent
 * Permanently delete a note (only owner)
 */
export async function DELETE(_req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const noteId = Number(maybeParams.id);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    // find note
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // only owner can permanently delete
    if (note.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // delete related joins and the note in a transaction
    await prisma.$transaction([
      prisma.noteTag.deleteMany({ where: { noteId } }),
      prisma.noteAccess.deleteMany({ where: { noteId } }),
      prisma.note.delete({ where: { id: noteId } }),
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/notes/[id]/permanent error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
