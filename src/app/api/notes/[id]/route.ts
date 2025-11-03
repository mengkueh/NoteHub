// src/app/api/notes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/** get session helper (await cookies()) */
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!x && typeof (x as any).then === "function";
}

async function resolveParams(params: unknown): Promise<{ id: string } | null> {
  if (!params) return null;
  if (isPromiseLike(params)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await params) as { id: string } | null;
  }
  return params as { id: string } | null;
}

/**
 * GET /api/notes/[id]
 * returns note (only if belongs to current user)
 */
export async function GET(_req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams || !maybeParams.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const id = Number(maybeParams.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    if (!note || note.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(note);
  } catch (err) {
    console.error("GET /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PUT /api/notes/[id]
 * body: { title?: string, content?: string, tagIds?: (number|string)[] }
 */
export async function PUT(req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams || !maybeParams.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const id = Number(maybeParams.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const raw = (await req.json().catch(() => ({} as unknown))) as unknown;
    // extract updates
    const title =
      typeof raw === "object" && raw !== null && "title" in (raw as Record<string, unknown>) && typeof (raw as any).title === "string"
        ? (raw as any).title
        : undefined;
    const content =
      typeof raw === "object" && raw !== null && "content" in (raw as Record<string, unknown>) && typeof (raw as any).content === "string"
        ? (raw as any).content
        : undefined;

    const rawTagIds = typeof raw === "object" && raw !== null && "tagIds" in (raw as Record<string, unknown>) ? (raw as any).tagIds : undefined;
    let tagIds: number[] = [];
    if (Array.isArray(rawTagIds)) {
      tagIds = rawTagIds.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    }

    const updateData: Record<string, unknown> = {};
    if (typeof title === "string" && title.trim() !== "") updateData.title = title.trim();
    if (typeof content === "string" && content.trim() !== "") updateData.content = content.trim();

    if (Object.keys(updateData).length > 0) {
      await prisma.note.update({ where: { id }, data: updateData });
    }

    if (tagIds.length > 0) {
      // only attach tags owned by user
      const ownedTags = await prisma.tag.findMany({ where: { id: { in: tagIds }, userId: session.userId }, select: { id: true } });
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
 * body optional; deletes note if owned by user
 */
export async function DELETE(_req: Request, context: { params: unknown }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maybeParams = await resolveParams(context.params);
    if (!maybeParams || !maybeParams.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const id = Number(maybeParams.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
