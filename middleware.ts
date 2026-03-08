import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Kita ambil SECRET langsung di sini agar Middleware tetap ringan (Edge Compatible)
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Ini hanya fallback saat build, pastikan di Vercel env sudah terisi
    return new TextEncoder().encode("default-secret-key-12345");
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Tentukan rute mana yang harus diproteksi
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isAuthPage = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register");

  // 1. JIKA AKSES DASHBOARD
  if (isDashboardPage) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      // Verifikasi token menggunakan 'jose' (Ringan & Cepat)
      await jwtVerify(session, getJwtSecretKey());
      return NextResponse.next();
    } catch (error) {
      // Jika token tidak valid atau expired, tendang ke login
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.delete("session"); // Bersihkan cookie rusak
      return response;
    }
  }

  // 2. JIKA AKSES HALAMAN LOGIN/REGISTER (Padahal sudah login)
  if (isAuthPage) {
    if (session) {
      try {
        await jwtVerify(session, getJwtSecretKey());
        // Jika sesi masih valid, langsung lempar ke dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        // Jika sesi basi, biarkan mereka di halaman login
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

// Konfigurasi Matcher: Tentukan rute mana saja yang akan dilewati middleware ini
export const config = {
  matcher: [
    /*
     * Cocokkan semua request path kecuali yang dimulai dengan:
     * - api (API routes) -> Biarkan API punya proteksi internal sendiri agar Build Vercel lancar
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};