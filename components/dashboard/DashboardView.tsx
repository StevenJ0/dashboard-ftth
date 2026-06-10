// components/dashboard/DashboardView.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CapexTab from "./tabs/CapexTab";
import WaspangTab from "./tabs/WaspangTab";
import { DashboardData } from "@/types/dashboard";

// ─── PDF Export Button ────────────────────────────────────────────────────────
// Di-load secara dinamis dengan { ssr: false } agar SELURUH modul
// @react-pdf/renderer (font parser, layout engine, SVG renderer) TIDAK
// pernah di-resolve oleh bundler pada fase SSR / build Next.js.
// Semua logika PDF (state, useMemo, PDFDownloadLink, DashboardReportPDF)
// terisolasi penuh di dalam PdfExportButton.tsx.
const PdfExportButton = dynamic(
  () => import("@/components/dashboard/PdfExportButton"),
  {
    ssr: false,
    loading: () => (
      // Skeleton fallback ditampilkan selama chunk di-download
      <div
        style={{
          width:        "160px",
          height:       "38px",
          borderRadius: "8px",
          background:   "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation:    "shimmer 1.4s infinite",
        }}
      />
    ),
  }
);

// ─── Telkom Brand Colors ──────────────────────────────────────────────────────
const TELKOM = {
  red:   "#EE2E24",
  dark:  "#231F20",
  blue:  "#0050AE",
  white: "#FFFFFF",
  gray:  "#E6E7E8",
};

// ─── Framer-Motion Variants ───────────────────────────────────────────────────
const tabContentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
};

const tabBtnVariants = {
  inactive: { scale: 1   },
  active:   { scale: 1.02},
  tap:      { scale: 0.98},
};



// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<"waspang" | "capex">("waspang");

  // Filtered rows lifted from the active tab via callback
  const [filteredRows, setFilteredRows] = useState<any[]>(data.tableData);

  // Stable callback reference so child useMemo/useEffect don't re-run endlessly
  const handleFilteredDataChange = useCallback((rows: any[]) => {
    setFilteredRows(rows);
  }, []);

  // Kalkulasi pdfKpi di sini agar bisa di-pass ke PdfExportButton.
  // Hanya dijalankan ulang saat filteredRows benar-benar berubah.
  const pdfKpi = useMemo(
    () => ({
      totalLop: filteredRows.length,
      totalPr:  filteredRows.reduce((s, r) => s + (Number(r.pr_amount) || 0), 0),
      totalPo:  filteredRows.reduce((s, r) => s + (Number(r.po_amount) || 0), 0),
      totalGr:  filteredRows.reduce((s, r) => s + (Number(r.gr_amount) || 0), 0),
    }),
    [filteredRows]
  );

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview of WASPANG and CAPEX project reports
          </p>
        </div>

        {/* ── PDF Export Button ─────────────────────────────────────────────
            Di-load via dynamic({ ssr: false }) — @react-pdf/renderer TIDAK
            pernah di-resolve pada fase SSR/build. Semua logika PDF terisolasi
            penuh di dalam PdfExportButton.tsx.
        ─────────────────────────────────────────────────────────────────── */}
        <PdfExportButton
          activeTab={activeTab}
          filteredRows={filteredRows}
          pdfKpi={pdfKpi}
        />
      </div>

      {/* ── Tab Navigation ── */}
      <div
        className="flex space-x-2 mb-6 pb-1"
        style={{ borderBottom: `1px solid ${TELKOM.gray}` }}
      >
        {(["waspang", "capex"] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // Reset ke full dataset saat ganti tab;
              // tab baru akan segera lift filtered data-nya.
              setFilteredRows(data.tableData);
            }}
            variants={tabBtnVariants}
            initial="inactive"
            animate={activeTab === tab ? "active" : "inactive"}
            whileTap="tap"
            className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
            style={{
              backgroundColor: activeTab === tab ? TELKOM.white : "transparent",
              color:           activeTab === tab ? TELKOM.red  : "#6B7280",
              border:          activeTab === tab ? `1px solid ${TELKOM.gray}` : "none",
              borderBottom:    activeTab === tab ? "none" : undefined,
            }}
          >
            {tab === "waspang" ? "WASPANG Report" : "CAPEX Report"}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: TELKOM.red }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {activeTab === "waspang" ? (
            <WaspangTab
              data={data}
              onFilteredDataChange={handleFilteredDataChange}
            />
          ) : (
            <CapexTab
              data={data}
              onFilteredDataChange={handleFilteredDataChange}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Shimmer keyframe untuk skeleton loading PdfExportButton */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </>
  );
}
