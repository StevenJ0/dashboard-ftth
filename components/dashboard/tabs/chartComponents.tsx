"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";

// ===== TELKOM INDONESIA BRAND COLORS =====
export const TELKOM_COLORS = {
  primary: "#EE2E24",      // Telkom Red - Primary data/bars
  secondary: "#0050AE",    // Digital Blue - Comparison/secondary data
  dark: "#231F20",         // Deep Black - Headings
  text: "#4B5563",         // Slate 600 - Body text
  grid: "#E6E7E8",         // Light Gray - Grid lines
  white: "#FFFFFF",
  gray: "#E6E7E8",         // Surface/Border
  success: "#10B981",      // Emerald - Positive
  warning: "#F59E0B",      // Amber - Warning
  neutral: "#9CA3AF",      // Slate 400 - Neutral/Others
};

// Chart color palette for multi-series data
// Ordered to prioritize Red, Blue, Black, then complementary
const CHART_PALETTE = [
  TELKOM_COLORS.primary,   // Red
  TELKOM_COLORS.secondary, // Blue
  TELKOM_COLORS.dark,      // Black
  "#10B981",               // Emerald (Success)
  "#F59E0B",               // Amber (Warning)
  "#8B5CF6",               // Violet
  "#6B7280",               // Slate 500
];

// ===== HELPER FUNCTIONS =====
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Short format for axis labels (e.g., 245M, 1.2T)
export const formatMoneyShort = (num: number): string => {
  if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(1)}M`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)}jt`;
  return `Rp ${formatNumber(num)}`;
};

// Full precision format for tooltips (e.g., Rp 245,678,901,234)
export const formatMoney = (num: number): string => {
  return `Rp ${formatNumber(Math.round(num))}`;
};

// Color mapping from Tailwind classes to hex values
// Mapped to strict Telkom palette where possible
const colorMap: Record<string, string> = {
  "bg-blue-500": TELKOM_COLORS.secondary, // Map blue-500 to Telkom Blue
  "bg-blue-600": TELKOM_COLORS.secondary,
  "bg-orange-400": "#FB923C",             // Keep Orange for variety but usually warning
  "bg-orange-500": "#F97316",
  "bg-purple-500": "#A855F7",
  "bg-lime-500": "#84CC16",
  "bg-cyan-500": "#06B6D4",
  "bg-pink-500": "#EC4899",
  "bg-red-500": TELKOM_COLORS.primary,    // Map red-500 to Telkom Red
  "bg-red-600": TELKOM_COLORS.primary,
  "bg-green-500": TELKOM_COLORS.success,
  "bg-yellow-500": TELKOM_COLORS.warning,
  "bg-slate-400": TELKOM_COLORS.neutral,
  "bg-slate-500": "#64748B",
  "bg-emerald-500": TELKOM_COLORS.success,
  "bg-amber-500": TELKOM_COLORS.warning,
};

export const getHexColor = (tailwindClass: string): string => {
  if (tailwindClass.startsWith("#")) return tailwindClass;
  return colorMap[tailwindClass] || TELKOM_COLORS.neutral;
};


// ===== COMPONENT: Chart Container =====
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, children }: ChartContainerProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 
        className="text-sm font-bold text-white px-4 py-3 rounded-lg mb-6"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ===== COMPONENT: Info Card =====
interface InfoCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function InfoCard({ label, value, className = "" }: InfoCardProps) {
  return (
    <div className={`flex flex-col p-4 border border-slate-200 rounded-lg ${className}`}>
      <p className="text-xs text-slate-500 font-medium mb-2">{label}</p>
      <h4 className="text-2xl font-bold" style={{ color: TELKOM_COLORS.dark }}>{value}</h4>

    </div>
  );
}

// ===== COMPONENT: Combo Chart (Bar + Line) =====
interface ComboChartProps {
  title: string;
  bars: { height: number; label: string; title?: string; value?: number; percent?: number }[];
  leftAxisLabel: string;
  rightAxisLabel: string;
  leftAxisValues?: (string | number)[];
  rightAxisValues?: (string | number)[];
  linePoints?: { x: number; y: number }[];
}

export function ComboChart({
  title,
  bars,
  leftAxisLabel,
  rightAxisLabel,
}: ComboChartProps) {
  // Transform data for Recharts - use bar.height as value and calculate percent
  const chartData = bars.map((bar, idx) => ({
    name: bar.label,
    value: bar.value !== undefined ? bar.value : Math.round(bar.height),
    percent: bar.percent !== undefined ? bar.percent : Math.round((bar.height / 280) * 100),
  }));

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex items-center justify-center h-[300px] text-slate-400">
          No data available
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={TELKOM_COLORS.grid} 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
            axisLine={{ stroke: TELKOM_COLORS.grid }}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
            axisLine={{ stroke: TELKOM_COLORS.grid }}
            tickLine={false}
            tickFormatter={(value) => formatNumber(value)}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
            axisLine={{ stroke: TELKOM_COLORS.grid }}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: TELKOM_COLORS.white,
              border: `1px solid ${TELKOM_COLORS.grid}`,
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ color: TELKOM_COLORS.text, fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: TELKOM_COLORS.text, fontSize: '12px' }}>{value}</span>
            )}
          />
          <Bar 
            yAxisId="left"
            dataKey="value" 
            name={leftAxisLabel}
            fill={TELKOM_COLORS.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="percent" 
            name={rightAxisLabel}
            stroke={TELKOM_COLORS.secondary}
            strokeWidth={2.5}
            dot={{ fill: TELKOM_COLORS.secondary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: TELKOM_COLORS.white, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// ===== COMPONENT: Donut Chart =====
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  thickness?: number;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 25,
}: DonutChartProps) {
  // Handle empty data
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex flex-col items-center">
        <div 
          className="flex items-center justify-center text-slate-400 text-sm"
          style={{ width: size, height: size }}
        >
          No data
        </div>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Transform data for Recharts
  const chartData = data.filter(d => d.value > 0).map((item) => ({
    name: item.label,
    value: item.value,
    fill: getHexColor(item.color),
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
  }));

  const innerRadius = (size - thickness * 2) / 2;
  const outerRadius = size / 2 - 10;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-semibold text-sm" style={{ color: data.fill }}>
            {data.name}
          </p>
          <p className="text-sm text-slate-700">
            {formatMoney(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie segments
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for very small segments

    return (
      <text
        x={x}
        y={y}
        fill={TELKOM_COLORS.text}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size + 60} height={size + 40}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-2 max-w-[280px]">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span 
              className="text-[10px] font-semibold uppercase tracking-tight"
              style={{ color: TELKOM_COLORS.text }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== COMPONENT: Simple Bar Chart =====
interface SimpleBarChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-400" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={TELKOM_COLORS.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }} />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
          width={75}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: TELKOM_COLORS.white,
            border: `1px solid ${TELKOM_COLORS.grid}`,
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" fill={TELKOM_COLORS.primary} radius={[0, 4, 4, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ===== LEGACY EXPORTS (for backward compatibility) =====
// These are kept for components that still use the old API

export const calculateLinePoints = (
  bars: { height: number }[],
  containerWidth: number = 100,
) => {
  const barCount = bars.length;
  const barWidth = 64;
  const gapSize = 32;
  const sidePadding = 24;
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * gapSize;
  const availableWidth = containerWidth - sidePadding * 2;
  const centerOffset = (availableWidth - totalBarsWidth) / 2;
  const startX = sidePadding + centerOffset + barWidth / 2;

  return bars.map((bar, idx) => ({
    x: startX + idx * (barWidth + gapSize),
    y: bar.height,
  }));
};

// ===== COMPONENT: PR-PO-GR-IR Horizontal Bar Chart =====
// Colors matching Telkom Corporate Identity
const PRPOGRIR_COLORS = {
  pr: TELKOM_COLORS.secondary, // Blue
  po: TELKOM_COLORS.primary,   // Red
  gr: TELKOM_COLORS.dark,      // Black
  ir: TELKOM_COLORS.success,   // Emerald
};


interface PRPOGRIRData {
  pr: number;
  po: number;
  gr: number;
  ir: number;
}

interface PRPOGRIRChartProps {
  title: string;
  data: PRPOGRIRData;
  height?: number;
}

export function PRPOGRIRChart({ title, data, height = 180 }: PRPOGRIRChartProps) {
  const chartData = [
    { name: "NILAI PR", value: data.pr, fill: PRPOGRIR_COLORS.pr },
    { name: "NILAI PO", value: data.po, fill: PRPOGRIR_COLORS.po },
    { name: "NILAI GR", value: data.gr, fill: PRPOGRIR_COLORS.gr },
    { name: "NILAI IR", value: data.ir, fill: PRPOGRIR_COLORS.ir },
  ];

  const legendItems = [
    { label: "NILAI PR", color: PRPOGRIR_COLORS.pr },
    { label: "NILAI PO", color: PRPOGRIR_COLORS.po },
    { label: "NILAI GR", color: PRPOGRIR_COLORS.gr },
    { label: "NILAI IR", color: PRPOGRIR_COLORS.ir },
  ];

  // Custom tooltip with currency format
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-semibold text-sm" style={{ color: item.fill }}>
            {item.name}
          </p>
          <p className="text-sm font-bold text-slate-700">
            {formatMoney(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty data
  if (!data || (data.pr === 0 && data.po === 0 && data.gr === 0 && data.ir === 0)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          className="text-sm font-bold text-white px-4 py-2"
          style={{ backgroundColor: TELKOM_COLORS.primary }}
        >
          {title}
        </div>
        <div className="flex items-center justify-center text-slate-400 p-8">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="text-sm font-bold text-white px-4 py-2"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        {title}
      </div>


      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 border-b border-slate-100">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] font-semibold text-slate-600">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={TELKOM_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              tickFormatter={(value) => {
                if (value >= 1e12) return `${(value / 1e12).toFixed(0)}tn`;
                if (value >= 1e9) return `${(value / 1e9).toFixed(0)}bn`;
                if (value >= 1e6) return `${(value / 1e6).toFixed(0)}m`;
                return value.toString();
              }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide={true}
              width={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={28}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ===== COMPONENT: Gap Analysis Chart =====
// Colors matching Telkom Corporate Identity
const GAP_COLORS = {
  prPo: TELKOM_COLORS.secondary, // Blue
  poGr: TELKOM_COLORS.primary,   // Red
  grIr: TELKOM_COLORS.dark,      // Black
};

interface GapData {
  prPo: number;
  poGr: number;
  grIr: number;
}

interface GapAnalysisChartProps {
  title: string;
  data: GapData;
  height?: number;
}

export function GapAnalysisChart({ title, data, height = 200 }: GapAnalysisChartProps) {
  const chartData = [
    { name: "PR-PO", value: data.prPo, fill: GAP_COLORS.prPo },
    { name: "PO-GR", value: data.poGr, fill: GAP_COLORS.poGr },
    { name: "GR-IR", value: data.grIr, fill: GAP_COLORS.grIr },
  ];

  const legendItems = [
    { label: "Selisih PR-PO (Rp)", color: GAP_COLORS.prPo },
    { label: "Selisih PO-GR (Rp)", color: GAP_COLORS.poGr },
    { label: "Selisih GR-IR (Rp)", color: GAP_COLORS.grIr },
  ];

  // Custom tooltip with currency format
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-semibold text-sm" style={{ color: item.fill }}>
            {item.name}
          </p>
          <p className="text-sm font-bold text-slate-700">
            {formatMoney(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty data
  if (!data || (data.prPo === 0 && data.poGr === 0 && data.grIr === 0)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          className="text-sm font-bold text-white px-4 py-2"
          style={{ backgroundColor: TELKOM_COLORS.primary }}
        >
          {title}
        </div>
        <div className="flex items-center justify-center text-slate-400 p-8">
          No gap data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="text-sm font-bold text-white px-4 py-2"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        {title}
      </div>


      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-b border-slate-100">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] font-semibold text-slate-600">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart - Vertical Bar */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={TELKOM_COLORS.grid} vertical={false} />
            <XAxis
              type="category"
              dataKey="name"
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              type="number"
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              tickFormatter={(value) => {
                if (value >= 1e12) return `${(value / 1e12).toFixed(0)}tn`;
                if (value >= 1e9) return `${(value / 1e9).toFixed(0)}bn`;
                if (value >= 1e6) return `${(value / 1e6).toFixed(0)}m`;
                return value.toString();
              }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// ===== COMPONENT: Average Duration Chart =====
interface AverageDurationChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function AverageDurationChart({ data, height = 300 }: AverageDurationChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div 
          className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
          style={{ backgroundColor: TELKOM_COLORS.primary }}
        >
          RATA-RATA DURASI UMUR PR
        </div>
        <div className="flex items-center justify-center text-slate-400 p-8 h-[300px]">
          No data available
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-bold text-sm text-slate-800 mb-1 max-w-[200px]">
            {label}
          </p>
          <p className="text-xs text-slate-500">
            Selisih PR-PO (Hari)
          </p>
          <p className="text-lg font-bold" style={{ color: TELKOM_COLORS.secondary }}>
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div 
        className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        RATA-RATA DURASI UMUR PR
      </div>
      
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 60 }} // Extra bottom margin for angled labels
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={TELKOM_COLORS.grid} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <YAxis 
              label={{ 
                value: 'Selisih PR-PO (Hari)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: TELKOM_COLORS.text, fontSize: 11, fontWeight: 500 } 
              }}
              tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 46, 36, 0.05)' }} />
            <Bar 
              dataKey="value" 
              fill={TELKOM_COLORS.secondary} 
              radius={[4, 4, 0, 0]}
              barSize={30} // Consistent bar size
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// ===== COMPONENT: Average PO Duration Chart (PO-GR difference in days) =====
interface AveragePODurationChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function AveragePODurationChart({ data, height = 300 }: AveragePODurationChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div 
          className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
          style={{ backgroundColor: TELKOM_COLORS.primary }}
        >
          RATA-RATA DURASI UMUR PO
        </div>
        <div className="flex items-center justify-center text-slate-400 p-8 h-[300px]">
          No data available
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-bold text-sm text-slate-800 mb-1 max-w-[200px]">
            {label}
          </p>
          <p className="text-xs text-slate-500">
            Selisih PO-GR (Hari)
          </p>
          <p className="text-lg font-bold" style={{ color: TELKOM_COLORS.secondary }}>
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div 
        className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        RATA-RATA DURASI UMUR PO
      </div>
      
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={TELKOM_COLORS.grid} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <YAxis 
              label={{ 
                value: 'Selisih PO-GR (Hari)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: TELKOM_COLORS.text, fontSize: 11, fontWeight: 500 } 
              }}
              tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 46, 36, 0.05)' }} />
            <Bar 
              dataKey="value" 
              fill={TELKOM_COLORS.secondary} 
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// ===== COMPONENT: Average GR Duration Chart (GR-IR difference in days) =====
interface AverageGRDurationChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function AverageGRDurationChart({ data, height = 300 }: AverageGRDurationChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div 
          className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
          style={{ backgroundColor: TELKOM_COLORS.primary }}
        >
          RATA-RATA DURASI UMUR GR
        </div>
        <div className="flex items-center justify-center text-slate-400 p-8 h-[300px]">
          No data available
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white px-3 py-2 rounded-lg shadow-lg border"
          style={{ borderColor: TELKOM_COLORS.grid }}
        >
          <p className="font-bold text-sm text-slate-800 mb-1 max-w-[200px]">
            {label}
          </p>
          <p className="text-xs text-slate-500">
            Selisih GR-IR (Hari)
          </p>
          <p className="text-lg font-bold" style={{ color: TELKOM_COLORS.secondary }}>
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div 
        className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        RATA-RATA DURASI UMUR GR
      </div>
      
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={TELKOM_COLORS.grid} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: TELKOM_COLORS.text, fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <YAxis 
              label={{ 
                value: 'Selisih GR-IR (Hari)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: TELKOM_COLORS.text, fontSize: 11, fontWeight: 500 } 
              }}
              tick={{ fill: TELKOM_COLORS.text, fontSize: 11 }}
              axisLine={{ stroke: TELKOM_COLORS.grid }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 46, 36, 0.05)' }} />
            <Bar 
              dataKey="value" 
              fill={TELKOM_COLORS.secondary} 
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// ===== COMPONENT: Detail LOP Table =====
interface DetailLOPTableProps {
  data: {
    distrik: string;
    subDistrik: string;
    idIhld: string;
    namaLop: string;
    statusTomps: string;
    wbs: string;
    nilaiBoqPlan: number;
  }[];
  itemsPerPage?: number;
}

export function DetailLOPTable({ data, itemsPerPage = 100 }: DetailLOPTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Format currency
  const formatNumber = (num: number) => {
    if (num === 0 || !num) return '-';
    return num.toLocaleString('id-ID');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        DETAIL LOP
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Distrik</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sub Distrik</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID IHLD</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama LOP</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status TOM...</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">WBS</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nilai BOQ ...</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((row, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-3 py-2.5 text-xs text-slate-500">{startIndex + idx + 1}.</td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[120px] truncate" title={row.distrik || 'null'}>
                  {row.distrik || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[140px] truncate" title={row.subDistrik || 'null'}>
                  {row.subDistrik || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700">
                  {row.idIhld || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[230px] truncate" title={row.namaLop || 'null'}>
                  {row.namaLop || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[100px] truncate" title={row.statusTomps || '-'}>
                  {row.statusTomps || '-'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[120px] truncate" title={row.wbs || '-'}>
                  {row.wbs || '-'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">
                  {formatNumber(row.nilaiBoqPlan)}
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-end gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            {startIndex + 1} - {Math.min(endIndex, data.length)} / {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COMPONENT: Detail LOP Table for Waspang Tab (with Status Proyek column) =====
interface DetailLOPTableWaspangProps {
  data: {
    distrik: string;
    subDistrik: string;
    idIhld: string;
    namaLop: string;
    statusProyek: string;
    statusTomps: string;
    wbs: string;
    nilaiBoqPlan: number;
  }[];
  itemsPerPage?: number;
}

export function DetailLOPTableWaspang({ data, itemsPerPage = 20 }: DetailLOPTableWaspangProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Format currency
  const formatNum = (num: number) => {
    if (num === 0 || !num) return 'null';
    return num.toLocaleString('id-ID');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="text-sm font-bold text-white px-4 py-3 text-center uppercase tracking-wide"
        style={{ backgroundColor: TELKOM_COLORS.primary }}
      >
        DETAIL LOP
      </div>

      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Distrik</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sub Distrik</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID IHLD</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama LOP</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status Proyek</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status TOMPS ▼</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">WBS</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nilai BOQ Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((row, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-3 py-2.5 text-xs text-slate-500">{startIndex + idx + 1}.</td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[100px] truncate" title={row.distrik || 'null'}>
                  {row.distrik || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[120px] truncate" title={row.subDistrik || 'null'}>
                  {row.subDistrik || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700">
                  {row.idIhld || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[250px] truncate" title={row.namaLop || 'null'}>
                  {row.namaLop || 'null'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700">
                  {row.statusProyek || '-'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[100px] truncate" title={row.statusTomps || '-'}>
                  {row.statusTomps || '-'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[120px] truncate" title={row.wbs || '-'}>
                  {row.wbs || '-'}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">
                  {formatNum(row.nilaiBoqPlan)}
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-end gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            {startIndex + 1} - {Math.min(endIndex, data.length)} / {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
