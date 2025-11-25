// app/api/notes/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

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

// GET /api/notes?tagId=...
export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const tagIdStr = url.searchParams.get("tagId");

    if (tagIdStr) {
      const tagId = Number(tagIdStr);
      if (Number.isNaN(tagId)) return NextResponse.json({ error: "Invalid tagId" }, { status: 400 });

      const tag = await prisma.tag.findUnique({
        where: { id: tagId}, select : { id: true, name: true, userId: true },
      });
      if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

      // 找出屬於此 user 的 notes (owner) AND shared notes where the tag is attached
      const [owned, shared] = await Promise.all([
        prisma.note.findMany({
          where: {
            userId: session.userId,
            tags: { some: { tagId } },
            deletedAt: null,
          },
          select: { 
            id: true, 
            title: true, 
            content: true, 
            createdAt: true, 
            userId: true ,
            tags: { include: { tag: { select: { id: true, name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.note.findMany({
          where: {
            tags: { some: { tagId } },
            accesses: { some: { userId: session.userId } }, // shared with current session user
            // exclude owned ones (avoid duplicates)
            userId: { not: session.userId },
            deletedAt: null,
          },
          select: { 
            id: true, 
            title: true, 
            content: true, 
            createdAt: true, 
            userId: true,
            tags: { include: { tag: { select: { id: true, name: true } } } },
          },
            
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return NextResponse.json({ owned, shared });
    }

    //  non-tag case: return owned + shared (existing behavior)
    const [ownedAll, sharedAll] = await Promise.all([
      prisma.note.findMany({
        where: { userId: session.userId, deletedAt: null },
        select: { 
          id: true, 
          title: true, 
          content: true, 
          createdAt: true, 
          userId: true ,
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.note.findMany({
        where: { accesses: { some: { userId: session.userId } }, userId: { not: session.userId }, deletedAt: null },
        select: { 
          id: true, 
          title: true, 
          content: true, 
          createdAt: true, 
          userId: true ,
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ owned: ownedAll, shared: sharedAll });
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
