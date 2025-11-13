// app/api/notes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value ?? null;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const tagId = url.searchParams.get("tagId");

    if (tagId) {
      // notes of this user filtered by tag
      const notes = await prisma.note.findMany({
        where: {
          userId: session.userId,
          tags: { some: { tagId: Number(tagId) } },
        },
        select: { id: true, title: true, content: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(notes);
    }

    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { userId: session.userId }, // owner
          { accesses: { some: { userId: session.userId } } }, // collaborator
        ],
      },
      select: { id: true, title: true, content: true, createdAt: true, userId: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content, tagIds } = body ?? {};

    if (!title || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // create note
    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: session.userId,
      },
      select: { id: true, title: true, content: true, createdAt: true },
    });

    // if provided tagIds: connect entries in NoteTag
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const connects = tagIds.map((tid: number) => prisma.noteTag.create({ data: { noteId: note.id, tagId: Number(tid) } }));
      await Promise.all(connects);
    }

    // return created note (with tags if desired)
    const created = await prisma.note.findUnique({
      where: { id: note.id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
