// app/api/notes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value ?? null;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    const body = await req.json();
    const { title, content, tagIds } = body ?? {};

    if (!title || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // update note
    const updated = await prisma.note.update({
      where: { id },
      data: { title, content },
      select: { id: true, title: true, content: true, createdAt: true },
    });

    // update tag associations: simplest approach — delete existing joins and recreate
    if (Array.isArray(tagIds)) {
      await prisma.noteTag.deleteMany({ where: { noteId: id } });
      const creates = tagIds.map((tid: number) => prisma.noteTag.create({ data: { noteId: id, tagId: Number(tid) } }));
      await Promise.all(creates);
    }

    const result = await prisma.note.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("PUT /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.noteTag.deleteMany({ where: { noteId: id } });
    await prisma.note.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
