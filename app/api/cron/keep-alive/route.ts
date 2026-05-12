import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', {
        status: 401,
      });
    }

    // Execute a lightweight query to keep the database awake
    await prisma.$queryRawUnsafe('SELECT 1');

    return NextResponse.json(
      { success: true, message: 'Database is awake!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in keep-alive cron:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
