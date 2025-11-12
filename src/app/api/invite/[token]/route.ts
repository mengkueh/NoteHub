// app/api/invite/[token]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("session")?.value ?? null;
  if (!sid) return null;
  const s = await prisma.session.findUnique({ where: { id: sid } });
  if (!s || s.expiresAt < new Date()) return null;
  return s;
}

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = params.token;
    const invite = await prisma.noteInvite.findUnique({ where: { id: token } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

    // ensure the invite email matches logged in user's email
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.email || user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
      return NextResponse.json({ error: "Invite email does not match your account" }, { status: 403 });
    }

    // upsert access
    await prisma.noteAccess.upsert({
      where: { noteId_userId: { noteId: invite.noteId, userId: session.userId } },
      update: { role: invite.role },
      create: { noteId: invite.noteId, userId: session.userId, role: invite.role },
    });

    await prisma.noteInvite.update({ where: { id: token }, data: { accepted: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("accept invite error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
