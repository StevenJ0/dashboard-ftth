"use server";

import { prisma } from "@/lib/prisma/prisma";
import { DashboardData } from "@/types/dashboard";

const val = (n: any) => Number(n) || 0;

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);

export async function getDashboardData(): Promise<DashboardData> {
  // 1. Ambil Summary Agregat
  const summary = await prisma.project_items.aggregate({
    _sum: {
      pr_amount: true,
      po_amount: true,
      gr_amount: true,
      ir_amount: true,
    },
    _count: {
      id: true,
      pr_number: true,
      po_number: true,
      gr_date: true,
      ir_amount: true,
    },
  });

  // 2. WASPANG Logic (Plan vs On Going vs Go Live)
  const allItems = await prisma.project_items.findMany({
    select: {
      id: true,
      po_amount: true,
      pr_amount: true,
      po_number: true,
      status_tomps_stage: true,
      status_lapangan: true,
    },
  });

  let plan = { count: 0, value: 0 };
  let ongoing = { count: 0, value: 0 };
  let golive = { count: 0, value: 0 };

  allItems.forEach((item) => {
    const stage = (item.status_tomps_stage || "").toUpperCase();
    const lapangan = (item.status_lapangan || "").toUpperCase();
    const value = Number(item.po_amount) || Number(item.pr_amount) || 0;

    if (
      stage.includes("GO LIVE") ||
      stage.includes("BAST") ||
      lapangan.includes("LIVE") ||
      stage.includes("CLOSE")
    ) {
      golive.count++;
      golive.value += value;
    } else if (item.po_number && item.po_number.trim() !== "") {
      ongoing.count++;
      ongoing.value += value;
    } else {
      plan.count++;
      plan.value += value;
    }
  });

  // 3. Status Tomps (Group By Stage)
  const tompsRaw = await prisma.project_items.groupBy({
    by: ["status_tomps_stage"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // 4. Status SAP (Manual Construction) - hanya PO, GR, IR
  const statusSap = [
    {
      label: "PO",
      count: summary._count?.po_number ?? 0,
      value: val(summary._sum?.po_amount),
    },
    {
      label: "IR",
      count: summary._count?.ir_amount ?? 0,
      value: val(summary._sum?.ir_amount),
    },
    {
      label: "GR",
      count: summary._count?.gr_date ?? 0,
      value: val(summary._sum?.gr_amount),
    },
  ];

  // 5. Top Witel (Raw Query) - REFACTORED for project_items -> dim_locations -> dim_witels
  const topWitelRaw = await prisma.$queryRaw`
    SELECT 
      w.witel_name as name, 
      COUNT(pi.id) as lop_count, 
      SUM(pi.po_amount) as po_value 
    FROM project_items pi
    JOIN dim_locations l ON pi.location_id = l.id
    JOIN dim_witels w ON l.witel_id = w.id
    GROUP BY w.witel_name
    ORDER BY po_value DESC
    LIMIT 5;
  `;

  // 6. Top Program (Raw Query) - REFACTORED for project_items -> dim_programs
  const topProgramRaw = await prisma.$queryRaw`
    SELECT 
      pr.program_name as name, 
      SUM(pi.po_amount) as value
    FROM project_items pi
    JOIN dim_programs pr ON pi.program_id = pr.id
    GROUP BY pr.program_name
    ORDER BY value DESC
    LIMIT 5;
  `;

  // 6.5 Get unique filter options dari database
  // REFACTORED: Use project_items as base to ensure we only get options that are actually used
  const uniqueWitelRaw = await prisma.$queryRaw`
    SELECT DISTINCT w.witel_name
    FROM project_items pi
    JOIN dim_locations l ON pi.location_id = l.id
    JOIN dim_witels w ON l.witel_id = w.id
    WHERE w.witel_name IS NOT NULL AND w.witel_name != ''
    ORDER BY w.witel_name;
  `;

  const uniqueSubDistrictRaw = await prisma.$queryRaw`
    SELECT DISTINCT l.sub_district
    FROM project_items pi
    JOIN dim_locations l ON pi.location_id = l.id
    WHERE l.sub_district IS NOT NULL AND l.sub_district != ''
    ORDER BY l.sub_district;
  `;

  const uniqueWbsRaw = await prisma.$queryRaw`
    SELECT DISTINCT pi.wbs_id
    FROM project_items pi
    WHERE pi.wbs_id IS NOT NULL AND pi.wbs_id != ''
    ORDER BY pi.wbs_id;
  `;

  // 7. Table Data (All projects for filtering/rendering)
  const projects = await prisma.project_items.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      projects: true, // Header info (Name, Contract, Type)
      // DIMENSIONS are now on the ITEM
      dim_locations: {
        include: {
          dim_witels: {
            include: {
              dim_regionals: true,
            },
          },
        },
      },
      dim_vendors: true,
      dim_programs: true,
      dim_plants: true,
    },
  });

  // --- RETURN DATA ---
  return {
    kpi: {
      pr: val(summary._sum.pr_amount),
      po: val(summary._sum.po_amount),
      gr: val(summary._sum.gr_amount),
      ir: val(summary._sum.ir_amount),
    },
    waspang: {
      plan,
      ongoing,
      golive,
    },
    statusSap,
    statusTomps: tompsRaw.map((t) => ({
      label: t.status_tomps_stage ?? "N/A",
      count: t._count.id,
    })),
    gapAnalysis: [
      {
        label: "PR ke PO",
        value1: val(summary._sum.pr_amount),
        value2: val(summary._sum.po_amount),
        gap: val(summary._sum.pr_amount) - val(summary._sum.po_amount),
      },
      {
        label: "PO ke GR",
        value1: val(summary._sum.po_amount),
        value2: val(summary._sum.gr_amount),
        gap: val(summary._sum.po_amount) - val(summary._sum.gr_amount),
      },
      {
        label: "GR ke IR",
        value1: val(summary._sum.gr_amount),
        value2: val(summary._sum.ir_amount),
        gap: val(summary._sum.gr_amount) - val(summary._sum.ir_amount),
      },
    ],
    programSummary: (topProgramRaw as any[]).map((p: any) => ({
      name: p.name ?? "Others",
      value: Number(p.value),
    })),
    topWitel: (topWitelRaw as any[]).map((w: any) => ({
      name: w.name ?? "-",
      lop_count: Number(w.lop_count),
      po_value: Number(w.po_value),
    })),
    tableData: projects.map((p) => ({
      id: p.wbs_id ?? "",
      name: p.short_text ?? p.projects?.project_name ?? "-",
      // UPDATED MAPPING: Access dimensions from item 'p'
      witel: p.dim_locations?.dim_witels?.witel_name ?? "-",
      vendor: p.dim_vendors?.vendor_name ?? "-",
      value: formatRupiah(Number(p.po_amount ?? 0)),
      status: p.status_tomps_percent ?? "N/A",
      // Additional properties untuk filtering - convert Decimal to Number
      wbs_id: p.wbs_id ?? "",
      project_type: p.projects?.project_type ?? "",
      po_number: p.po_number ?? "",
      gr_date: p.gr_date ?? null,
      ir_amount: Number(p.ir_amount ?? 0),
      po_amount: Number(p.po_amount ?? 0),
      pr_amount: Number(p.pr_amount ?? 0),
      gr_amount: Number(p.gr_amount ?? 0),
      status_tomps_stage: p.status_tomps_stage ?? "",
      status_lapangan: p.status_lapangan ?? "",
      // UPDATED MAPPING: Access dimensions from item 'p'
      distrik: p.dim_locations?.dim_witels?.witel_name ?? "",
      sub_district: p.dim_locations?.sub_district ?? "",
      program: p.dim_programs?.program_name ?? "",
      pr_date: p.pr_date ? p.pr_date.toISOString() : null,
      po_date: p.po_date ? p.po_date.toISOString() : null,
      // Pass ID for precise updates if needed
      db_id: p.id, 
    })),
    filterOptions: {
      distrik: (uniqueWitelRaw as any[])
        .map((w: any) => w.witel_name)
        .filter((name: string) => name && name.trim() !== ""),
      subDistrik: (uniqueSubDistrictRaw as any[])
        .map((s: any) => s.sub_district)
        .filter((name: string) => name && name.trim() !== ""),
      wbs: (uniqueWbsRaw as any[])
        .map((w: any) => w.wbs_id || w.wbs)
        .filter((id: string) => id && id.trim() !== ""),
    },
  };
}

