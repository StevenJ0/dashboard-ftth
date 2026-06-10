// components/dashboard/PdfExportButton.tsx
//
// ⚠️  ISOLASI SSR — Seluruh @react-pdf/renderer di-import di sini.
//     File ini WAJIB di-load via `next/dynamic` dengan opsi `{ ssr: false }`
//     dari parent (DashboardView.tsx) agar bundler tidak mencoba me-resolve
//     modul ini saat server-side rendering / Next.js build phase.
"use client";

import { useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DashboardReportPDF from "@/components/pdf/DashboardReportPDF";
import type { ReportRow } from "@/components/pdf/DashboardReportPDF";

// ─── Telkom Brand Colors ──────────────────────────────────────────────────────
const TELKOM_RED   = "#EE2E24";
const TELKOM_WHITE = "#FFFFFF";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildFileName(tab: "waspang" | "capex"): string {
  const label   = tab === "waspang" ? "WaspangReport" : "CapexReport";
  const dateStr = new Date()
    .toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    .replace(/ /g, "");
  return `Report_${label}_${dateStr}.pdf`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PdfKpi {
  totalLop: number;
  totalPr:  number;
  totalPo:  number;
  totalGr:  number;
}

interface Props {
  activeTab:    "waspang" | "capex";
  filteredRows: ReportRow[];
  pdfKpi:       PdfKpi;
  fileName?:    string;
}

// ─── Inner: "Siapkan PDF" trigger button (no PDF lib involved) ────────────────
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
        backgroundColor: TELKOM_RED,
        color:           TELKOM_WHITE,
        fontSize:        "13px",
        fontWeight:      600,
        transition:      "background-color 0.2s, opacity 0.2s",
        boxShadow:       "0 1px 4px rgba(0,0,0,0.15)",
        whiteSpace:      "nowrap",
      }}
    >
      {/* Document icon */}
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
      <span>Siapkan Report PDF</span>
    </button>
  );
}

// ─── Inner: Download/Loading button rendered by PDFDownloadLink ───────────────
function DownloadBtn({ loading }: { loading: boolean }) {
  return (
    <button
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
        backgroundColor: loading ? "#9CA3AF" : TELKOM_RED,
        color:           TELKOM_WHITE,
        fontSize:        "13px",
        fontWeight:      600,
        opacity:         loading ? 0.75 : 1,
        transition:      "background-color 0.2s, opacity 0.2s",
        boxShadow:       "0 1px 4px rgba(0,0,0,0.15)",
        whiteSpace:      "nowrap",
      }}
    >
      {loading ? (
        <>
          {/* Spinner */}
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
          {/* Download icon */}
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

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PdfExportButton({
  activeTab,
  filteredRows,
  pdfKpi,
  fileName,
}: Props) {
  // Lazy state: PDF hanya di-generate saat user secara eksplisit memintanya.
  // Selama false, <PDFDownloadLink> tidak di-mount → @react-pdf/renderer
  // tidak melakukan komputasi apapun.
  const [isPdfRequested, setIsPdfRequested] = useState(false);

  // Stabilkan referensi dokumen PDF agar PDFDownloadLink tidak merestart
  // proses generate setiap kali parent re-render.
  const pdfDocument = useMemo(
    () => (
      <DashboardReportPDF
        reportType={activeTab}
        rows={filteredRows}
        kpi={pdfKpi}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredRows, activeTab],
    // Catatan: pdfKpi sengaja tidak dimasukkan ke deps karena nilainya
    // sudah di-derive dari filteredRows di parent. Memasukkan keduanya
    // akan menyebabkan double-trigger yang tidak perlu.
  );

  const resolvedFileName = fileName ?? buildFileName(activeTab);

  if (!isPdfRequested) {
    return <PreparePdfBtn onClick={() => setIsPdfRequested(true)} />;
  }

  return (
    <>
      <PDFDownloadLink
        document={pdfDocument}
        fileName={resolvedFileName}
        style={{ textDecoration: "none" }}
      >
        {({ loading }: { loading: boolean }) => (
          <DownloadBtn loading={loading} />
        )}
      </PDFDownloadLink>

      {/* Spinner keyframe — scoped to this component */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
