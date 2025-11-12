// app/api/notes/[id]/invite/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import sendInviteEmail from "@/lib/sendInviteEmail";

/** helper: get session from cookie (await cookies()) */
async function getSession() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("session")?.value ?? null;
  if (!sid) return null;
  const s = await prisma.session.findUnique({ where: { id: sid } });
  if (!s || s.expiresAt < new Date()) return null;
  return s;
}

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = Number(context.params.id);
    if (Number.isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const inviteeEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "editor";

    if (!inviteeEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // fetch note & check permission
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const requesterAccess = await prisma.noteAccess.findUnique({
      where: { noteId_userId: { noteId, userId: session.userId } },
    });

    if (session.userId !== note.userId && (!requesterAccess || requesterAccess.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // create invite token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    const invite = await prisma.noteInvite.create({
      data: {
        id: token,
        noteId,
        inviterId: session.userId,
        inviteeEmail,
        role,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const acceptUrl = `${appUrl}/invite/${encodeURIComponent(token)}`;

    // send the email (wrap in try so email failures don't break invite creation)
    try {
      const inviter = await prisma.user.findUnique({ where: { id: session.userId } });
      await sendInviteEmail({
        inviteeEmail,
        inviterEmail: inviter?.email ?? null,
        noteTitle: note.title,
        acceptUrl,
        expiresAt,
      });
    } catch (mailErr) {
      console.error("Warning: sendInviteEmail failed:", mailErr);
      // Not returning error here — invite still exists in DB
    }

    return NextResponse.json({ ok: true, inviteId: invite.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes/[id]/invite error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
