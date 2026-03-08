import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/auth/config";

export async function getUserSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    // Verifikasi token
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return payload;
  } catch (error) {
    // Jika token invalid atau expired, return null
    return null;
  }
}