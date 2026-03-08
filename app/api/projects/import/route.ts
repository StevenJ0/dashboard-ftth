import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { prisma } from '@/lib/prisma/prisma';
import * as XLSX from 'xlsx';

// --- TYPE DEFINITIONS ---
interface CacheStore {
    regionals: Map<string, number>; // Name -> ID
    witels: Map<string, number>;    // "RegionalID-WitelName" -> ID
    vendors: Set<string>;           // Code
    plants: Set<string>;            // Code
    programs: Map<string, number>;  // ProgramName -> ID
}

// --- HELPERS ---

const cleanCurrency = (val: string | number | undefined): number | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return val;

  const str = val.toString();
  let cleanStr = str.replace(/[^\d.,-]/g, '');

  if (cleanStr.includes(',') && cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
     cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (cleanStr.includes('.') && cleanStr.indexOf(',') < cleanStr.indexOf('.')) {
     cleanStr = cleanStr.replace(/,/g, '');
  } else {
     cleanStr = cleanStr.replace(/,/g, '');
  }
  
  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
};

const parsePercent = (val: string | number | undefined): number => {
  if (val === undefined || val === null || val === '') return 0;
  
  let num: number;
  if (typeof val === 'number') {
      num = val;
  } else {
      const str = val.toString();
      const match = str.match(/(\d+)/);
      const floatVal = parseFloat(str);
      if (!isNaN(floatVal) && !str.includes('%')) {
          num = floatVal;
      } else {
          num = match ? parseInt(match[1]) : 0;
      }
  }

  if (!isNaN(num) && num <= 1 && num > 0) return num * 100;
  if (!isNaN(num) && num > 1) return num;

  return 0;
};

const parseDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569)*86400*1000));
        return date;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // --- STEP 1: Parse with XLSX ---
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return NextResponse.json({ success: false, error: 'No worksheet found' }, { status: 400 });
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawData.length === 0) return NextResponse.json({ success: false, error: 'Empty sheet' }, { status: 400 });

    // --- STEP 2: Header Normalization ---
    const normalizedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toUpperCase();
            newRow[cleanKey] = row[key];
        });
        return newRow;
    });

    console.log(`Processing ${normalizedData.length} rows...`);

    let successCount = 0;
    let failCount = 0;

    // --- CACHE INITIALIZATION ---
    const cache: CacheStore = {
        regionals: new Map(),
        witels: new Map(),
        vendors: new Set(),
        plants: new Set(),
        programs: new Map()
    };
    
    // --- STEP 3: Process Data Row by Row ---
    for (const row of normalizedData) {
        const getVal = (key: string) => row[key];
        const wbsId = getVal('WBS');

        if (!wbsId) continue; // Skip empty rows

        try {
            // ==========================================
            // A. DIMENSIONS (Location, Vendor, Plant)
            // ==========================================

            // 1. REGIONAL
            const regNameRaw = getVal('WITEL');
            const regName = regNameRaw ? String(regNameRaw).trim() : ''; 
            let regionalId: number | null = null;
            
            if (regName) {
                if (cache.regionals.has(regName)) {
                    regionalId = cache.regionals.get(regName)!;
                } else {
                    const r = await prisma.dim_regionals.upsert({
                        where: { regional_name: regName },
                        create: { regional_name: regName },
                        update: {}
                    });
                    regionalId = r.id;
                    cache.regionals.set(regName, regionalId);
                }
            }

            // 2. WITEL
            const witelNameRaw = getVal('WITEL2');
            const witelName = witelNameRaw ? String(witelNameRaw).trim() : '';
            let witelId: number | null = null;
            
            if (witelName && regionalId) {
                const witelCacheKey = `${regionalId}-${witelName}`;
                if (cache.witels.has(witelCacheKey)) {
                    witelId = cache.witels.get(witelCacheKey)!;
                } else {
                    const w = await prisma.dim_witels.findFirst({ 
                        where: { witel_name: witelName, regional_id: regionalId }
                    });
                    
                    if (w) {
                        witelId = w.id;
                    } else {
                        const newW = await prisma.dim_witels.create({
                            data: { witel_name: witelName, regional_id: regionalId }
                        });
                        witelId = newW.id;
                    }
                    cache.witels.set(witelCacheKey, witelId);
                }
            }

            // 3. LOCATION
            const subDistRaw = getVal('SUB DISTRICT');
            const portRawVal = getVal('PORT');
            
            const dbSubDist = subDistRaw ? String(subDistRaw).trim() : null;
            const dbPort = (portRawVal !== undefined && portRawVal !== '') ? String(portRawVal).trim() : null;
            
            let locId: number | null = null;
            if (witelId) {
                 const loc = await prisma.dim_locations.findFirst({
                    where: { 
                        witel_id: witelId, 
                        sub_district: dbSubDist, 
                        port_location: dbPort 
                    }
                 });

                 if (loc) {
                    locId = loc.id;
                 } else {
                    if (dbSubDist || dbPort) {
                        const newL = await prisma.dim_locations.create({
                            data: {
                                witel_id: witelId,
                                sub_district: dbSubDist,
                                port_location: dbPort
                            }
                        });
                        locId = newL.id;
                    }
                 }
            }

            // 4. VENDOR
            const vCodeRaw = getVal('VENDOR');
            const vNameRaw = getVal('NAME OF VENDOR');
            let fkVendor: string | null = null;

            if (vCodeRaw) {
                const svCode = String(vCodeRaw).trim();
                fkVendor = svCode; 
                const svName = vNameRaw ? String(vNameRaw).trim() : null;

                if (!cache.vendors.has(svCode)) {
                    await prisma.dim_vendors.upsert({
                        where: { vendor_code: svCode },
                        create: { vendor_code: svCode, vendor_name: svName },
                        update: { vendor_name: svName }
                    });
                    cache.vendors.add(svCode);
                }
            }

            // 5. PLANT
            const pCodeRaw = getVal('PLANT');
            let fkPlant: string | null = null;
            
            if (pCodeRaw) {
                 const spCode = String(pCodeRaw).trim();
                 fkPlant = spCode;
                 
                 if (!cache.plants.has(spCode)) {
                    await prisma.dim_plants.upsert({ 
                        where: { plant_code: spCode }, 
                        update: {}, 
                        create: { plant_code: spCode }
                    });
                    cache.plants.add(spCode);
                 }
            }

            // 6. PROGRAM
            const programNameRaw = getVal('WBS DESC') || getVal('PROGRAM NAME');
            const programName = programNameRaw ? String(programNameRaw).trim() : '';
            let fkProgramId: number | null = null;

            if (programName) {
                if (cache.programs.has(programName)) {
                    fkProgramId = cache.programs.get(programName)!;
                } else {
                    const existingProg = await prisma.dim_programs.findFirst({
                        where: { program_name: programName }
                    });

                    if (existingProg) {
                        fkProgramId = existingProg.id;
                    } else {
                        const newProg = await prisma.dim_programs.create({
                            data: { program_name: programName }
                        });
                        fkProgramId = newProg.id;
                    }
                    cache.programs.set(programName, fkProgramId);
                }
            }

            // ==========================================
            // B. PROJECT HEADER (projects)
            // ==========================================
            const sWbsId = String(wbsId).trim(); // Primary Key
            const contractDate = parseDate(getVal('CONTRACT DATE'));
            
            const projName = getVal('DESCRIPTION PROJECT') ? String(getVal('DESCRIPTION PROJECT')).trim() : null;
            const contractNum = getVal('CONTRACT NUMBER') ? String(getVal('CONTRACT NUMBER')).trim() : null;
            const identProj = getVal('IDENTIFICATION PROJECT') ? String(getVal('IDENTIFICATION PROJECT')).trim() : null;
            const projectType = getVal('CO / NEW') ? String(getVal('CO / NEW')).trim() : null;
            
            await prisma.projects.upsert({
                where: { wbs_id: sWbsId },
                update: {
                    project_name: projName,
                    contract_number: contractNum,
                    contract_date: contractDate,
                    identification_project: identProj,
                    project_type: projectType,
                },
                create: {
                    wbs_id: sWbsId,
                    project_name: projName,
                    contract_number: contractNum,
                    contract_date: contractDate,
                    identification_project: identProj,
                    project_type: projectType,
                }
            });

            // ==========================================
            // C. PROJECT ITEMS (project_items)
            // ==========================================
            const prNum = getVal('PR NUMBER') ? String(getVal('PR NUMBER')).trim() : null;
            const poNum = getVal('PO NUMBER') ? String(getVal('PO NUMBER')).trim() : null;
            const shortTxt = getVal('SHORT TEXT') ? String(getVal('SHORT TEXT')).trim() : null;

            const existingItem = await prisma.project_items.findFirst({
                where: {
                    wbs_id: sWbsId,
                    pr_number: prNum || undefined,
                    po_number: poNum || undefined,
                    short_text: shortTxt || undefined
                }
            });

            const itemData = {
                wbs_id: sWbsId,
                pr_number: prNum,
                po_number: poNum,
                short_text: shortTxt,
                
                // DATA INJECTION: Location, Vendor, Plant, Program
                location_id: locId, 
                vendor_code: fkVendor,
                plant_code: fkPlant,
                program_id: fkProgramId,
                
                // Financials & Dates
                pr_amount: cleanCurrency(getVal('DOC. TOTAL AMOUNT PR')),
                po_amount: cleanCurrency(getVal('DOC. TOTAL AMOUNT PO')),
                gr_amount: cleanCurrency(getVal('DOC. AMOUNT')),
                ir_amount: cleanCurrency(getVal('DOC. AMOUNT2')),
                
                pr_date: parseDate(getVal('PR DATE')),
                po_date: parseDate(getVal('PO DATE')),
                delivery_date: parseDate(getVal('DELIVERY DATE')),
                gr_date: parseDate(getVal('POSTING DATE GR')),
                
                // Status
                status_lapangan: getVal('STATUS PEKERJAAN') ? String(getVal('STATUS PEKERJAAN')).trim() : null,
                status_tomps_percent: getVal('STATUS TOMPS (%)') ? String(getVal('STATUS TOMPS (%)')).trim() : null,
                status_tomps_stage: getVal('STATUS TOMPS (TAHAPAN)') ? String(getVal('STATUS TOMPS (TAHAPAN)')).trim() : null,
                progress_percent: parsePercent(getVal('STATUS TOMPS (%)')),
            };

            if (existingItem) {
                await prisma.project_items.update({ where: { id: existingItem.id }, data: itemData });
            } else {
                await prisma.project_items.create({ data: itemData });
            }

            successCount++;
        } catch (error: any) {
            failCount++;
            console.error(`Error processing WBS ${wbsId}:`, error.message);
        }
    }

    return NextResponse.json({ 
        success: true, 
        count: successCount,
        successCount, 
        failCount,
        message: `Import processed. Success: ${successCount}, Failed: ${failCount}`
    });

  } catch (error) {
    console.error('Import FATAL Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to import Excel file' }, { status: 500 });
  }
}