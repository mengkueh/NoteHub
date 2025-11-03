// app/api/tags/route.ts
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

/** type guard: unknown -> is array of number|string (we accept either) */
function isNumberOrStringArray(x: unknown): x is Array<number | string> {
  return Array.isArray(x) && x.every((item) => typeof item === "number" || typeof item === "string");
}

/**
 * GET /api/tags
 *   - returns tags belonging to the current user
 */
export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tags = await prisma.tag.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json(tags);
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * body: { name: string, noteIds?: number[] | string[] }
 * - creates (or upserts) a tag for the current user
 * - attaches only notes that belong to the current user
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // parse body as unknown
    const rawBody = await req.json().catch(() => ({} as unknown));

    // get name safely
    const name =
      typeof rawBody === "object" && rawBody !== null && "name" in rawBody && typeof (rawBody as Record<string, unknown>).name === "string"
        ? ((rawBody as Record<string, unknown>).name as string).trim()
        : "";

    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    // Extract noteIds safely: support number[] or string[] coming from client
    const maybeNoteIds =
      typeof rawBody === "object" && rawBody !== null && "noteIds" in rawBody
        ? (rawBody as Record<string, unknown>).noteIds
        : undefined;

    let noteIds: number[] = [];
    if (isNumberOrStringArray(maybeNoteIds)) {
      // convert to numbers and filter NaN
      noteIds = maybeNoteIds.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    }

    // upsert tag scoped to this user (requires @@unique([userId, name]) in schema)
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: session.userId, name } },
      update: {},
      create: { name, userId: session.userId },
    });

    // attach notes that are owned by this user only
    if (noteIds.length > 0) {
      const ownedNotes = await prisma.note.findMany({
        where: { id: { in: noteIds }, userId: session.userId },
        select: { id: true },
      });
      const ownedIds = ownedNotes.map((n) => n.id);
      if (ownedIds.length > 0) {
        // createMany with skipDuplicates to avoid duplicate composite PK errors
        await prisma.noteTag.createMany({
          data: ownedIds.map((nid) => ({ noteId: nid, tagId: tag.id })),
          skipDuplicates: true,
        });
      }
    }

    // return created/updated tag including linked note basic info
    const created = await prisma.tag.findUnique({
      where: { id: tag.id },
      include: { notes: { include: { note: { select: { id: true, title: true } } } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/tags error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
