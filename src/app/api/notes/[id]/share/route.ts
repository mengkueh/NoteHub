// app/api/notes/[id]/share/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";

type ReqBody = { email?: string; role?: string };

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const noteId = Number(params.id);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid note id" }, { status: 400 });

    const body = (await req.json().catch(() => ({} as ReqBody))) ?? {};
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const role = (body.role ?? "editor").toString();

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // 1) check note exists
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // 2) permission: only owner or editor can share
    const requesterAccess = await prisma.noteAccess.findUnique({
      where: { noteId_userId: { noteId, userId: session.userId } },
    });

    if (session.userId !== note.userId && (!requesterAccess || requesterAccess.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) find user by email
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return NextResponse.json({ error: "User with that email not found" }, { status: 404 });
    }

    // 4) upsert NoteAccess (create or update role)
    await prisma.noteAccess.upsert({
      where: { noteId_userId: { noteId, userId: invitee.id } },
      update: { role },
      create: { noteId, userId: invitee.id, role },
    });

    // optional: return list of current access entries for this note
    const accesses = await prisma.noteAccess.findMany({
      where: { noteId },
      select: { id: true, userId: true, role: true, user: { select: { email: true, displayName: true } } },
    });

    return NextResponse.json({ ok: true, accesses }, { status: 200 });
  } catch (err) {
    console.error("POST /api/notes/[id]/share error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
