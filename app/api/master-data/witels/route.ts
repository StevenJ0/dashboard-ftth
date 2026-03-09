import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
// GET: List Witels
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const witels = await prisma.dim_witels.findMany({
      include: {
        dim_regionals: true,
        _count: {
            select: { dim_locations: true }
        }
      },
      orderBy: { witel_name: 'asc' },
    });
    return NextResponse.json(witels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch witels' }, { status: 500 });
  }
}

// POST: Create Witel
export async function POST(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { witel_name, regional_id } = await request.json();
    if (!witel_name || !regional_id) return NextResponse.json({ error: 'Name and Regional ID required' }, { status: 400 });
    
    const newWitel = await prisma.dim_witels.create({
      data: { 
        witel_name, 
        regional_id: parseInt(regional_id) 
      },
    });
    return NextResponse.json(newWitel);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create witel' }, { status: 500 });
  }
}

// PUT: Update Witel
export async function PUT(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { id, witel_name, regional_id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await prisma.dim_witels.update({
      where: { id },
      data: { 
        witel_name, 
        regional_id: regional_id ? parseInt(regional_id) : undefined 
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update witel' }, { status: 500 });
  }
}

// DELETE: Safe Delete Witel
export async function DELETE(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check dependency: Locations
    const locCount = await prisma.dim_locations.count({ where: { witel_id: id } });
    if (locCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete Witel. It has ${locCount} active Locations.` }, 
        { status: 400 }
      );
    }

    await prisma.dim_witels.delete({ where: { id } });
    return NextResponse.json({ message: 'Witel deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete witel' }, { status: 500 });
  }
}
