// app/api/notes/[id]/restore/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

function isPromiseLike(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as any).then === "function";
}
async function resolveParams(params: unknown): Promise<{ id: string } | null> {
  if (!params) return null;
  if (isPromiseLike(params)) return (await params) as { id: string } | null;
  return params as { id: string } | null;
}

export async function POST(_req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybe = await resolveParams(context.params);
    if (!maybe?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const noteId = Number(maybe.id);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // only owner can restore (policy choice)
    if (note.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.note.update({ where: { id: noteId }, data: { deletedAt: null } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/notes/[id]/restore error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
