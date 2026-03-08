import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const { phoneNumber, otpCode, rememberMe } = await req.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP code are required' },
        { status: 400 }
      );
    }

    // Call Service
    const result = await authService.verifyOtp(phoneNumber, otpCode, rememberMe);

    // Set Cookie
    const response = NextResponse.json({ 
        success: true, 
        message: 'Verification success',
        user: result.user 
    });

    response.cookies.set('token', result.token, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production', // true in prod
        maxAge: result.cookieMaxAge, // undefined (session) or calculated seconds
        sameSite: 'strict'
    });

    return response;

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Verification failed' },
      { status: 400 } // Or 500 depending on error, but mostly 400 for logic issues
    );
  }
}


