// components/pdf/DashboardReportPDF.tsx
// Pure @react-pdf/renderer document — teks dapat di-copy, pagination otomatis.

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  red:        "#EE2E24",  // Telkom Red
  dark:       "#231F20",  // Telkom Dark
  blue:       "#0050AE",  // Telkom Blue
  white:      "#FFFFFF",
  headerBg:   "#1E293B",  // slate-800 — table header
  rowAlt:     "#F8FAFC",  // slate-50  — zebra stripe
  border:     "#E2E8F0",  // slate-200
  muted:      "#64748B",  // slate-500
  success:    "#16A34A",  // green-600
  warning:    "#D97706",  // amber-600
  danger:     "#DC2626",  // red-600
  neutral:    "#475569",  // slate-600
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page
  page: {
    flexDirection: "column",
    backgroundColor: C.white,
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.dark,
  },

  // ── Cover / Header ──
  coverBand: {
    backgroundColor: C.red,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  coverSubtitle: {
    fontSize: 8,
    color: "#FECACA",
    marginTop: 2,
  },
  coverDate: {
    fontSize: 8,
    color: C.white,
    textAlign: "right",
  },

  // ── KPI Cards Row ──
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 6,
    border: "1pt solid #E2E8F0",
    padding: 8,
    backgroundColor: "#F8FAFC",
  },
  kpiLabel: {
    fontSize: 7,
    color: C.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  kpiUnit: {
    fontSize: 6,
    color: C.muted,
    marginTop: 1,
  },

  // ── Section Heading ──
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    backgroundColor: "#F1F5F9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeft: "3pt solid #EE2E24",
    marginBottom: 6,
    borderRadius: 2,
  },

  // ── Table ──
  table: {
    borderRadius: 4,
    overflow: "hidden",
    border: "1pt solid #E2E8F0",
    marginBottom: 16,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
  },
  tbody: {
    flexDirection: "column",
  },
  tr: {
    flexDirection: "row",
    borderBottom: "1pt solid #E2E8F0",
  },
  trAlt: {
    backgroundColor: C.rowAlt,
  },

  // Header cells
  th: {
    padding: "5 6",
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textTransform: "uppercase",
  },
  // Data cells
  td: {
    padding: "4 6",
    fontSize: 7.5,
    color: C.dark,
    borderRight: "1pt solid #E2E8F0",
  },
  tdLast: {
    borderRight: "none",
  },

  // Widths
  colNo:       { width: "4%"  },
  colWbs:      { width: "11%" },
  colNama:     { width: "28%" },
  colDistrik:  { width: "12%" },
  colProgram:  { width: "14%" },
  colNilai:    { width: "12%" },
  colStatus:   { width: "11%" },
  colTomps:    { width: "8%"  },

  // Status badge inline
  badge: {
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 4,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    alignSelf: "flex-start",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1pt solid #E2E8F0",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = {
  money: (v: number | null | undefined): string => {
    if (!v || isNaN(v)) return "-";
    if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(2)} M`;
    if (v >= 1_000_000)     return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
    return `Rp ${v.toLocaleString("id-ID")}`;
  },
  str: (v: any): string => {
    if (!v || v === "null" || v === "undefined") return "-";
    return String(v).trim() || "-";
  },
  today: (): string =>
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day:     "2-digit",
      month:   "long",
      year:    "numeric",
    }),
};

const statusColor = (status: string): string => {
  const s = (status || "").toUpperCase();
  if (s.includes("GO LIVE") || s.includes("BAST") || s.includes("CLOSE")) return C.success;
  if (s.includes("ON GOING") || s.includes("PROGRESS"))                    return C.blue;
  if (s.includes("PLAN"))                                                   return C.warning;
  return C.neutral;
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ReportRow {
  wbs_id?:            string;
  short_text?:        string;
  witel?:             string;
  distrik?:           string;
  sub_district?:      string;
  program?:           string;
  wbs_desc?:          string;
  pr_amount?:         number | null;
  po_amount?:         number | null;
  status_lapangan?:   string;
  status_tomps_stage?: string;
  status_tomps?:      string;
  project_type?:      string;
  po_number?:         string;
  [key: string]: any;
}

interface Props {
  reportType:   "waspang" | "capex";
  rows:         ReportRow[];
  /** Filter labels to show in header e.g. { Distrik: "Jakarta", Type: "NEW" } */
  activeFilters?: Record<string, string>;
  /** KPI summary values */
  kpi?: {
    totalLop:  number;
    totalPr:   number;
    totalPo:   number;
    totalGr:   number;
  };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      {unit && <Text style={s.kpiUnit}>{unit}</Text>}
    </View>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function DataRow({ row, idx }: { row: ReportRow; idx: number }) {
  const isAlt   = idx % 2 === 1;
  const staLap  = fmt.str(row.status_lapangan);
  const staTomps = fmt.str(row.status_tomps_stage || row.status_tomps);
  const nilai   = row.po_amount
    ? fmt.money(Number(row.po_amount))
    : fmt.money(Number(row.pr_amount));

  return (
    <View style={[s.tr, isAlt ? s.trAlt : {}]} wrap={false}>
      <Text style={[s.td, s.colNo]}>{idx + 1}</Text>
      <Text style={[s.td, s.colWbs]}>{fmt.str(row.wbs_id)}</Text>
      <Text style={[s.td, s.colNama]}>{fmt.str(row.short_text)}</Text>
      <Text style={[s.td, s.colDistrik]}>{fmt.str(row.distrik || row.witel)}</Text>
      <Text style={[s.td, s.colProgram]}>{fmt.str(row.program || row.wbs_desc)}</Text>
      <Text style={[s.td, s.colNilai]}>{nilai}</Text>
      {/* Status Lapangan as coloured badge */}
      <View style={[s.td, s.colStatus, { justifyContent: "center" }]}>
        <Text
          style={[
            s.badge,
            { backgroundColor: statusColor(staLap) },
          ]}
        >
          {staLap}
        </Text>
      </View>
      <Text style={[s.td, s.colTomps, s.tdLast]}>{staTomps}</Text>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────
export default function DashboardReportPDF({
  reportType,
  rows,
  activeFilters = {},
  kpi,
}: Props) {
  const title =
    reportType === "waspang"
      ? "LAPORAN WASPANG — Monitoring Progres Pemasangan FTTH"
      : "LAPORAN CAPEX — Realisasi Anggaran & Manajemen Proyek FTTH";

  const totalPr   = kpi?.totalPr  ?? rows.reduce((s, r) => s + (Number(r.pr_amount) || 0), 0);
  const totalPo   = kpi?.totalPo  ?? rows.reduce((s, r) => s + (Number(r.po_amount) || 0), 0);
  const totalGr   = kpi?.totalGr  ?? rows.reduce((s, r) => s + (Number(r.gr_amount) || 0), 0);
  const totalLop  = kpi?.totalLop ?? rows.length;

  const filterEntries = Object.entries(activeFilters).filter(([, v]) => v && v !== "Semua");

  return (
    <Document title={title} author="Dashboard FTTH — Telkom Indonesia">
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* ── Header Band ── */}
        <View style={s.coverBand} fixed>
          <View>
            <Text style={s.coverTitle}>
              {reportType === "waspang" ? "📋 WASPANG Report" : "💰 CAPEX Report"}
            </Text>
            <Text style={s.coverSubtitle}>Dashboard Monitoring FTTH — Telkom Indonesia</Text>
            {filterEntries.length > 0 && (
              <Text style={[s.coverSubtitle, { marginTop: 3 }]}>
                Filter Aktif:{" "}
                {filterEntries.map(([k, v]) => `${k}: ${v}`).join("  |  ")}
              </Text>
            )}
          </View>
          <View>
            <Text style={s.coverDate}>Tanggal Cetak</Text>
            <Text style={[s.coverDate, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
              {fmt.today()}
            </Text>
            <Text style={[s.coverDate, { marginTop: 2 }]}>
              Total Data: {totalLop.toLocaleString("id-ID")} LOP
            </Text>
          </View>
        </View>

        {/* ── KPI Summary Row ── */}
        <View style={s.kpiRow}>
          <KpiCard label="Total LOP" value={totalLop.toLocaleString("id-ID")} unit="Pekerjaan" />
          <KpiCard label="Total Nilai PR" value={fmt.money(totalPr)} unit="(Purchase Requisition)" />
          <KpiCard label="Total Nilai PO" value={fmt.money(totalPo)} unit="(Purchase Order)" />
          <KpiCard label="Total Nilai GR" value={fmt.money(totalGr)} unit="(Goods Receipt)" />
          <KpiCard
            label="Realisasi PO/PR"
            value={totalPr > 0 ? `${((totalPo / totalPr) * 100).toFixed(1)}%` : "-"}
            unit="(PO ÷ PR)"
          />
        </View>

        {/* ── Table Section ── */}
        <Text style={s.sectionTitle}>
          Detail LOP — {rows.length.toLocaleString("id-ID")} data ditampilkan
        </Text>

        <View style={s.table}>
          {/* Table Header */}
          <View style={s.thead} fixed>
            <Text style={[s.th, s.colNo]}>No</Text>
            <Text style={[s.th, s.colWbs]}>WBS ID</Text>
            <Text style={[s.th, s.colNama]}>Nama Pekerjaan</Text>
            <Text style={[s.th, s.colDistrik]}>Distrik</Text>
            <Text style={[s.th, s.colProgram]}>Program / WBS</Text>
            <Text style={[s.th, s.colNilai]}>Nilai BOQ</Text>
            <Text style={[s.th, s.colStatus]}>Status</Text>
            <Text style={[s.th, s.colTomps]}>TOMPS</Text>
          </View>

          {/* Table Body */}
          <View style={s.tbody}>
            {rows.length === 0 ? (
              <View style={s.tr}>
                <Text style={[s.td, { flex: 1, textAlign: "center", color: C.muted, padding: 12 }]}>
                  Tidak ada data untuk ditampilkan.
                </Text>
              </View>
            ) : (
              rows.map((row, idx) => (
                <DataRow key={idx} row={row} idx={idx} />
              ))
            )}
          </View>
        </View>

        {/* ── Footer (fixed on every page) ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Dashboard FTTH — Telkom Indonesia  •  Dokumen ini dicetak otomatis oleh sistem
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
