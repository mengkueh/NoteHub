import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { id: 'desc' } });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const post = await prisma.post.create({
    data: { email, password },
  });

  return NextResponse.json(post, { status: 201 });
}
