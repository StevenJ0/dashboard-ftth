import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const regional_id = searchParams.get('regional_id');

    if (type === 'regionals') {
      const regionals = await prisma.dim_regionals.findMany({
        orderBy: { regional_name: 'asc' },
      });
      return NextResponse.json(regionals);
    }

    if (type === 'witels') {
      const whereClause = regional_id ? { regional_id: parseInt(regional_id) } : {};
      
      const witels = await prisma.dim_witels.findMany({
        where: whereClause,
        orderBy: { witel_name: 'asc' },
      });
      return NextResponse.json(witels);
    }

    if (type === 'programs') {
      const programs = await prisma.dim_programs.findMany({
        orderBy: { program_name: 'asc' },
      });
      return NextResponse.json(programs);
    }

    if (type === 'plants') {
      const plants = await prisma.dim_plants.findMany({
        orderBy: { plant_code: 'asc' },
      });
      return NextResponse.json(plants);
    }

    return NextResponse.json({ error: 'Invalid type param' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching options:', error);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  }
}
