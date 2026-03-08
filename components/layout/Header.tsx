"use client";

import { Menu, LayoutDashboard, Calendar } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Telkom Indonesia Brand Colors
const TELKOM_COLORS = {
  red: "#EE2E24",
  dark: "#231F20",
  blue: "#0050AE",
  white: "#FFFFFF",
  gray: "#E6E7E8",
};

// Breadcrumb labels mapping
const breadcrumbMap: { [key: string]: string } = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/master-data": "Monitoring Data",
  "/dashboard/monitoring-witel": "Monitoring Witel",
  "/dashboard/monitoring-vendor": "Monitoring Vendor",
  "/dashboard/profile": "Profile",
};

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const currentLabel = breadcrumbMap[pathname] || "Dashboard";
  
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return { dayName, day, month, year };
  };

  const { dayName, day, month, year } = formatDate(currentDate);

  return (
    <header 
      className="h-16 bg-white flex items-center justify-between px-6 lg:px-8 shadow-sm z-10"
      style={{ borderBottom: `1px solid ${TELKOM_COLORS.gray}` }}
    >
      <div className="flex items-center gap-4">
        <Menu 
          className="w-6 h-6 lg:hidden cursor-pointer transition-colors" 
          style={{ color: TELKOM_COLORS.dark }}
          onMouseOver={(e) => e.currentTarget.style.color = TELKOM_COLORS.red}
          onMouseOut={(e) => e.currentTarget.style.color = TELKOM_COLORS.dark}
          onClick={onMenuClick}
        />

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <div className="p-1.5 bg-red-50 rounded text-red-600">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-800">{currentLabel}</span>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
        <Calendar className="w-4 h-4 text-red-500" />
        <div className="text-sm">
          <span className="font-semibold text-slate-800">{dayName}</span>
          <span className="text-slate-400 mx-1">•</span>
          <span className="text-slate-600">{day} {month} {year}</span>
        </div>
      </div>
    </header>
  );
}
