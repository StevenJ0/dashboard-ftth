import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusUpper = status ? status.toUpperCase() : "-";

  // Default Style (Gray)
  let colorClass = "bg-slate-100 text-slate-800 border-slate-200";

  if (statusUpper.includes("CLOSE") || statusUpper.includes("100")) {
    colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (statusUpper.includes("VALIDASI")) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (statusUpper.includes("PROGRESS")) {
    colorClass = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (statusUpper.includes("KENDALA") || statusUpper.includes("DROP")) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {status || "N/A"}
    </span>
  );
}
