// src/app/api/notes/[id]/share/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** helper to get session from cookie (server-side) */
async function getSessionFromCookie() {
  try {
    const cookieStore = await cookies();
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

/**
 * POST /api/notes/[id]/share
 * body: { email: string, role?: "viewer" | "editor" }
 *
 * Requirements:
 * - requester must be owner OR have editor role (you can tighten this as you like)
 * - invitee must be an existing user (this matches your "no email sending" requirement)
 * - upsert NoteAccess so the invitee gets access immediately
 */
export async function POST(req: Request, context: any) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // get note id from route params (be defensive: params may be promise-like)
    const maybeParams = context?.params;
    const resolvedParams = typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;
    const idStr = resolvedParams?.id ?? resolvedParams?.noteId ?? null;
    if (!idStr) return NextResponse.json({ error: "Missing note id" }, { status: 400 });

    const noteId = Number(idStr);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: "Invalid note id" }, { status: 400 });

    // parse body
    const body = (await req.json().catch(() => ({} as any))) as { email?: string; role?: string } | any;
    const emailRaw = (body?.email ?? "").toString().trim().toLowerCase();
    const role = (body?.role ?? "editor").toString();

    if (!emailRaw) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // fetch note and check permission
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // requester must be owner OR editor on the note
    const isOwner = session.userId === note.userId;
    const requesterAccess = await prisma.noteAccess.findUnique({
      where: { noteId_userId: { noteId, userId: session.userId } },
    });

    if (!isOwner && (!requesterAccess || requesterAccess.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // find the invitee user by email (existing user required)
    const invitee = await prisma.user.findUnique({ where: { email: emailRaw } });
    if (!invitee) {
      return NextResponse.json({ error: "User with that email not found" }, { status: 404 });
    }

    // upsert NoteAccess for the invitee (create or update role)
    await prisma.noteAccess.upsert({
      where: { noteId_userId: { noteId, userId: invitee.id } },
      update: { role },
      create: { noteId, userId: invitee.id, role },
    });

    // return current accesses for the note (with user email/info)
    const accesses = await prisma.noteAccess.findMany({
      where: { noteId },
      select: {
        id: true,
        role: true,
        userId: true,
        user: { select: { id: true, email: true, displayName: true } },
      },
    });

    return NextResponse.json({ ok: true, accesses }, { status: 200 });
  } catch (err) {
    console.error("POST /api/notes/[id]/share error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
