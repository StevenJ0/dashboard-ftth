import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json({ message: 'Missing Data' }, { status: 400 });
    }

    const result = await authService.confirmResetPassword(resetToken, newPassword);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal Error' },
      { status: 400 }
    );
  }
}
