import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.post.findFirst({
      where: { email }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ success:false, message: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ success: true }); 
  }catch (error) {
      console.error(error);
      return NextResponse.json({ success: false, message: 'Server error' }, {status: 500 });
    }
  }
