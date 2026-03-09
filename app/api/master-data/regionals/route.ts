import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
// GET: List Regionals with Witel Count
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const regionals = await prisma.dim_regionals.findMany({
      include: {
        _count: {
          select: { dim_witels: true },
        },
      },
      orderBy: { regional_name: 'asc' },
    });
    return NextResponse.json(regionals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch regionals' }, { status: 500 });
  }
}

// POST: Create Regional
export async function POST(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { regional_name } = await request.json();
    if (!regional_name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    
    const newReg = await prisma.dim_regionals.create({
      data: { regional_name },
    });
    return NextResponse.json(newReg);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create regional' }, { status: 500 });
  }
}

// PUT: Update Regional
export async function PUT(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { id, regional_name } = await request.json();
    if (!id || !regional_name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    const updated = await prisma.dim_regionals.update({
      where: { id },
      data: { regional_name },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update regional' }, { status: 500 });
  }
}

// DELETE: Safe Delete Regional
export async function DELETE(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check dependency: Witels
    const witelCount = await prisma.dim_witels.count({ where: { regional_id: id } });
    if (witelCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete Regional. It has ${witelCount} active Witels.` }, 
        { status: 400 }
      );
    }

    await prisma.dim_regionals.delete({ where: { id } });
    return NextResponse.json({ message: 'Regional deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete regional' }, { status: 500 });
  }
}
