// components/dashboard/DashboardView.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CapexTab from "./tabs/CapexTab";
import WaspangTab from "./tabs/WaspangTab";
import { DashboardData } from "@/types/dashboard";

// PERBAIKAN #4: Ubah static import menjadi dynamic import untuk DashboardReportPDF.
//
// SEBELUM (static import):
//   import DashboardReportPDF from "@/components/pdf/DashboardReportPDF";
//   → Seluruh modul @react-pdf/renderer (font parser, layout engine, SVG renderer)
//     di-parse secara SINKRON oleh JS engine saat DashboardView pertama kali dimount.
//     Ini menyebabkan jank/freeze tambahan di awal render.
//
// SESUDAH (dynamic import):
//   → Modul @react-pdf/renderer hanya di-load saat komponen ini pertama kali
//     BENAR-BENAR dibutuhkan untuk dirender ke DOM — yaitu saat user klik
//     "Siapkan PDF" dan isPdfRequested menjadi true.
//   → Initial mount Dashboard tidak terbebani sama sekali oleh library PDF.
const DashboardReportPDF = dynamic(
  () => import("@/components/pdf/DashboardReportPDF"),
  { ssr: false }
);

// PDFDownloadLink must be loaded client-side only (no SSR) because
// @react-pdf/renderer accesses browser APIs internally.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false }
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

// ─── Helper: dynamic filename ─────────────────────────────────────────────────
function buildFileName(tab: "waspang" | "capex"): string {
  const label   = tab === "waspang" ? "WaspangReport" : "CapexReport";
  const dateStr = new Date()
    .toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    .replace(/ /g, "");
  return `Report_${label}_${dateStr}.pdf`;
}

// ─── Download Button (inner) ──────────────────────────────────────────────────
function DownloadBtn({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="Download laporan aktif sebagai PDF"
      style={{
        display:         "flex",
        alignItems:      "center",
        gap:             "8px",
        padding:         "9px 16px",
        borderRadius:    "8px",
        border:          "none",
        cursor:          loading ? "not-allowed" : "pointer",
        backgroundColor: loading ? "#9CA3AF" : TELKOM.red,
        color:           TELKOM.white,
        fontSize:        "13px",
        fontWeight:      600,
        opacity:         loading ? 0.75 : 1,
        transition:      "background-color 0.2s, opacity 0.2s",
        boxShadow:       "0 1px 4px rgba(0,0,0,0.15)",
        whiteSpace:      "nowrap",
      }}
    >
      {loading ? (
        /* Spinner SVG */
        <>
          <svg
            style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Menyiapkan Dokumen...</span>
        </>
      ) : (
        <>
          <svg
            style={{ width: 16, height: 16 }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          <span>Download Report PDF</span>
        </>
      )}
    </button>
  );
}

// ─── "Siapkan PDF" Trigger Button ────────────────────────────────────────────
// Ditampilkan SEBELUM PDF di-generate. Tidak melibatkan @react-pdf/renderer
// sama sekali — aman untuk initial render, tidak memblokir main thread.
function PreparePdfBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Klik untuk menyiapkan laporan PDF"
      style={{
        display:         "flex",
        alignItems:      "center",
        gap:             "8px",
        padding:         "9px 16px",
        borderRadius:    "8px",
        border:          "none",
        cursor:          "pointer",
        backgroundColor: TELKOM.red,
        color:           TELKOM.white,
        fontSize:        "13px",
        fontWeight:      600,
        transition:      "background-color 0.2s, opacity 0.2s",
        boxShadow:       "0 1px 4px rgba(0,0,0,0.15)",
        whiteSpace:      "nowrap",
      }}
    >
      <svg
        style={{ width: 16, height: 16 }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>Siapkan PDF</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<"waspang" | "capex">("waspang");

  // Filtered rows lifted from the active tab via callback
  const [filteredRows, setFilteredRows] = useState<any[]>(data.tableData);

  // FIX #3: PDF hanya di-generate saat user secara eksplisit memintanya.
  // Secara default false → <PDFDownloadLink> TIDAK di-mount saat initial load.
  const [isPdfRequested, setIsPdfRequested] = useState(false);

  // Stable callback reference so child useMemo/useEffect don't re-run endlessly
  const handleFilteredDataChange = useCallback((rows: any[]) => {
    setFilteredRows(rows);
    // FIX #3 (bonus): Reset state PDF saat filter berubah agar PDF tidak
    // langsung di-generate ulang secara otomatis dengan data baru.
    setIsPdfRequested(false);
  }, []);

  // FIX #1: Bungkus kalkulasi pdfKpi dengan useMemo.
  // Tiga operasi .reduce() atas ribuan baris ini kini HANYA dijalankan ulang
  // saat referensi `filteredRows` benar-benar berubah, bukan di setiap render.
  const pdfKpi = useMemo(
    () => ({
      totalLop: filteredRows.length,
      totalPr:  filteredRows.reduce((s, r) => s + (Number(r.pr_amount) || 0), 0),
      totalPo:  filteredRows.reduce((s, r) => s + (Number(r.po_amount) || 0), 0),
      totalGr:  filteredRows.reduce((s, r) => s + (Number(r.gr_amount) || 0), 0),
    }),
    [filteredRows]
  );

  // FIX #2: Bungkus JSX DashboardReportPDF dengan useMemo.
  // Referensi `pdfDocument` kini stabil — hanya berubah saat `filteredRows`
  // atau `activeTab` benar-benar berubah. PDFDownloadLink tidak akan
  // meng-restart proses generate PDF pada render yang tidak relevan.
  const pdfDocument = useMemo(
    () => (
      <DashboardReportPDF
        reportType={activeTab}
        rows={filteredRows}
        kpi={pdfKpi}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRows, activeTab]
    // Catatan: pdfKpi sengaja tidak dimasukkan ke deps karena pdfKpi sendiri
    // sudah di-derive dari filteredRows. Memasukkan keduanya sekaligus akan
    // menyebabkan double trigger yang tidak perlu.
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

        {/* ── FIX #3: Deferred/Lazy PDF Rendering ─────────────────────────────
            SEBELUM isPdfRequested: tampilkan tombol "Siapkan PDF" biasa.
              → @react-pdf/renderer sama sekali tidak di-load/dieksekusi.
              → Main thread bebas, halaman tidak freeze saat mount.

            SETELAH isPdfRequested: baru render <PDFDownloadLink>.
              → PDFDownloadLink mulai generate PDF di background.
              → Prop `document` dijamin stabil (sudah di-useMemo di atas).
              → Render PDF hanya terjadi SEKALI per klik, bukan setiap render.
        ─────────────────────────────────────────────────────────────────── */}
        {!isPdfRequested ? (
          <PreparePdfBtn onClick={() => setIsPdfRequested(true)} />
        ) : (
          <PDFDownloadLink
            document={pdfDocument}
            fileName={buildFileName(activeTab)}
            style={{ textDecoration: "none" }}
          >
            {({ loading }: { loading: boolean }) => (
              <DownloadBtn loading={loading} />
            )}
          </PDFDownloadLink>
        )}
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

      {/* Spinner keyframe — injected once into the page */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
