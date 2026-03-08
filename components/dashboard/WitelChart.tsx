import React from "react";

interface WitelData {
  name: string;
  po_value: number;
  lop_count: number;
}

export default function WitelChart({ data }: { data: WitelData[] }) {
  const maxVal = Math.max(...data.map((d) => d.po_value), 1);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">
          Top 5 Witel (Anggaran PO)
        </h3>
        <button className="text-sm text-red-600 font-medium hover:underline">
          Lihat Semua
        </button>
      </div>
      <div className="space-y-5">
        {data.length > 0 ? (
          data.map((witel, idx) => (
            <div key={idx} className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{witel.name}</span>
                <span className="text-slate-500 font-medium">
                  {(witel.po_value / 1000000000).toFixed(1)} Miliar
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(witel.po_value / maxVal) * 100}%` }}
                ></div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">
            Belum ada data witel
          </div>
        )}
      </div>
    </div>
  );
}
