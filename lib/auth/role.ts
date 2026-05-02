import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/auth/config";

/**
 * Extracts the user's role from the session JWT cookie.
 * Returns the role string (e.g., "MANAGER", "STAFF", "USER") or null if unauthenticated.
 */
export async function getUserRole(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return (payload.role as string) || null;
  } catch {
    return null;
  }
}

/**
 * Checks if the user has MANAGER role.
 * Treats "USER" (legacy) and "STAFF" as non-manager roles.
 */
export function isManager(role: string | null): boolean {
  return role === "MANAGER";
}
