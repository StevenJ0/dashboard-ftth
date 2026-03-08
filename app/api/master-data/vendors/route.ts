import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const vendors = await prisma.dim_vendors.findMany({
      where: {
        OR: [
          { vendor_name: { contains: search, mode: 'insensitive' } },
          { vendor_code: { contains: search, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        vendor_name: 'asc',
      },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendor_code, vendor_name } = body;

    if (!vendor_code || !vendor_name) {
      return NextResponse.json(
        { error: 'Vendor code and name are required' },
        { status: 400 }
      );
    }

    // Check if duplicate
    const existing = await prisma.dim_vendors.findUnique({
      where: { vendor_code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Vendor code already exists' },
        { status: 400 }
      );
    }

    const newVendor = await prisma.dim_vendors.create({
      data: {
        vendor_code,
        vendor_name,
      },
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Vendor code is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { vendor_name } = body;

    if (!vendor_name) {
      return NextResponse.json(
        { error: 'Vendor name is required' },
        { status: 400 }
      );
    }

    const updatedVendor = await prisma.dim_vendors.update({
      where: { vendor_code: code },
      data: { vendor_name },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Vendor code is required' },
      { status: 400 }
    );
  }

  try {
    // Safety check: Is used in projects?
    const usageCount = await prisma.projects.count({
      where: { vendor_code: code },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete. Vendor is used in active projects' },
        { status: 400 }
      );
    }

    await prisma.dim_vendors.delete({
      where: { vendor_code: code },
    });

    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
