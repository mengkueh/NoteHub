// src/app/api/_debug/trace/route.ts  (dev-only)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get("session")?.value ?? null;

    // quick DB calls to force any schema/client errors
    const tags = await prisma.tag.findMany({ take: 3 });
    const notes = await prisma.note.findMany({ take: 3 });

    return NextResponse.json({ ok: true, sid, tagsCount: tags.length, notesCount: notes.length });
  } catch (err: any) {
    console.error("DEBUG /api/_debug/trace error:", err);
    // return detailed error only in dev
    return NextResponse.json({ ok: false, message: String(err?.message), stack: err?.stack?.split("\n").slice(0,10) }, { status: 500 });
  }
}
