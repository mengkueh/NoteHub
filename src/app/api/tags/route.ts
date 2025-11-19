// app/api/tags/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * getSessionFromCookie - safe helper
 * cookies() in app router returns a ReadonlyRequestCookies synchronously in many Next versions.
 * We keep it non-blocking (no extra await) and guard against errors.
 */
async function getSessionFromCookie() {
  try {
    const cookieStore = await cookies(); // synchronous in app router
    const sessionId = cookieStore.get("session")?.value ?? null;
    if (!sessionId) return null;
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session;
  } catch (err) {
    console.error("getSessionFromCookie error:", err);
    return null;
  }
}

/** helper: accept number[] or string[] and convert to numbers */
function parseIdArray(x: unknown): number[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") return Number(v);
      return NaN;
    })
    .filter((n) => Number.isFinite(n));
}

/**
 * GET - returns tags for current user (id + name + optional notes count)
 */
export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tags = await prisma.tag.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
      // include note count so UI can show how many notes in each tag
      include: { notes: { select: { noteId: true } } },
    });

    // transform to friendlier shape for client
    const out = tags.map((t) => ({ id: t.id, name: t.name, notes: t.notes ?? [] }));
    return NextResponse.json(out);
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST - create/upsert a tag for this user and attach specified notes.
 * Body: { name: string, noteIds?: number[] | string[] }
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await req.json().catch(() => ({}));
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Missing tag name" }, { status: 400 });

    // parse noteIds safely
    const requestedNoteIds = parseIdArray(raw?.noteIds);
    // upsert tag scoped to this user (requires @@unique([userId, name]) in prisma schema)
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: session.userId, name } },
      update: {},
      create: { name, userId: session.userId },
    });

    // if user passed note ids, attach only notes that the user may attach:
    // user can attach:
    // - notes they own (note.userId === session.userId)
    // - notes shared with them (noteAccess exists with userId === session.userId)
    if (requestedNoteIds.length > 0) {
      const allowedNotes = await prisma.note.findMany({
        where: {
          id: { in: requestedNoteIds },
          AND: [
            {
              OR: [
                { userId: session.userId }, // owner
                { accesses: { some: { userId: session.userId } } }, // shared with them
              ],
            },
          ],
        },
        select: { id: true },
      });

      const allowedIds = allowedNotes.map((n) => n.id);
      if (allowedIds.length > 0) {
        // bulk create noteTag entries and skip duplicates
        await prisma.noteTag.createMany({
          data: allowedIds.map((nid) => ({ noteId: nid, tagId: tag.id })),
          skipDuplicates: true,
        });
      }
    }

    // return created tag with its notes (simple shape)
    const created = await prisma.tag.findUnique({
      where: { id: tag.id },
      include: { notes: { include: { note: { select: { id: true, title: true } } } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tags error:", err);

    // helpful hint if missing unique index in schema
    if (err?.message && /userId_name/i.test(String(err.message))) {
      return NextResponse.json(
        { error: "Schema error: ensure Tag model has @@unique([userId, name]) in prisma schema" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
