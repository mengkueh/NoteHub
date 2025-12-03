// src/app/api/notes/[id]/accesses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

/** small runtime type helpers copied to be safe (resolve promise params) */
function isPromiseLike(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as any).then === "function";
}
async function resolveParams(params: unknown): Promise<{ id: string } | null> {
  if (!params) return null;
  if (isPromiseLike(params)) return (await params) as { id: string } | null;
  return params as { id: string } | null;
}

/**
 * PUT /api/notes/[id]/accesses
 * body: { userId: string, role: "viewer" | "editor" }
 * only owner can change roles
 */
export async function PUT(req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    const noteId = maybeParams?.id ? Number(maybeParams.id) : NaN;
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { userId, role } = body ?? {};
    if (!userId || (role !== "viewer" && role !== "editor")) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const access = await prisma.noteAccess.findUnique({ where: { noteId_userId: { noteId, userId } } });
    if (!access) return NextResponse.json({ error: "Access record not found" }, { status: 404 });

    await prisma.noteAccess.update({
      where: { noteId_userId: { noteId, userId } },
      data: { role },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/notes/[id]/accesses error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id]/accesses
 * body: { userId: string }
 * only owner can remove collaborator
 */
export async function DELETE(req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    const noteId = maybeParams?.id ? Number(maybeParams.id) : NaN;
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { userId } = body ?? {};
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // delete noteAccess row
    await prisma.noteAccess.deleteMany({ where: { noteId, userId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notes/[id]/accesses error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
