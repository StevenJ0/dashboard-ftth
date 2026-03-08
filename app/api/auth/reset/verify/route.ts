import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const { phoneNumber, otpCode } = await req.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({ message: 'Missing Data' }, { status: 400 });
    }

    const result = await authService.verifyResetOtp(phoneNumber, otpCode);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal Error' },
      { status: 400 }
    );
  }
}
