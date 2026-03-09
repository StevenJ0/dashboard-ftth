import { prisma } from '@/lib/prisma/prisma';
import { userService, otpService, genericDBService } from '@/lib/prisma/service';
import { telegramService } from '@/lib/telegram/service';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/auth/config';

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
  }
};
