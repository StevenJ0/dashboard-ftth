import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phoneNumber, password } = body;

    // Basic validation
    if (!fullName || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Mohon lengkapi semua data' },
        { status: 400 }
      );
    }

    const result = await authService.registerUser({ fullName, phoneNumber, password });

    return NextResponse.json(
      { 
        message: 'Registrasi berhasil. Silakan verifikasi akun Anda melalui Bot Telegram sebelum login.',
        otpSent: false,
        phoneNumber: phoneNumber
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific error messages threw by service
    if (error.message === "Nomor sudah terdaftar. Silakan Login.") {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}


