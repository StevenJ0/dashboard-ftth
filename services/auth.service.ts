import { prisma } from '@/lib/prisma/prisma';
import { userService, genericDBService } from '@/lib/prisma/service';
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
        role: 'STAFF',
        is_verified: false,
      });

      userId = newUser.id;
    }

    // Proses Lanjutan (Common Flow)
    // Registration requires users to verify via Telegram Bot directly.
    // User must send /verify <PhoneNumber> to the bot to activate their account.

    return {
      success: true,
      userId,
      message: 'User registered. Please verify your phone number via Telegram Bot to continue.',
    };
  },
};
