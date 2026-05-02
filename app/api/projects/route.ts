import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { Prisma } from '@prisma/client';
import { sendTelegramMessage } from '@/lib/telegram';
import { getUserRole, isManager } from '@/lib/auth/role';

// Helper to format currency (unused in API but kept for reference)
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return null;
  return amount;
};

// Helper: Get or Create Location (Refactored for Normalized Schema)
const getOrCreateLocation = async (witel_id: number | null, sub_district: string | null, port_location: string | null) => {
  const { prisma } = await import('@/lib/prisma/prisma');
  if (!witel_id && !sub_district && !port_location) return null;
  
  // Normalize: Trim string, treat empty string as null
  const cleanSub = sub_district && sub_district.trim() !== "" ? sub_district.trim() : null;
  const cleanPort = port_location && port_location.trim() !== "" ? port_location.trim() : null;
  
  // Find strictly matching location
  // We explicitly pass 'null' to matching rows where sub_district or port is null
  const existing = await prisma.dim_locations.findFirst({
    where: { 
      witel_id: witel_id || undefined, 
      sub_district: cleanSub, 
      port_location: cleanPort,
    },
  });

  if (existing) return existing.id;

  // Create new location
  const newLoc = await prisma.dim_locations.create({
    data: { 
      witel_id: witel_id, 
      sub_district: cleanSub, 
      port_location: cleanPort
    },
  });
  return newLoc.id;
};

// Helper: Get or Create Plant
const getOrCreatePlant = async (plant_code: string | null) => {
  const { prisma } = await import('@/lib/prisma/prisma');
  if (!plant_code) return null;

  const existing = await prisma.dim_plants.findUnique({ where: { plant_code } });
  if (existing) return existing.plant_code;

  await prisma.dim_plants.create({ data: { plant_code } });
  return plant_code;
};

// Helper: Get or Create Vendor
const getOrCreateVendor = async (vendor_name: string | null) => {
  const { prisma } = await import('@/lib/prisma/prisma');
  if (!vendor_name) return null;

  // Try to find by Name first
  const existingByName = await prisma.dim_vendors.findFirst({
    where: { vendor_name },
  });
  if (existingByName) return existingByName.vendor_code;

  // Generate Code if new
  const generatedCode = vendor_name.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
  
  // Check if code exists (collision check)
  const existingByCode = await prisma.dim_vendors.findUnique({
    where: { vendor_code: generatedCode },
  });
  if (existingByCode) return existingByCode.vendor_code;

  // Create new
  await prisma.dim_vendors.create({
    data: { vendor_code: generatedCode, vendor_name },
  });
  return generatedCode;
};

// GET: Read All Data (with Pagination & Search)
export async function GET(request: Request) {
  try {
    const { prisma } = await import('@/lib/prisma/prisma');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build Filter
    const whereClause: Prisma.project_itemsWhereInput = search
      ? {
          OR: [
            { short_text: { contains: search, mode: 'insensitive' } },
            { wbs_id: { contains: search, mode: 'insensitive' } },
            {
              projects: {
                project_name: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : {};

    // Transaction for Count & Fetch
    const [totalItems, items] = await prisma.$transaction([
      prisma.project_items.count({ where: whereClause }),
      prisma.project_items.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          projects: { // Header info
             select: {
                project_name: true,
                contract_number: true,
                contract_date: true,
                identification_project: true,
                project_type: true
             }
          },
          // Dimensions are now HERE in items
          dim_locations: {
            include: {
              dim_witels: { // Note: Relation name in schema might be 'dim_witels' or 'witel'. Checking schema... 
                            // Schema says: `dim_witels dim_witels? @relation...` 
                            // Wait, looking at schema provided earlier:
                            // model dim_locations { ... witel dim_witels? ... } -> Field is 'witel' or 'dim_witels'?
                            // Let's use the field name from schema.prisma: `dim_witels` based on user's recent file diff, 
                            // BUT standard naming often uses `witel`. 
                            // Checking file `d:\Kuliah\PKL\proyek-pkl-ftth\src\prisma\schema.prisma`:
                            // `dim_witels    dim_witels?     @relation(fields: [witel_id], references: [id], onDelete: Cascade)`
                            // So the field name is `dim_witels`.
                include: {
                  dim_regionals: true // Schema: `dim_regionals dim_regionals @relation...`
                }
              }
            }
          },
          dim_plants: true,
          dim_vendors: true,
          dim_programs: true,
        },
        orderBy: {
          id: 'asc',
        },
      }),
    ]);

    const flatData = items.map((item) => {
      // Logic Parsing Percentage from String (status_tomps_percent)
      const statusString = item.status_tomps_percent || "";
      const match = statusString.match(/(\d+)%/); // Find digits followed by %
      const percentValue = match ? parseInt(match[1]) : 0;
      
      const loc = item.dim_locations;
      const witel = loc?.dim_witels;
      const regional = witel?.dim_regionals;

      return {
        id: item.id,
        // Project (Header) Data
        wbs_id: item.wbs_id,
        project_name: item.projects?.project_name ?? null,
        identification_project: item.projects?.identification_project ?? null,
        project_type: item.projects?.project_type ?? null,
        contract_number: item.projects?.contract_number ?? null,
        contract_date: item.projects?.contract_date ?? null,
        
        // Updated Mapping for Nested Relation from ITEM
        regional_id: regional?.id ?? null,
        regional: regional?.regional_name ?? null,
        witel_id: witel?.id ?? null,
        witel: witel?.witel_name ?? null,
        
        // Map sub_district and port_location for UI editing
        sub_district: loc?.sub_district ?? null,
        port_location: loc?.port_location ?? null,
        
        plant: item.dim_plants?.plant_code ?? null,
        program_id: item.program_id ?? null,
        program_name: item.dim_programs?.program_name ?? null,
        vendor_code: item.dim_vendors?.vendor_code ?? null,
        vendor_name: item.dim_vendors?.vendor_name ?? null,
        
        // Item Data
        pr_number: item.pr_number,
        po_number: item.po_number,
        pr_amount: item.pr_amount ? Number(item.pr_amount) : null,
        po_amount: item.po_amount ? Number(item.po_amount) : null,
        gr_amount: item.gr_amount ? Number(item.gr_amount) : null,
        ir_amount: item.ir_amount ? Number(item.ir_amount) : null,
        short_text: item.short_text,
        status_lapangan: item.status_lapangan,
        status_tomps: item.status_tomps_stage, 
        progress_percent: item.progress_percent ? Number(item.progress_percent) : percentValue, 
        original_status_text: statusString, 

        // Other potentially useful fields
        pr_date: item.pr_date,
        po_date: item.po_date,
        delivery_date: item.delivery_date,
        gr_date: item.gr_date,
      };
    });

    return NextResponse.json({
      data: flatData,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: Create New Data
export async function POST(request: Request) {
  try {
    const role = await getUserRole();
    if (!isManager(role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Manager yang dapat menambah data.' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma/prisma');
    const body = await request.json();
    const {
      wbs_id, project_name, 
      regional_id, witel_id, sub_district, port_location,
      plant_code, vendor_name, vendor_code,
      program_id,
      contract_number, contract_date, identification_project, project_type,
      pr_number, po_number, pr_amount, po_amount, short_text, status_lapangan, status_tomps, progress_percent,
      pr_date, po_date, delivery_date, gr_date, gr_amount, ir_amount
    } = body;

    // --- Validasi Input Wajib ---
    if (!wbs_id) return NextResponse.json({ error: 'WBS ID is required' }, { status: 400 });
    if (!short_text || String(short_text).trim() === '') {
      return NextResponse.json({ error: 'ID Project (Short Text) wajib diisi' }, { status: 400 });
    }

    // --- Cek Duplikasi Primary Key (short_text) ---
    const existingItem = await prisma.project_items.findUnique({
      where: { short_text: String(short_text).trim() },
    });
    if (existingItem) {
      return NextResponse.json(
        { error: `ID Project '${short_text}' sudah terdaftar. Gunakan ID yang berbeda.` },
        { status: 400 }
      );
    }

    // 1. Handle Dimensions
    const parsedWitelId = witel_id ? parseInt(witel_id) : null;
    const parsedProgramId = program_id ? parseInt(program_id) : null;
    
    const locationId = await getOrCreateLocation(parsedWitelId, sub_district, port_location);
    const validPlantCode = await getOrCreatePlant(plant_code);
    
    let validVendorCode = null;
    if (vendor_code) {
       validVendorCode = vendor_code;
    } else {
       validVendorCode = await getOrCreateVendor(vendor_name);
    }

    // 2. Upsert Project (Header ONLY)
    const projectData = {
      project_name,
      contract_number,
      contract_date: contract_date ? new Date(contract_date) : null,
      identification_project,
      project_type
    };

    const existingProject = await prisma.projects.findUnique({ where: { wbs_id } });

    if (existingProject) {
      await prisma.projects.update({
        where: { wbs_id },
        data: projectData,
      });
    } else {
      await prisma.projects.create({
        data: { wbs_id, ...projectData },
      });
    }

    // 3. Create Project Item (With Dimensions)
    const newItem = await prisma.project_items.create({
      data: {
        wbs_id,
        short_text: String(short_text).trim(), // Primary Key
        pr_number,
        po_number,
        location_id: locationId,
        plant_code: validPlantCode,
        vendor_code: validVendorCode,
        program_id: parsedProgramId,
        pr_amount: pr_amount ? new Prisma.Decimal(pr_amount) : null,
        po_amount: po_amount ? new Prisma.Decimal(po_amount) : null,
        gr_amount: gr_amount ? new Prisma.Decimal(gr_amount) : null,
        ir_amount: ir_amount ? new Prisma.Decimal(ir_amount) : null,
        status_lapangan,
        status_tomps_stage: status_tomps,
        progress_percent: progress_percent ? parseFloat(progress_percent) : 0,
        pr_date: pr_date ? new Date(pr_date) : null,
        po_date: po_date ? new Date(po_date) : null,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        gr_date: gr_date ? new Date(gr_date) : null,
      },
    });

    try {
      const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sendTelegramMessage(`🚀 *PROYEK BARU TERDAFTAR*\n\n*ID Project:* \`${short_text}\`\n*Nama Proyek:* ${project_name || 'N/A'}\n*Waktu:* ${timeStr}`);
    } catch (telegramError) {
      console.error('⚠️ Telegram Error on CREATE:', telegramError);
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating data:', error);
    return NextResponse.json({ error: 'Failed to create data' }, { status: 500 });
  }
}

// PUT: Update Data (Full Item Update)
export async function PUT(request: Request) {
  try {
    const role = await getUserRole();
    if (!isManager(role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Manager yang dapat mengubah data.' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma/prisma');
    const body = await request.json();
    const {
      short_text, wbs_id, project_name, 
      regional_id, witel_id, sub_district, port_location,
      plant_code, vendor_name, vendor_code,
      program_id,
      contract_number, contract_date, identification_project, project_type,
      pr_number, po_number, pr_amount, po_amount, status_lapangan, status_tomps, progress_percent,
      pr_date, po_date, delivery_date, gr_date, gr_amount, ir_amount
    } = body;

    // short_text adalah Primary Key — wajib ada untuk update
    if (!short_text) return NextResponse.json({ error: 'ID Project (short_text) is required for update' }, { status: 400 });

    // 0. Fetch Existing Data (for Notification Logic)
    const currentItem = await prisma.project_items.findUnique({
      where: { short_text },
      select: { progress_percent: true, status_tomps_stage: true }
    });

    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 1. Prepare Dimensions
    const parsedWitelId = witel_id ? parseInt(witel_id) : null;
    const parsedProgramId = program_id ? parseInt(program_id) : null;
    const locationId = await getOrCreateLocation(parsedWitelId, sub_district, port_location);
    const validPlantCode = await getOrCreatePlant(plant_code);
    
    let validVendorCode = null;
    if (vendor_code) {
       validVendorCode = vendor_code;
    } else {
       validVendorCode = await getOrCreateVendor(vendor_name);
    }

    // 2. Update Project Item (where: short_text = Primary Key)
    await prisma.project_items.update({
      where: { short_text },  // ← Gunakan short_text sebagai identifier
      data: {
        pr_number,
        po_number,
        // short_text TIDAK dimasukkan ke data — tidak boleh mengubah Primary Key
        location_id: locationId ?? undefined,
        plant_code: validPlantCode ?? undefined,
        vendor_code: validVendorCode ?? undefined,
        program_id: parsedProgramId ?? undefined,
        pr_amount: pr_amount ? new Prisma.Decimal(pr_amount) : null,
        po_amount: po_amount ? new Prisma.Decimal(po_amount) : null,
        gr_amount: gr_amount ? new Prisma.Decimal(gr_amount) : null,
        ir_amount: ir_amount ? new Prisma.Decimal(ir_amount) : null,
        status_lapangan,
        status_tomps_stage: status_tomps, 
        progress_percent: progress_percent ? parseFloat(progress_percent) : undefined,
        pr_date: pr_date ? new Date(pr_date) : null,
        po_date: po_date ? new Date(po_date) : null,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        gr_date: gr_date ? new Date(gr_date) : null,
      },
    });

    // 3. Update Header if WBS provided
    if (wbs_id) {
        await prisma.projects.update({
          where: { wbs_id }, 
          data: {
            project_name,
            contract_number,
            contract_date: contract_date ? new Date(contract_date) : null,
            identification_project,
            project_type
          },
        });
    }

    try {
      const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const oldProgress = currentItem.progress_percent || 0;
      const newProgress = progress_percent ? parseFloat(progress_percent) : oldProgress;
      
      const oldStatus = currentItem.status_tomps_stage || 'N/A';
      const newStatus = status_tomps || oldStatus;

      if (oldStatus !== newStatus) {
         await sendTelegramMessage(`🔄 *PERUBAHAN STATUS*\n\n*ID Project:* \`${short_text}\`\n*Status Lama:* ${oldStatus}\n*Status Baru:* ${newStatus}\n*Waktu:* ${timeStr}`);
      }
      
      if (oldProgress !== newProgress) {
         await sendTelegramMessage(`📊 *UPDATE PROGRES*\n\n*ID Project:* \`${short_text}\`\n*Progres Lama:* ${oldProgress}%\n*Progres Baru:* ${newProgress}%\n*Waktu:* ${timeStr}`);
      }
    } catch (telegramError) {
      console.error('⚠️ Telegram Error on UPDATE:', telegramError);
    }

    return NextResponse.json({ message: 'Data updated successfully' });

  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

// PATCH: Quick Update Status
export async function PATCH(request: Request) {
  try {
    const role = await getUserRole();
    if (!isManager(role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Manager yang dapat mengubah status.' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma/prisma');
    const body = await request.json();
    const { short_text, status_tomps, progress_percent } = body;

    if (!short_text) return NextResponse.json({ error: 'ID Project (short_text) is required' }, { status: 400 });

    // 1. Fetch Existing Data (for Notification Logic)
    const currentItem = await prisma.project_items.findUnique({
      where: { short_text: String(short_text).trim() },
      select: { progress_percent: true, status_tomps_stage: true }
    });

    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 2. Prepare Update Data
    const updateData: any = {};
    if (status_tomps !== undefined) updateData.status_tomps_stage = status_tomps;
    if (progress_percent !== undefined) updateData.progress_percent = parseFloat(progress_percent);

    // 3. Update Status in DB
    const updatedItem = await prisma.project_items.update({
      where: { short_text: String(short_text).trim() },
      data: updateData,
    });

    try {
      const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const oldProgress = currentItem.progress_percent || 0;
      const newProgress = updatedItem.progress_percent || 0;
      
      const oldStatus = currentItem.status_tomps_stage || 'N/A';
      const newStatus = updatedItem.status_tomps_stage || 'N/A';

      if (oldStatus !== newStatus) {
         await sendTelegramMessage(`🔄 *PERUBAHAN STATUS*\n\n*ID Project:* \`${short_text}\`\n*Status Lama:* ${oldStatus}\n*Status Baru:* ${newStatus}\n*Waktu:* ${timeStr}`);
      }
      
      if (oldProgress !== newProgress) {
         await sendTelegramMessage(`📊 *UPDATE PROGRES*\n\n*ID Project:* \`${short_text}\`\n*Progres Lama:* ${oldProgress}%\n*Progres Baru:* ${newProgress}%\n*Waktu:* ${timeStr}`);
      }
    } catch (telegramError) {
      console.error('⚠️ Telegram Error on PATCH:', telegramError);
    }

    return NextResponse.json({ message: 'Status updated successfully' });

  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// DELETE: Delete Data
export async function DELETE(request: Request) {
  try {
    const role = await getUserRole();
    if (!isManager(role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Manager yang dapat menghapus data.' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma/prisma');
    const { searchParams } = new URL(request.url);
    // Gunakan short_text (Primary Key) sebagai identifier delete
    const shortText = searchParams.get('short_text');

    if (!shortText) {
      return NextResponse.json({ error: 'short_text (ID Project) is required' }, { status: 400 });
    }

    // 1. Get item untuk mengetahui WBS sebelum delete
    const item = await prisma.project_items.findUnique({
      where: { short_text: shortText },
      select: { wbs_id: true }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    // 2. Delete Item berdasarkan short_text
    await prisma.project_items.delete({
      where: { short_text: shortText },
    });

    // 3. Jika tidak ada item tersisa pada project induk, hapus juga header-nya
    if (item.wbs_id) {
      const remainingItems = await prisma.project_items.count({
        where: { wbs_id: item.wbs_id },
      });

      if (remainingItems === 0) {
        await prisma.projects.delete({
          where: { wbs_id: item.wbs_id },
        });
      }
    }

    try {
      const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sendTelegramMessage(`⚠️ *PERINGATAN*\n\nProyek dengan ID Project \`${shortText}\` telah dihapus dari sistem.\n*Waktu:* ${timeStr}`);
    } catch (telegramError) {
      console.error('⚠️ Telegram Error on DELETE:', telegramError);
    }

    return NextResponse.json({ message: 'Data deleted successfully' });

  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
