import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { otpService, userService } = await import('@/lib/prisma/service');
    const { telegramService } = await import('@/lib/telegram/service');
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // 1. Cek User
    const user = await userService.getByPhone(phoneNumber);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.telegram_id) {
      return NextResponse.json(
        { success: false, message: 'Akun belum diverifikasi. Silakan kirim pesan /verify <NomorHP> ke Bot Telegram kami.' },
        { status: 400 }
      );
    }

    // 3. Generate kode OTP 6 digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Insert ke log via otpService
    await otpService.createLog(phoneNumber, otpCode, user.id);

    // --- TELEGRAM SENDING ---
    const message = `Halo ${user.full_name || 'User'}, Kode OTP Dashboard FTTH Anda adalah: <b>${otpCode}</b>. Berlaku 5 menit.`;
    
    const sent = await telegramService.sendTelegramMessage(user.telegram_id, message);
    
    if (!sent) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengirim OTP via Telegram. Pastikan Anda sudah terhubung dengan bot.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


