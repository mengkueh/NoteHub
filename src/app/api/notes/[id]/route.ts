/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/** get session helper */
async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value ?? null;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session;
}

/** small runtime type helpers */
function isPromiseLike(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as any).then === "function";
}
async function resolveParams(params: unknown): Promise<{ id: string } | null> {
  if (!params) return null;
  if (isPromiseLike(params)) return (await params) as { id: string } | null;
  return params as { id: string } | null;
}

/**
 * GET /api/notes/[id]
 */
export async function GET(_req: Request, context: any) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const noteId = Number(maybeParams.id);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        accesses: { include: { user: { select: { id: true, email: true, displayName: true } } } },
        tags: { include: { tag: true } },
      },
    });

    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = note.userId === session.userId;
    const isCollaborator = note.accesses.some((a) => a.userId === session.userId);
    if (!isOwner && !isCollaborator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(note);
  } catch (err) {
    console.error("GET /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PUT /api/notes/[id]
 */
export async function PUT(req: Request, context: any) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const id = Number(maybeParams.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id }, include: { accesses: true } });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = note.userId === session.userId;
    const access = note.accesses.find((a: any) => a.userId === session.userId);

    if (!isOwner && access?.role !== "editor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const raw = (await req.json().catch(() => ({}))) as any;

    const updateData: any = {};
    if (typeof raw.title === "string" && raw.title.trim() !== "") updateData.title = raw.title.trim();
    if (typeof raw.content === "string" && raw.content.trim() !== "") updateData.content = raw.content.trim();

    if (Object.keys(updateData).length > 0) {
      await prisma.note.update({ where: { id }, data: updateData });
    }

    if (Array.isArray(raw.tagIds) && raw.tagIds.length > 0) {
      const tagIds = raw.tagIds.map((v: any) => Number(v)).filter((n: number) => !Number.isNaN(n));
      const ownedTags = await prisma.tag.findMany({ where: { id: { in: tagIds }, userId: note.userId }, select: { id: true } });
      const ownedIds = ownedTags.map((t) => t.id);
      await prisma.$transaction([
        prisma.noteTag.deleteMany({ where: { noteId: id } }),
        prisma.noteTag.createMany({ data: ownedIds.map((tid) => ({ noteId: id, tagId: tid })), skipDuplicates: true }),
      ]);
    }

    const updated = await prisma.note.findUnique({ where: { id }, include: { tags: { include: { tag: true } } } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id]
 */
export async function DELETE(_req: Request, context: any) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const id = Number(maybeParams.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
