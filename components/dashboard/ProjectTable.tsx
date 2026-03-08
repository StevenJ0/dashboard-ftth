import React from "react";
import StatusBadge from "@/components/ui/StatusBadge"; // Import dari UI

interface ProjectRow {
  id: string;
  name: string;
  witel: string;
  vendor: string;
  value: string;
  status: string;
}

export default function ProjectTable({ data }: { data: ProjectRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">
          Project Monitoring (Terbaru)
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-white hover:text-red-600 transition-colors bg-white shadow-sm">
            Filter
          </button>
          <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-white hover:text-red-600 transition-colors bg-white shadow-sm">
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">WBS ID & Project</th>
              <th className="px-6 py-4">Witel</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Nilai PO</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-red-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 group-hover:text-red-600 transition-colors">
                      {row.id}
                    </div>
                    <div
                      className="text-xs text-slate-500 truncate max-w-[200px]"
                      title={row.name}
                    >
                      {row.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {row.witel || "-"}
                  </td>
                  <td
                    className="px-6 py-4 text-slate-600 truncate max-w-[150px]"
                    title={row.vendor}
                  >
                    {row.vendor || "-"}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.value}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-400 italic"
                >
                  Tidak ada data proyek yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 text-center bg-slate-50/30">
        <button className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
          Lihat Semua Data &rarr;
        </button>
      </div>
    </div>
  );
}
