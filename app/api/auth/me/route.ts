import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/auth/config';
import { userService } from '@/lib/prisma/service';

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
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    
    if (!payload.id) {
        return NextResponse.json(
            { error: 'Invalid token payload' },
            { status: 401 }
        );
    }

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
