import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.json({ message: 'Logout successful' });
}
