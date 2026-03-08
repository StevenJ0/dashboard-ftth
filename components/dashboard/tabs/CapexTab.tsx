import { useMemo, useState } from "react";
import { DashboardData } from "@/types/dashboard";
import { formatMoney } from "./formatUtils";
import CapexFilters, { CapexFilterState } from "./CapexFilters";
import { DonutChart, PRPOGRIRChart, GapAnalysisChart, AverageDurationChart, AveragePODurationChart, AverageGRDurationChart, DetailLOPTable } from "./chartComponents";

const COLORS = [
  "bg-red-600",    // Telkom Red
  "bg-blue-500",   // Telkom Blue
  "bg-slate-500",  // Telkom Dark/Gray
  "bg-orange-400",
  "bg-purple-500",
  "bg-lime-500",
];


// Program Category Colors
const CATEGORY_COLORS: Record<string, string> = {
  FBB: "bg-blue-500",
  HEM: "bg-lime-500",
  NIQE: "bg-purple-500",
  QE: "bg-orange-400",
  Others: "bg-slate-400",
};

// Helper to categorize program name into FBB/HEM/NIQE/QE
const categorizeProgram = (programName: string): string => {
  const p = (programName || "").toUpperCase();
  if (p.includes("FBB")) return "FBB";
  if (p.includes("HEM")) return "HEM";
  if (p.includes("NIQE")) return "NIQE";
  if (p.includes("QE")) return "QE";
  return "Others";
};

// Helper to map program name to color
const getProgramColor = (program: string, index: number) => {
  const p = program.toUpperCase();
  if (p.includes("FBB")) return "bg-blue-500";
  if (p.includes("QE")) return "bg-orange-400";
  if (p.includes("NIQE")) return "bg-purple-500";
  if (p.includes("HEM")) return "bg-lime-500";
  if (p.includes("FIMO")) return "bg-cyan-500";
  return COLORS[index % COLORS.length];
};

export default function CapexTab({ data }: { data: DashboardData }) {
  // --- STATE FILTERS ---
  const [filters, setFilters] = useState<CapexFilterState>({
    distrik: [],
    subDistrik: [],
    wbs: [],
    typeCapex: [],
  });

  // --- 1. EXTRACT OPTIONS FOR FILTERS ---
  const availableOptions = useMemo(() => {
    if (data.filterOptions) {
      return data.filterOptions;
    }

    const distriksSet = new Set<string>();
    const subDistriksSet = new Set<string>();
    const wbsSet = new Set<string>();

    data.tableData.forEach((row) => {
      // Clean and add Distrik
      const d = (row.distrik || row.witel || "").trim();
      if (d && d !== "-" && d !== "undefined") distriksSet.add(d);

      // Clean and add Sub Distrik
      const sd = (row.sub_district || row.sub_distrik || "").trim();
      if (sd && sd !== "-" && sd !== "undefined") subDistriksSet.add(sd);

      // Clean and add WBS
      const w = (row.wbs_id || row.wbs || "").trim();
      if (w && w !== "-" && w !== "undefined") wbsSet.add(w);
    });

    return {
      distrik: Array.from(distriksSet).sort(),
      subDistrik: Array.from(subDistriksSet).sort(),
      wbs: Array.from(wbsSet).sort(),
    };
  }, [data.tableData, data.filterOptions]);

  // --- 2. FILTER TABLE DATA ---
  const filteredTableData = useMemo(() => {
    return data.tableData.filter((row) => {
      // 1. Filter Type Capex (CO / NEW)
      if (filters.typeCapex.length > 0) {
        const rowTypeRaw = (row.project_type || "").toUpperCase();
        const rowType = rowTypeRaw === "CO#2025" ? "CO" : "NEW";
        if (!filters.typeCapex.includes(rowType)) return false;
      }

      // 2. Filter Distrik
      if (filters.distrik.length > 0) {
        const rowDistrik = (row.distrik || row.witel || "").trim();
        if (!filters.distrik.includes(rowDistrik)) return false;
      }

      // 3. Filter Sub Distrik
      if (filters.subDistrik.length > 0) {
        const rowSubDistrik = (
          row.sub_district ||
          row.sub_distrik ||
          ""
        ).trim();
        if (!filters.subDistrik.includes(rowSubDistrik)) return false;
      }

      // 4. Filter WBS
      if (filters.wbs.length > 0) {
        // WBS filter match partial or exact? usually exact from dropdown, but check implementation
        // Here we assume exact match on ID or description if that's what's in the option
        // But logic in options was wbs_id.
        const rowWbs = (row.wbs_id || row.wbs || "").trim();
        if (!filters.wbs.includes(rowWbs)) return false;
      }

      return true;
    });
  }, [data.tableData, filters]);

  // --- 3. RE-CALCULATE AGGREGATED DATA ---
  const aggregatedData = useMemo(() => {
    // Initial accumulation - TOTAL
    let pr = 0;
    let po = 0;
    let gr = 0;
    let ir = 0;

    // CO specific
    let coPr = 0;
    let coPo = 0;
    let coGr = 0;
    let coIr = 0;

    // NEW specific
    let newPr = 0;
    let newPo = 0;
    let newGr = 0;
    let newIr = 0;

    const programMap = new Map<string, number>();
    const coProgramMap = new Map<string, number>();
    const newProgramMap = new Map<string, number>();
    
    // NEW: Category distribution map (FBB/HEM/NIQE/QE)
    const categoryMap = new Map<string, { count: number; value: number }>();
    
    let coTotal = 0;
    let newTotal = 0;

    filteredTableData.forEach((row) => {
      // Value conversions
      const prVal = Number(row.pr_amount) || 0;
      const poVal = Number(row.po_amount) || 0;
      const grVal = Number(row.gr_amount) || 0;
      const irVal = Number(row.ir_amount) || 0;
      const val = poVal > 0 ? poVal : prVal; // Use PO if available, else PR (Plan)

      // Total aggregation
      pr += prVal;
      if (row.po_number || poVal > 0) po += poVal;
      if (row.gr_date || grVal > 0) gr += grVal;
      if (irVal > 0) ir += irVal;

      // Program Summary Aggregation
      const progName = row.program || row.project_type || "Others";
      
      // Total Map
      programMap.set(progName, (programMap.get(progName) || 0) + val);

      // CO vs NEW Map
      const typeRaw = (row.project_type || "").toUpperCase();
      const isCo = typeRaw === "CO#2025" || typeRaw === "CO";
      
      if (isCo) {
        coProgramMap.set(progName, (coProgramMap.get(progName) || 0) + val);
        coTotal += val;
        // CO specific PR/PO/GR/IR
        coPr += prVal;
        if (row.po_number || poVal > 0) coPo += poVal;
        if (row.gr_date || grVal > 0) coGr += grVal;
        if (irVal > 0) coIr += irVal;
      } else {
        newProgramMap.set(progName, (newProgramMap.get(progName) || 0) + val);
        newTotal += val;
        // NEW specific PR/PO/GR/IR
        newPr += prVal;
        if (row.po_number || poVal > 0) newPo += poVal;
        if (row.gr_date || grVal > 0) newGr += grVal;
        if (irVal > 0) newIr += irVal;
      }

      // NEW: Aggregate by category (FBB/HEM/NIQE/QE)
      const category = categorizeProgram(progName);
      const existing = categoryMap.get(category) || { count: 0, value: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        value: existing.value + val,
      });
    });

    // Determine Top Programs from TOTAL data to enforce consistent ordering/coloring if desired
    // Or just sort each map independently. Screenshot shows consistent legend, but maybe not consistent sort order?
    // Let's sort each by value desc.
    
    const formatChartData = (map: Map<string, number>) => {
      return Array.from(map.entries())
        .map(([name, value], idx) => ({
          label: name,
          value,
          color: getProgramColor(name, idx),
        }))
        .sort((a, b) => b.value - a.value);
    };

    const programSummary = formatChartData(programMap);
    const coData = formatChartData(coProgramMap);
    const newData = formatChartData(newProgramMap);

    // NEW: Format category data for donut chart
    const categoryOrder = ["FBB", "HEM", "NIQE", "QE", "Others"];
    const categoryData = categoryOrder
      .map((cat) => ({
        label: cat,
        value: categoryMap.get(cat)?.count || 0,
        totalValue: categoryMap.get(cat)?.value || 0,
        color: CATEGORY_COLORS[cat] || "bg-slate-400",
      }))
      .filter((cat) => cat.value > 0); // Only show categories with data

    // Gap Analysis Calculation - TOTAL
    const gapPrPo = Math.max(0, pr - po);
    const gapPoGr = Math.max(0, po - gr);
    const gapGrIr = Math.max(0, gr - ir);

    // Gap Analysis - CO
    const coGapPrPo = Math.max(0, coPr - coPo);
    const coGapPoGr = Math.max(0, coPo - coGr);
    const coGapGrIr = Math.max(0, coGr - coIr);

    // Gap Analysis - NEW
    const newGapPrPo = Math.max(0, newPr - newPo);
    const newGapPoGr = Math.max(0, newPo - newGr);
    const newGapGrIr = Math.max(0, newGr - newIr);

    const gapAnalysis = {
      total: { prPo: gapPrPo, poGr: gapPoGr, grIr: gapGrIr },
      co: { prPo: coGapPrPo, poGr: coGapPoGr, grIr: coGapGrIr },
      new: { prPo: newGapPrPo, poGr: newGapPoGr, grIr: newGapGrIr },
    };

    // NEW: Calculate Average PR Duration (PR Date -> PO Date) per Program
    const prDurationMap = new Map<string, { totalDays: number; count: number }>();

    filteredTableData.forEach((item: any) => {
      // Check if PR Date and PO Date exist
      if (item.pr_date && item.po_date) {
        const prDate = new Date(item.pr_date);
        const poDate = new Date(item.po_date);
        
        // Calculate difference in days
        const diffTime = poDate.getTime() - prDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        // Only include if valid positive duration (or zero)
        if (diffDays >= 0) {
          const programName = item.program || "Unknown Program";
          
          const existing = prDurationMap.get(programName) || { totalDays: 0, count: 0 };
          prDurationMap.set(programName, {
            totalDays: existing.totalDays + diffDays,
            count: existing.count + 1,
          });
        }
      }
    });

    // Transform map to array and sort by duration descending
    const averageDurationData = Array.from(prDurationMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.totalDays / data.count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 for readability

    // NEW: Calculate Average PO Duration (PO Date -> GR Date) per Program
    const poDurationMap = new Map<string, { totalDays: number; count: number }>();

    filteredTableData.forEach((item: any) => {
      // Check if PO Date and GR Date exist
      if (item.po_date && item.gr_date) {
        const poDate = new Date(item.po_date);
        const grDate = new Date(item.gr_date);
        
        // Calculate difference in days
        const diffTime = grDate.getTime() - poDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        // Only include if valid positive duration (or zero)
        if (diffDays >= 0) {
          const programName = item.program || "Unknown Program";
          
          const existing = poDurationMap.get(programName) || { totalDays: 0, count: 0 };
          poDurationMap.set(programName, {
            totalDays: existing.totalDays + diffDays,
            count: existing.count + 1,
          });
        }
      }
    });

    // Transform map to array and sort by duration descending
    const averagePODurationData = Array.from(poDurationMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.totalDays / data.count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 for readability

    // NEW: Calculate Average GR Duration (GR Date -> IR Date) per Program
    const grDurationMap = new Map<string, { totalDays: number; count: number }>();

    filteredTableData.forEach((item: any) => {
      // Check if GR Date and IR Date exist
      if (item.gr_date && item.ir_date) {
        const grDate = new Date(item.gr_date);
        const irDate = new Date(item.ir_date);
        
        // Calculate difference in days
        const diffTime = irDate.getTime() - grDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        // Only include if valid positive duration (or zero)
        if (diffDays >= 0) {
          const programName = item.program || "Unknown Program";
          
          const existing = grDurationMap.get(programName) || { totalDays: 0, count: 0 };
          grDurationMap.set(programName, {
            totalDays: existing.totalDays + diffDays,
            count: existing.count + 1,
          });
        }
      }
    });

    // Transform map to array and sort by duration descending
    const averageGRDurationData = Array.from(grDurationMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.totalDays / data.count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 for readability

    // NEW: Generate Detail LOP data
    const detailLopData = filteredTableData.map((item: any) => ({
      distrik: item.distrik || item.witel || '',
      subDistrik: item.sub_district || item.sub_distrik || '',
      idIhld: item.id_ihld || '',
      namaLop: item.short_text || item.lop_name || '',
      statusTomps: item.status_tomps_stage || item.status_tomps || '',
      wbs: item.program || item.wbs_desc || '',
      nilaiBoqPlan: parseFloat(item.pr_amount) || 0,
    }));

    return {
      kpi: { pr, po, gr, ir },
      coKpi: { pr: coPr, po: coPo, gr: coGr, ir: coIr },
      newKpi: { pr: newPr, po: newPo, gr: newGr, ir: newIr },
      gapAnalysis,
      programSummary,
      coData,
      newData,
      coTotal,
      newTotal,
      categoryData,
      averageDurationData, // Return the new data
      averagePODurationData, // PO-GR duration data
      averageGRDurationData, // GR-IR duration data
      detailLopData, // Detail LOP table data
    };

  }, [filteredTableData]);

  // Derived values for visualization
  const { kpi, averageDurationData, averagePODurationData, averageGRDurationData, detailLopData } = aggregatedData;



  return (
    <div className="space-y-6 pb-10">
      {/* 1. FILTER BAR */}
      <CapexFilters
        onFilterChange={setFilters}
        availableOptions={availableOptions}
      />

      {/* 2. THREE COLUMN DONUT CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL */}
        <DonutSection
          title="TOTAL"
          data={aggregatedData.categoryData}
          totalValue={aggregatedData.kpi.pr} // Using PR as total base or calculate total? Existing code uses kpi.pr usually.
        />
        {/* CO */}
        <DonutSection
          title="CARRY OVER 2024" 
          data={aggregatedData.coData} 
          totalValue={aggregatedData.coTotal}
        />
        {/* NEW */}
        <DonutSection 
          title="NEW 2025" 
          data={aggregatedData.newData} 
          totalValue={aggregatedData.newTotal}
        />
      </div>

      {/* 2.5 PROGRAM CATEGORY DISTRIBUTION */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-600 py-3 text-center">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">
            Distribusi Program (FBB/HEM/NIQE/QE)
          </h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Donut Chart */}
          <div className="flex-shrink-0">
            <DonutChart
              data={aggregatedData.categoryData.map((cat) => ({
                label: cat.label,
                value: cat.value,
                color: cat.color,
              }))}
              size={200}
              thickness={45}
            />
          </div>

          {/* Stats Table */}
          <div className="flex-1 max-w-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 font-semibold">Kategori</th>
                  <th className="py-2 font-semibold text-center">Jumlah</th>
                  <th className="py-2 font-semibold text-right">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.categoryData.map((cat, idx) => {
                  const totalCount = aggregatedData.categoryData.reduce(
                    (sum, c) => sum + c.value,
                    0
                  );
                  const percentage =
                    totalCount > 0
                      ? ((cat.value / totalCount) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${cat.color}`}
                          ></div>
                          <span className="font-medium text-slate-700">
                            {cat.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-900">
                        {cat.value.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 text-slate-700">Total</td>
                  <td className="py-3 text-center text-slate-900">
                    {aggregatedData.categoryData
                      .reduce((sum, c) => sum + c.value, 0)
                      .toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-1 bg-blue-100 rounded-full text-xs font-semibold text-blue-700">
                      100%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 3. HORIZONTAL BAR CHARTS: REALISASI ANGGARAN (PR-PO-GR-IR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL PR-PO-GR-IR */}
        <PRPOGRIRChart
          title="TOTAL PR-PO-GR-IR"
          data={aggregatedData.kpi}
        />

        {/* CO PR-PO-GR-IR */}
        <PRPOGRIRChart
          title="PR-PO-GR-IR CO 2024"
          data={aggregatedData.coKpi}
        />

        {/* NEW PR-PO-GR-IR */}
        <PRPOGRIRChart
          title="PR-PO-GR-IR NEW 2025"
          data={aggregatedData.newKpi}
        />
      </div>

      {/* 4. GAP ANALYSIS - THREE COLUMN CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL Gap */}
        <GapAnalysisChart
          title="GAP PR-PO-GR-IR"
          data={aggregatedData.gapAnalysis.total}
        />

        {/* CO Gap */}
        <GapAnalysisChart
          title="GAP PR-PO-GR-IR CO 2024"
          data={aggregatedData.gapAnalysis.co}
        />

        {/* NEW Gap */}
        <GapAnalysisChart
          title="GAP PR-PO-GR-IR NEW 2025"
          data={aggregatedData.gapAnalysis.new}
        />
      </div>

      {/* 5. AVERAGE PR DURATION CHART */}
      <AverageDurationChart
        data={averageDurationData}
        height={400} 
      />

      {/* 6. AVERAGE PO DURATION CHART */}
      <AveragePODurationChart
        data={averagePODurationData}
        height={400} 
      />

      {/* 7. AVERAGE GR DURATION CHART */}
      <AverageGRDurationChart
        data={averageGRDurationData}
        height={400} 
      />

      {/* 8. DETAIL LOP TABLE */}
      <DetailLOPTable data={detailLopData} itemsPerPage={20} />

    </div>
  );
}


function DonutSection({
  title,
  data,
  totalValue,
}: {
  title: string;
  data: any[];
  totalValue: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-red-600 py-3 text-center">
        <h3 className="text-white font-bold uppercase tracking-wider text-sm">
          {title}
        </h3>
      </div>
      <div className="p-6 flex flex-col items-center">
        <DonutChart data={data} size={180} thickness={40} />
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">
            COMM RELEASE
          </p>
          <p className="text-lg font-bold text-slate-800">
            {formatMoney(totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
