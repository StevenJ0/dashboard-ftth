  import { NextRequest, NextResponse } from "next/server";

  export const dynamic = "force-dynamic";
  import { prisma } from "@/lib/prisma/prisma";
  import { generateProjectMessage } from "@/lib/telegram/formatter";

  export async function POST(req: NextRequest) {
    console.log("Webhook hit");
    try {
      const body = await req.json();

      // 1. Validation: Request body must contain message
      if (!body.message) {
        return NextResponse.json({ ok: true });
      }

      const chatId = body.message.chat?.id || null;
      const text = body.message.text as string | undefined;
      const contact = body.message.contact;

      // --- PRE-GATEKEEPER COMMANDS --- 
      // Scenario 1: User sent /verify <phone_number>
      const lowerText = text ? text.toLowerCase().trim() : "";

      if (lowerText.startsWith("/verify")) {
        const parts = text!.trim().split(/\s+/);
        if (parts.length < 2) {
          await replyMessage(chatId, "Format salah. Gunakan: <code>/verify [Nomor_HP]</code>");
          return NextResponse.json({ ok: true });
        }

        const phoneNumber = parts[1];
        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        // Logic 08 format support
        let localPhone = normalizedPhone;
        if (localPhone.startsWith("62")) {
            localPhone = "0" + localPhone.slice(2);
        }

        // DB Search: Find a user in users table
        const matchedUser = await prisma.users.findFirst({
          where: {
            OR: [
              { phone_number: normalizedPhone },
              { phone_number: phoneNumber },
              { phone_number: localPhone },
            ]
          }
        });

        if (matchedUser) {
          if (!chatId) {
            return NextResponse.json({ success: false, message: "Chat ID tidak dapat dimuat" }, { status: 400 });
          }

          // Check for Duplicate Telegram ID in other accounts
          const existingOwner = await prisma.users.findUnique({
            where: { telegram_id: chatId.toString() }
          });

          if (existingOwner && existingOwner.id !== matchedUser.id) {
            await replyMessage(
              chatId, 
              `⚠️ <b>Peringatan:</b> Akun Telegram ini sudah terhubung dengan nomor HP lain (${existingOwner.phone_number}). Satu akun Telegram hanya bisa digunakan untuk satu akun website.`
            );
            return NextResponse.json({ ok: true });
          }

          try {
            // Update user: set telegram_id and is_verified = true
            await prisma.users.update({
              where: { id: matchedUser.id },
              data: { 
                telegram_id: chatId.toString(),
                is_verified: true
              },
            });

            await replyMessage(chatId, "✅ Verifikasi berhasil! Akun Anda kini sudah aktif dan terhubung dengan Telegram. Silakan kembali ke website untuk Login.");
          } catch (updateError: any) {
            if (updateError.code === 'P2002') {
               await replyMessage(chatId, "⚠️ <b>Peringatan:</b> Akun Telegram ini sudah digunakan oleh pengguna lain. Silakan gunakan akun telegram yang belum tertaut.");
            } else {
               console.error("Error updating verification status:", updateError);
               await replyMessage(chatId, "❌ Terjadi kesalahan internal saat memproses verifikasi Anda.");
            }
          }
        } else {
          // No Match
          await replyMessage(chatId, "❌ Verifikasi gagal. Nomor HP tersebut belum terdaftar. Pastikan Anda sudah melakukan registrasi di website terlebih dahulu.");
        }
        
        return NextResponse.json({ ok: true });
      }

      // --- GATEKEEPER START ---
      
      // Step A: Check Existing Authorization
      const user = await prisma.users.findUnique({
        where: { telegram_id: chatId ? chatId.toString() : "" },
      });

      if (!user || !user.is_verified) {
        // Step B: Handle Unauthorized Users
        
        // Scenario 2: User sent TEXT/COMMAND (but is not authorized)
        await replyMessage(
          chatId, 
          "🔒 <b>Akses Terbatas.</b>\nSistem tidak mengenali Anda. Silakan verifikasi Nomor HP untuk melanjutkan. Ketik /verify [Nomor_HP_Anda]"
        );
        
        return NextResponse.json({ ok: true });
      }

      // --- GATEKEEPER END ---

      // Authorized Flow: Proceed to Command Handling
      if (!text) {
        // If no text (e.g. sticker, photo) and already authorized, just ignore or reply generic.
        return NextResponse.json({ ok: true });
      }

      // 2. Command Handling

      if (lowerText === "/start" || lowerText === "/help") {
        const welcomeMessage = 
  `👋 <b>Halo! Selamat Datang di Dashboard Project</b>

  Bot ini membantu Anda memonitor status project secara Real-time.

  <b>Command List:</b>
  /cek [WBS ID] - Cek progress project (Contoh: <code>/cek Q-24001</code>).
  /help - Tampilkan pesan ini lagi.`;

        await replyMessage(chatId, welcomeMessage);
      } else if (text.startsWith("/cek")) {
        const parts = text.trim().split(/\s+/); // Split by whitespace to handle multiple spaces
        
        // Check format: /cek [WBS_ID]
        if (parts.length < 2) {
          await replyMessage(chatId, "Format salah. Gunakan: <code>/cek [WBS_ID]</code>");
          return NextResponse.json({ ok: true });
        }

        const wbsId = parts[1];

        // 3. Database Query
        const project = await prisma.projects.findUnique({
          where: { wbs_id: wbsId },
          include: {
            project_items: {
              orderBy: {
                updated_at: "desc",
              },
              take: 1,
              include: {
                dim_vendors: true,
                dim_locations: {
                  include: {
                    dim_witels: {
                        include: { dim_regionals: true }
                    },
                  },
                },
              }
            },
          },
        });

        if (!project) {
          await replyMessage(chatId, "Data not found");
        } else {
          // Format Response
          const latestItem = project.project_items?.[0] || null;
          const message = generateProjectMessage(project, latestItem);

          await replyMessage(chatId, message);
        }
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Error handling Telegram webhook:", error);
      // Return 200 to prevent Telegram from retrying in case of internal logic error
      return NextResponse.json({ ok: true }); 
    }
  }

  async function replyMessage(chatId: number | string, text: string, replyMarkup?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    try {
      const body: any = {
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
      };

      if (replyMarkup) {
          body.reply_markup = replyMarkup;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to send Telegram message:", errorData);
      }

    } catch (error) {
      console.error("Error sending Telegram message:", error);
    }
  }

  function normalizePhoneNumber(phone: string): string {
    // Remove spaces, dashes, or non-digits (excluding + if we want to handle it manually, but \D strips + too)
    // Prompt says: Remove spaces or dashes. If it starts with 0, replace with 62. If it starts with +62, remove +.
    
    // Step 1: Remove all non-digits. This handles spaces, dashes, and the '+' sign.
    // Input: "+62 812-345" -> "62812345"
    // Input: "0812 345" -> "0812345"
    let cleaned = phone.replace(/\D/g, ""); 

    // Step 2: Handle leading 0
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }

    // If input was "+62...", replace(/\D/g) made it "62...", so it's already correct.
    
    return cleaned;
  }
