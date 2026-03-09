import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // 1. Ambil Secret Key DI DALAM fungsi agar Vercel tidak rewel saat build
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token.value, secret);
    
    if (!payload.id) {
        return NextResponse.json(
            { error: 'Invalid token payload' },
            { status: 401 }
        );
    }

    // 2. KUNCI: Dynamic import untuk Prisma service (Disembunyikan dari Build Vercel)
    const { userService } = await import('@/lib/prisma/service');

    // @ts-ignore: payload.id is unknown but we know it's there from login
    const user = await userService.getById(Number(payload.id));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return safe user data
    return NextResponse.json({
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}