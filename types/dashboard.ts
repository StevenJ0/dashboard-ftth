// types/dashboard.ts

export interface DashboardData {
  // --- Existing KPI (General) ---
  kpi: {
    pr: number;
    po: number;
    gr: number;
    ir: number;
  };

  // --- Data Spesifik Waspang Report ---
  // Scorecard Plan/OnGoing/GoLive
  waspang: {
    plan: { count: number; value: number };
    ongoing: { count: number; value: number };
    golive: { count: number; value: number };
  };

  // Chart Status SAP (PR/PO/GR/IR dengan Count & Value)
  statusSap: {
    label: string;
    count: number;
    value: number;
  }[];

  // Chart Status Tomps
  statusTomps: {
    label: string;
    count: number;
  }[];

  // --- Data Spesifik Capex Report ---
  // Gap Analysis (PR->PO, PO->GR)
  gapAnalysis: {
    label: string;
    value1: number;
    value2: number;
    gap: number;
  }[];

  programSummary: {
    name: string;
    value: number;
  }[];

  // --- Shared Data ---
  topWitel: {
    name: string;
    lop_count: number;
    po_value: number;
  }[];

  tableData: any[];

  filterOptions?: {
    distrik: string[];
    subDistrik: string[];
    wbs: string[];
  };
}
