import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { prisma } from '@/lib/prisma/prisma';
import { Prisma } from '@prisma/client';

// GET: List Locations (Paginated & Filtered)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const regional_id = searchParams.get('regional_id');
    const witel_id = searchParams.get('witel_id');

    const skip = (page - 1) * limit;

    const whereClause: Prisma.dim_locationsWhereInput = {
      AND: [
        search ? { 
            OR: [
                { sub_district: { contains: search, mode: 'insensitive' } },
                { port_location: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        witel_id ? { witel_id: parseInt(witel_id) } : {},
        regional_id ? { dim_witels: { regional_id: parseInt(regional_id) } } : {}
      ]
    };

    const [totalItems, items] = await prisma.$transaction([
      prisma.dim_locations.count({ where: whereClause }),
      prisma.dim_locations.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          dim_witels: {
            include: { dim_regionals: true }
          },
          _count: {
             select: { project_items: true }
          }
        },
        orderBy: { id: 'desc' },
      }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST: Create Location
export async function POST(request: Request) {
  try {
    const { witel_id, sub_district, port_location } = await request.json();
    if (!witel_id || !sub_district) return NextResponse.json({ error: 'Witel ID and Sub District required' }, { status: 400 });
    
    // Check duplicate logic if strict? Maybe allow duplicate sub_district name but different witel.
    
    const newLoc = await prisma.dim_locations.create({
      data: { 
        witel_id: parseInt(witel_id),
        sub_district,
        port_location 
      },
    });
    return NextResponse.json(newLoc);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

// PUT: Update Location
export async function PUT(request: Request) {
  try {
    const { id, witel_id, sub_district, port_location } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await prisma.dim_locations.update({
      where: { id },
      data: { 
        witel_id: witel_id ? parseInt(witel_id) : undefined,
        sub_district,
        port_location 
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// DELETE: Safe Delete Location
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check dependency: Projects
    const projectCount = await prisma.project_items.count({ where: { location_id: id } });
    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete Location. It is used by ${projectCount} active Projects.` }, 
        { status: 400 }
      );
    }

    await prisma.dim_locations.delete({ where: { id } });
    return NextResponse.json({ message: 'Location deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
