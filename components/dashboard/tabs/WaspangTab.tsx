"use client";

import { useState, useMemo } from "react";
import { DashboardData } from "@/types/dashboard";
import { formatMoney } from "./formatUtils";
import {
  formatNumber,
  ComboChart,
  InfoCard,
  ChartContainer,
  calculateLinePoints,
  DetailLOPTableWaspang,
} from "./chartComponents";

import WaspangFilters, { FilterState } from "./WaspangFilters";


export default function WaspangTab({ data }: { data: DashboardData }) {
  const [filters, setFilters] = useState<FilterState>({
    typeCapex: [],
    statusSap: [],
    distrik: [],
    subDistrik: [],
    wbs: [],
  });


  // Helper function untuk extract nilai dari row
  const getTypeCapex = (row: any): string => {
    const projectType = row.project_type || "";
    return projectType.toUpperCase() === "CO#2025" ? "CO" : "NEW";
  };

  const getSapStatus = (row: any): string => {
    if (row.po_number && row.po_number.trim() !== "") return "PO";
    if (row.gr_date) return "GR";
    if (row.ir_amount && Number(row.ir_amount) > 0) return "IR";
    return "";
  };

  const getDistrik = (row: any): string => {
    return row.distrik || row.witel || "";
  };

  const getSubDistrik = (row: any): string => {
    return row.sub_district || row.sub_distrik || "";
  };

  const getWbs = (row: any): string => {
    return row.wbs_id || row.wbs || "";
  };

  // Extract unique options dari data untuk filter
  const availableOptions = useMemo(() => {
    // Gunakan filterOptions dari server jika tersedia
    if (data.filterOptions) {
      return data.filterOptions;
    }

    // Fallback: extract dari tableData jika filterOptions tidak ada
    const distriksSet = new Set<string>();
    const subDistriksSet = new Set<string>();
    const wbsSet = new Set<string>();

    data.tableData.forEach((row) => {
      // Extract dan clean distrik
      const distrikRaw = row.distrik || row.witel || "";
      const distrikTrimmed = String(distrikRaw).trim();
      if (
        distrikTrimmed &&
        distrikTrimmed !== "" &&
        distrikTrimmed !== "-" &&
        distrikTrimmed !== "undefined" &&
        distrikTrimmed !== "null"
      ) {
        distriksSet.add(distrikTrimmed);
      }

      // Extract dan clean sub_district
      const subDistrikRaw = row.sub_district || row.sub_distrik || "";
      const subDistrikTrimmed = String(subDistrikRaw).trim();
      if (
        subDistrikTrimmed &&
        subDistrikTrimmed !== "" &&
        subDistrikTrimmed !== "-" &&
        subDistrikTrimmed !== "undefined" &&
        subDistrikTrimmed !== "null"
      ) {
        subDistriksSet.add(subDistrikTrimmed);
      }

      // Extract dan clean WBS
      const wbsRaw = row.wbs_id || row.wbs || "";
      const wbsTrimmed = String(wbsRaw).trim().toUpperCase();
      if (
        wbsTrimmed &&
        wbsTrimmed !== "" &&
        wbsTrimmed !== "UNDEFINED" &&
        wbsTrimmed !== "NULL"
      ) {
        wbsSet.add(wbsTrimmed);
      }
    });

    return {
      distrik: Array.from(distriksSet).sort(),
      subDistrik: Array.from(subDistriksSet).sort(),
      wbs: Array.from(wbsSet).sort(),
    };
  }, [data.tableData, data.filterOptions]);

  // Filter data berdasarkan filter state
  const filteredTableData = useMemo(() => {
    return data.tableData.filter((row) => {
      // Check typeCapex filter
      if (filters.typeCapex.length > 0) {
        const rowTypeCapex = getTypeCapex(row);
        if (!filters.typeCapex.includes(rowTypeCapex)) return false;
      }

      // Check statusSap filter
      if (filters.statusSap.length > 0) {
        const rowSapStatus = getSapStatus(row);
        if (!filters.statusSap.includes(rowSapStatus)) return false;
      }

      // Check distrik filter
      if (filters.distrik.length > 0) {
        const rowDistrik = String(getDistrik(row) || "").trim();
        if (!filters.distrik.includes(rowDistrik)) {
          return false;
        }
      }

      // Check subDistrik filter
      if (filters.subDistrik.length > 0) {
        const rowSubDistrik = String(getSubDistrik(row) || "").trim();
        if (!filters.subDistrik.includes(rowSubDistrik)) {
          return false;
        }
      }

      // Check WBS filter
      if (filters.wbs.length > 0) {
        const rowWbs = String(getWbs(row) || "")
          .trim()
          .toUpperCase();
        const isWbsMatched = filters.wbs.some(
          (w) => rowWbs === w.toUpperCase() || rowWbs.includes(w.toUpperCase()),
        );
        if (!isWbsMatched) {
          return false;
        }
      }

      return true;
    });
  }, [filters, data.tableData]);


  // Hitung filtered stats untuk scorecards
  const filteredStats = useMemo(() => {
    let plan = { count: 0, value: 0 };
    let ongoing = { count: 0, value: 0 };
    let golive = { count: 0, value: 0 };

    filteredTableData.forEach((item) => {
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

    return { plan, ongoing, golive };
  }, [filteredTableData]);

  // Hitung filtered status data untuk charts
  const filteredStatusSap = useMemo(() => {
    const po = { label: "PO", count: 0, value: 0 };
    const ir = { label: "IR", count: 0, value: 0 };
    const gr = { label: "GR", count: 0, value: 0 };

    filteredTableData.forEach((item) => {
      const value = Number(item.po_amount) || 0;
      if (item.po_number && item.po_number.trim() !== "") {
        po.count++;
        po.value += value;
      }
      if (item.ir_amount && Number(item.ir_amount) > 0) {
        ir.count++;
        ir.value += Number(item.ir_amount);
      }
      if (item.gr_date) {
        gr.count++;
        gr.value += Number(item.gr_amount) || 0;
      }
    });

    return [po, ir, gr];
  }, [filteredTableData]);

  // Hitung filtered status tomps
  const filteredStatusTomps = useMemo(() => {
    const stageMap = new Map<string, number>();

    filteredTableData.forEach((item) => {
      const stage = item.status_tomps_stage || "N/A";
      stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
    });

    return Array.from(stageMap).map(([label, count]) => ({
      label,
      count,
    }));
  }, [filteredTableData]);

  // Max count untuk kalkulasi lebar bar
  const maxSapCount = Math.max(...filteredStatusSap.map((s) => s.count), 1);
  const maxTompsCount = Math.max(...filteredStatusTomps.map((s) => s.count), 1);


  // Generate Detail LOP data for the new table component
  const detailLopData = useMemo(() => {
    return filteredTableData.map((item: any) => ({
      distrik: item.distrik || item.witel || '',
      subDistrik: item.sub_district || item.sub_distrik || '',
      idIhld: item.id_ihld || '',
      namaLop: item.short_text || item.lop_name || item.name || '',
      statusProyek: item.status_lapangan || 'Go Live',
      statusTomps: item.status_tomps_stage || item.status_tomps || '',
      wbs: item.program || item.wbs_desc || '',
      nilaiBoqPlan: parseFloat(item.pr_amount) || 0,
    }));
  }, [filteredTableData]);


  return (
    <div className="space-y-6 pb-10">
      {/* 1. FILTER BAR (extracted to WaspangFilters component) */}
      <WaspangFilters
        onFilterChange={setFilters}
        availableOptions={availableOptions}
      />

      {/* 2. SCORECARDS (Plan, On Going, Go Live) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PLAN - BLUE */}
        <ScoreCard
          title="PLAN"
          count={filteredStats.plan.count}
          value={filteredStats.plan.value}
          color="bg-blue-500"
          lightColor="bg-blue-50"
          textColor="text-blue-700"
        />
        {/* ON GOING - AMBER */}
        <ScoreCard
          title="ON GOING"
          count={filteredStats.ongoing.count}
          value={filteredStats.ongoing.value}
          color="bg-amber-500"
          lightColor="bg-amber-50"
          textColor="text-amber-700"
        />
        {/* GO LIVE - EMERALD */}
        <ScoreCard
          title="GO LIVE"
          count={filteredStats.golive.count}
          value={filteredStats.golive.value}
          color="bg-emerald-500"
          lightColor="bg-emerald-50"
          textColor="text-emerald-700"
        />
      </div>

      {/* 3. COMBO CHARTS (STATUS IHLD + STATUS SAP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATUS IHLD CHART */}
        <StatusIhldChart
          data={{
            ...data,
            waspang: {
              plan: filteredStats.plan,
              ongoing: filteredStats.ongoing,
              golive: filteredStats.golive,
            },
          }}
        />

        {/* STATUS SAP CHART */}
        <StatusSapChart data={{ ...data, statusSap: filteredStatusSap }} />
      </div>

      {/* 3.5 INFO CARDS */}
      <InfoCards
        data={{
          ...data,
          waspang: {
            plan: filteredStats.plan,
            ongoing: filteredStats.ongoing,
            golive: filteredStats.golive,
          },
          statusSap: filteredStatusSap,
        }}
      />

      {/* 4. ADDITIONAL CHARTS */}
      <div className="grid grid-cols-1 gap-6">
        {/* STATUS TOMPS (Fisik) */}
        <StatusTompsChart
          data={{ ...data, statusTomps: filteredStatusTomps }}
        />
      </div>

      {/* 5. DETAIL LOP TABLE */}
      <DetailLOPTableWaspang data={detailLopData} />

    </div>
  );
}

// Sub-Component: InfoCards - Menggunakan atomic InfoCard components
function InfoCards({ data }: { data: DashboardData }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {/* Row 1: Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <InfoCard
          label="Jumlah LOP"
          value={formatNumber(
            data.waspang.plan.count +
              data.waspang.ongoing.count +
              data.waspang.golive.count,
          )}
        />
        <InfoCard
          label="Status PR"
          value={data.kpi.pr === 0 ? "0" : formatNumber(data.kpi.pr)}
        />
        <InfoCard
          label="Status PO"
          value={formatNumber(data.statusSap[0]?.count || 0)}
        />
        <InfoCard
          label="Status GR"
          value={formatNumber(data.statusSap[2]?.count || 0)}
        />
        <InfoCard
          label="Status IR"
          value={formatNumber(data.statusSap[1]?.count || 0)}
        />
      </div>

      {/* Row 2: Values */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        <InfoCard
          label="Nilai BOQ"
          value={formatMoney(
            data.waspang.plan.value +
              data.waspang.ongoing.value +
              data.waspang.golive.value,
          )}
        />
        <InfoCard
          label="Nilai BOQ"
          value={data.kpi.pr === 0 ? "No data" : formatMoney(data.kpi.pr)}
        />
        <InfoCard
          label="Nilai BOQ"
          value={formatMoney(data.statusSap[0]?.value || 0)}
        />
        <InfoCard
          label="Nilai BOQ"
          value={formatMoney(data.statusSap[2]?.value || 0)}
        />
        <InfoCard
          label="NILAI BOQ PLAN"
          value={formatMoney(data.statusSap[1]?.value || 0)}
        />
      </div>
    </div>
  );
}

// Sub-Component: StatusIhldChart - Menggunakan ComboChart atomic component
function StatusIhldChart({ data }: { data: DashboardData }) {
  const maxCount = Math.max(
    data.waspang.plan.count,
    data.waspang.golive.count,
    data.waspang.ongoing.count,
    1,
  );

  const bars = [
    {
      height: (data.waspang.plan.count / maxCount) * 280,
      label: "Plan",
    },
    {
      height: (data.waspang.golive.count / maxCount) * 280,
      label: "Go Live",
    },
    {
      height: (data.waspang.ongoing.count / maxCount) * 280,
      label: "On Going",
    },
  ];

  // Dummy linePoints - akan dihitung otomatis di ComboChart component
  const linePoints = bars.map((bar) => ({ x: 0, y: bar.height }));

  return (
    <ComboChart
      title="STATUS IHLD"
      bars={bars}
      leftAxisLabel="Jumlah LOP"
      rightAxisLabel="NILAI BOQ PLAN"
      leftAxisValues={[
        formatNumber(Math.ceil(maxCount)),
        formatNumber(Math.ceil(maxCount * 0.75)),
        formatNumber(Math.ceil(maxCount * 0.5)),
        formatNumber(Math.ceil(maxCount * 0.25)),
        "0",
      ]}
      rightAxisValues={[
        formatMoney(data.waspang.ongoing.value),
        formatMoney(data.waspang.ongoing.value * 0.75),
        formatMoney(data.waspang.ongoing.value * 0.5),
        formatMoney(data.waspang.ongoing.value * 0.25),
        "0",
      ]}
      linePoints={linePoints}
    />
  );
}

// Sub-Component: StatusSapChart - Menggunakan ComboChart atomic component
function StatusSapChart({ data }: { data: DashboardData }) {
  const maxCount = Math.max(...data.statusSap.map((s) => s.count), 1);
  const maxValue = Math.max(...data.statusSap.map((s) => s.value));

  const bars = data.statusSap.map((item, idx) => ({
    height: (item.count / maxCount) * 280,
    label: item.label.split(" ")[0],
    title: `${item.label}: ${item.count} items`,
  }));

  // Dummy linePoints - akan dihitung otomatis di ComboChart component
  const linePoints = bars.map((bar) => ({ x: 0, y: bar.height }));

  return (
    <ComboChart
      title="STATUS SAP"
      bars={bars}
      leftAxisLabel="Jumlah LOP"
      rightAxisLabel="NILAI BOQ PLAN"
      leftAxisValues={[
        formatNumber(Math.ceil(maxCount)),
        formatNumber(Math.ceil(maxCount * 0.75)),
        formatNumber(Math.ceil(maxCount * 0.5)),
        formatNumber(Math.ceil(maxCount * 0.25)),
        "0",
      ]}
      rightAxisValues={[
        formatMoney(maxValue),
        formatMoney(maxValue * 0.75),
        formatMoney(maxValue * 0.5),
        formatMoney(maxValue * 0.25),
        "0",
      ]}
      linePoints={linePoints}
    />
  );
}

// Sub-Component: StatusTompsChart - Menggunakan ComboChart atomic component
function StatusTompsChart({ data }: { data: DashboardData }) {
  const maxCount = Math.max(...data.statusTomps.map((s) => s.count), 1);

  const bars = data.statusTomps.map((item) => ({
    height: (item.count / maxCount) * 280,
    label: item.label,
    title: `${item.label}: ${item.count} items`,
  }));

  // Dummy linePoints - akan dihitung otomatis di ComboChart component
  const linePoints = bars.map((bar) => ({ x: 0, y: bar.height }));

  return (
    <ComboChart
      title="STATUS TOMPS"
      bars={bars}
      leftAxisLabel="Jumlah LOP"
      rightAxisLabel="PROGRESS %"
      leftAxisValues={[
        formatNumber(Math.ceil(maxCount)),
        formatNumber(Math.ceil(maxCount * 0.75)),
        formatNumber(Math.ceil(maxCount * 0.5)),
        formatNumber(Math.ceil(maxCount * 0.25)),
        "0",
      ]}
      rightAxisValues={["100%", "75%", "50%", "25%", "0%"]}
      linePoints={linePoints}
    />
  );
}

// Sub-Component: ScoreCard Warna-warni
function ScoreCard({ title, count, value, color, lightColor, textColor }: any) {
  return (
    <div
      className={`rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow`}
    >
      {/* Header Warna */}
      <div className={`${color} px-4 py-2 flex justify-between items-center`}>
        <span className="text-white text-sm font-bold tracking-wider">
          {title}
        </span>
        <div className="bg-white/20 p-1 rounded">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      {/* Content */}
      <div
        className={`p-4 flex flex-col items-center justify-center flex-1 ${lightColor}`}
      >
        <div className="text-center mb-2">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
            Jumlah LOP
          </p>
          <h4 className={`text-3xl font-extrabold ${textColor}`}>
            {formatNumber(count)}
          </h4>
        </div>
        <div className="w-full h-[1px] bg-slate-200 my-2"></div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
            Nilai BOQ
          </p>
          <p className={`text-lg font-bold ${textColor}`}>
            {formatMoney(value)}
          </p>
        </div>
      </div>
    </div>
  );
}
