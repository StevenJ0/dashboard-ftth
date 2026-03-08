import { prisma } from '@/lib/prisma/prisma';
import { userService, otpService, genericDBService } from '@/lib/prisma/service';
import { telegramService } from '@/lib/telegram/service';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET, JWT_RESET_SECRET } from '@/lib/auth/config';

export const authService = {
  /**
   * Handle User Registration or Re-registration
   * Checks if user exists. If verified -> Error. If unverified -> Reuse. If new -> Create.
   */
  async registerUser(data: { fullName: string; phoneNumber: string; password?: string }) {
    const { fullName, phoneNumber, password } = data;
    
    // 1. Cek Database
    const existingUser = await userService.getByPhone(phoneNumber);
    let userId: number;

    if (existingUser) {
      // SKENARIO 1: User Sudah Ada & is_verified = true
      if (existingUser.is_verified) {
        throw new Error("Nomor sudah terdaftar. Silakan Login.");
      }

      // SKENARIO 2: User Sudah Ada & is_verified = false (Kasus Re-Register)
      // Reuse user tersebut.
      userId = existingUser.id;

      // Update data user (misal password baru atau nama baru jika diinput)
      // Kita update nama dan password hash jika ada password baru
      const updateData: any = { full_name: fullName };
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 10);
      }
      
      await genericDBService.updateData('users', userId, updateData);

    } else {
      // SKENARIO 3: User Belum Ada (New User)
      if (!password) {
          throw new Error("Password wajib diisi untuk pendaftaran baru.");
      }
      const passwordHash = await bcrypt.hash(password, 10);
      
      const newUser = await userService.create({
        full_name: fullName,
        phone_number: phoneNumber,
        password_hash: passwordHash,
        role: 'USER',
        is_verified: false,
      });

      userId = newUser.id;
    }

    // Proses Lanjutan (Common Flow)
    // Registration now requires users to verify via Telegram Bot directly.
    // No explicit OTP is sent during registration.

    return {
      success: true,
      userId,
      message: 'User registered. Please verify your phone number via Telegram Bot to continue.',
    };
  },

  /**
   * Verify OTP & Login (Support Remember Me)
   */
  async verifyOtp(phoneNumber: string, otpCode: string, rememberMe: boolean = false) {
    // 1. Cari data valid
    const otpLog = await otpService.findValidLog(phoneNumber, otpCode);

    if (!otpLog) {
       throw new Error("Invalid or Expired OTP");
    }

    // 2. Mark as Is Used
    await otpService.markAsUsed(otpLog.id);

    // 3. Update User Verified 
    // Need user info for JWT
    let userId = otpLog.user_id;
    let user; 
    
    if (userId) {
        user = await userService.getById(userId);
        await genericDBService.updateData('users', userId, { is_verified: true });
    } else {
        user = await userService.getByPhone(phoneNumber);
        if (user) {
            userId = user.id;
            await genericDBService.updateData('users', user.id, { is_verified: true });
        }
    }

    if (!user || !userId) {
        throw new Error("User associated with OTP not found");
    }

    // 4. Generate Session Token (JWT)
    const token = await new SignJWT({ 
        id: user.id, 
        name: user.full_name, 
        role: user.role,
        phone: user.phone_number
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(rememberMe ? '7d' : '24h') // 7 hari jika remember me
    .sign(JWT_SECRET);

    // Return token and cookie config info
    return {
        success: true,
        token,
        cookieMaxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined, // seconds (7 days) or undefined (session)
        user: { id: user.id, name: user.full_name, role: user.role }
    };
  },

  /**
   * Request Reset Password
   */
  async requestResetPassword(phoneNumber: string) {
    const user = await userService.getByPhone(phoneNumber);
    if (!user) {
        throw new Error("Nomor tidak terdaftar");
    }

    if (!user.telegram_id) {
        throw new Error("Akun belum diverifikasi. Silakan kirim pesan /verify <NomorHP> ke Bot Telegram kami.");
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log OTP
    await otpService.createLog(phoneNumber, otpCode, user.id);

    // Send Telegram Notification
    const message = `Halo ${user.full_name}, Kode Reset Password Dashboard FTTH Anda adalah: <b>${otpCode}</b>. Berlaku 5 menit. JANGAN BERIKAN KODE INI KE SIAPAPUN.`;
    const sent = await telegramService.sendTelegramMessage(user.telegram_id, message);
    
    if (!sent) {
        throw new Error("Gagal mengirim OTP via Telegram. Pastikan Anda sudah terhubung dengan bot.");
    }

    return { success: true, message: 'OTP Reset sent' };
  },

  /**
   * Verify Reset OTP
   */
  async verifyResetOtp(phoneNumber: string, otpCode: string) {
    const otpLog = await otpService.findValidLog(phoneNumber, otpCode);
    if (!otpLog) {
        throw new Error("Invalid or Expired OTP");
    }
    
    // We do NOT mark used yet? Usually we wait for confirm.
    // Or we mark used now to prevent reuse?
    // Safe bet: Mark used now, issue a Reset Token.
    await otpService.markAsUsed(otpLog.id);

    // User check
    const userId = otpLog.user_id; // Should exist
    if (!userId) throw new Error("User not found in OTP log");

    // Generate Reset Token (Short lived)
    const resetToken = await new SignJWT({ 
        userId: userId, 
        type: 'RESET_PASSWORD' 
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m') // 15 mins
    .sign(JWT_RESET_SECRET);

    return { success: true, resetToken };
  },

  /**
   * Confirm New Password
   */
  async confirmResetPassword(resetToken: string, newPassword: string) {
    try {
        const { payload } = await jwtVerify(resetToken, JWT_RESET_SECRET);
        
        if (payload.type !== 'RESET_PASSWORD' || !payload.userId) {
            throw new Error("Invalid Token Type");
        }

        const userId = payload.userId as number;
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update Password
        await genericDBService.updateData('users', userId, { password_hash: passwordHash });

        return { success: true, message: "Password berhasil diubah" };
    } catch (error) {
        throw new Error("Token Invalid or Expired");
    }
  }
};

