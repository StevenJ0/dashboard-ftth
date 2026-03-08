import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusData {
  label: string;
  count: number;
}

export default function StatusChart({ data }: { data: StatusData[] }) {
  // Hitung total untuk persentase
  const totalProjects = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Status Proyek</h3>
      <div className="space-y-5 flex-1">
        {data.length > 0 ? (
          data.map((status, idx) => {
            // Logic Warna
            let color = "bg-slate-500";
            const labelUpper = status.label ? status.label.toUpperCase() : "";

            if (labelUpper.includes("CLOSE")) color = "bg-emerald-500";
            else if (labelUpper.includes("VALIDASI")) color = "bg-amber-500";
            else if (labelUpper.includes("PROGRESS")) color = "bg-blue-500";
            else if (
              labelUpper.includes("KENDALA") ||
              labelUpper.includes("DROP")
            )
              color = "bg-red-500";

            return (
              <StatusRow
                key={idx}
                label={status.label}
                count={status.count}
                total={totalProjects}
                color={color}
              />
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-400">
            Belum ada status
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Periksa proyek status "Kendala"</span>
        </div>
      </div>
    </div>
  );
}

// Sub-component lokal
function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span
          className="text-slate-600 font-medium truncate w-32"
          title={label}
        >
          {label || "N/A"}
        </span>
        <span className="font-medium text-slate-900">
          {count} ({percent}%)
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
