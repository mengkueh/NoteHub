// app/api/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;
    const password = body?.password;

    if (!rawEmail || !password) {
      return NextResponse.json({ error: "email/password required" }, { status: 400 });
    }

    const email = String(rawEmail).trim();

    // 查 user（只选必要字段）
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, email: true },
    });

    if (!user || !user.password) {
      // user 不存在，或没有本地密码
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // bcrypt 比对（安全）
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 生成 session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt,
      },
    });

    // 设置 HttpOnly cookie
    const isProd = process.env.NODE_ENV === "production";
    const maxAge = 7 * 24 * 60 * 60; // seconds

    const cookie = [
      `session=${sessionId}`,
      `Path=/`,
      `HttpOnly`,
      `Max-Age=${maxAge}`,
      `SameSite=Lax`,
      ...(isProd ? ["Secure"] : []),
    ].join("; ");

    const res = NextResponse.json({ message: "Login success" }, { status: 200 });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
