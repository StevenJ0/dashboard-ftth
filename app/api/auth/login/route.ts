import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

    const { phoneNumber, password, rememberMe } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Nomor HP dan Password wajib diisi' },
        { status: 400 }
      );
    }

    // 🚀 INI KUNCINYA: Dynamic Import! 
    // Prisma baru akan di-load saat ada user login, BUKAN saat Vercel melakukan build.
    const { userService } = await import('@/lib/prisma/service');

    const user = await userService.getByPhone(phoneNumber);

    if (!user) {
      return NextResponse.json(
        { error: 'Nomor HP atau Password salah' },
        { status: 401 }
      );
    }

    if (!user.is_verified || !user.telegram_id) {
      return NextResponse.json(
        { success: false, message: "Akun Anda belum diverifikasi atau belum terhubung dengan Telegram. Silakan chat bot kami dengan format: /verify <NomorHP>" },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Nomor HP atau Password salah" },
        { status: 401 },
      );
    }

    const expirationTime = rememberMe ? '7d' : '24h';
    const cookieMaxAge = rememberMe ? 7 * 24 * 60 * 60 : undefined;

    const token = await new SignJWT({ 
        id: user.id, 
        name: user.full_name, 
        role: user.role,
        phone: user.phone_number
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expirationTime) 
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        message: "Login berhasil",
        user: { id: user.id, name: user.full_name, role: user.role },
      },
      { status: 200 },
    );

    response.cookies.set('session', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: cookieMaxAge, 
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}