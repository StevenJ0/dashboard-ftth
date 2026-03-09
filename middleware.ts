import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/auth/config";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/auth/login", "/auth/register"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  if (isAuthRoute) {
    if (session) {
      try {
        await jwtVerify(session, JWT_SECRET);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
