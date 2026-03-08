"use client";

import { LayoutDashboard, Map, Users, Activity, X, User, LogOut, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Telkom Indonesia Brand Colors
const TELKOM_COLORS = {
  red: "#EE2E24",
  dark: "#231F20",
  blue: "#0050AE",
  white: "#FFFFFF",
  gray: "#E6E7E8",
};

// Animation variants - simplified to prevent re-animation on navigation
const sidebarVariants: Variants = {
  hidden: { x: -280, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const mobileSidebarVariants: Variants = {
  closed: { x: "-100%", opacity: 0 },
  open: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
};

const logoVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "backOut" },
  },
};

// NavItem variants - always visible to prevent disappearing on navigation
const navItemVariants: Variants = {
  hidden: { x: 0, opacity: 1 },
  visible: {
    x: 0,
    opacity: 1,
  },
};

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Activity, label: "Monitoring Data", href: "/dashboard/master-data" },
  { icon: Map, label: "Monitoring Witel", href: "/dashboard/monitoring-witel" },
  { icon: Users, label: "Monitoring Vendor", href: "/dashboard/monitoring-vendor" },
];



interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
}

export default function Sidebar({ isOpen = false, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  const [userProfile, setUserProfile] = useState<any>(user || null);
  const [loading, setLoading] = useState(!user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <motion.div
        className="h-16 flex items-center px-6 border-b shrink-0 justify-between"
        style={{ borderColor: TELKOM_COLORS.gray }}
        variants={logoVariants}
      >
        <div className="flex items-center gap-1">
          <motion.div
            className="w-15 h-15 flex items-center justify-center p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
             <img src="/images/telkom-logo.png" alt="Telkom Logo" className="w-full h-full object-contain" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ color: TELKOM_COLORS.dark }}>
            CAPEX<span style={{ color: TELKOM_COLORS.red }}>MGT</span>
          </span>
        </div>
        
        {/* Mobile Close Button */}
        <div className="md:hidden">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <motion.p
          className="px-2 text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "#9CA3AF" }}
          variants={navItemVariants}
        >
          Main Menu
        </motion.p>
        {menuItems.map((item, index) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href}
            index={index}
          />
        ))}


      </nav>

      {/* User Profile - Enhanced */}
      <div
        className="p-4 border-t shrink-0"
        style={{ borderColor: TELKOM_COLORS.gray }}
      >
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {userProfile?.role || 'Guest'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
            <Link href="/dashboard/profile" className="flex-1">
              <button className="w-full text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-white py-1.5 px-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <User className="w-3.5 h-3.5 inline mr-1" />
                Profile
              </button>
            </Link>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="flex-1 text-xs font-medium text-red-600 hover:bg-red-50 py-1.5 px-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut className="w-3.5 h-3.5 inline mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - using initial={false} to prevent re-animation on navigation */}
      <motion.aside
        className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0 z-30"
        style={{ borderColor: TELKOM_COLORS.gray }}
        initial={false}
        animate={{ x: 0, opacity: 1 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 md:hidden flex flex-col shadow-2xl"
              variants={mobileSidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Logout</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Apakah Anda yakin ingin keluar dari akun Anda?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                        window.location.href = '/auth/login';
                      });
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-md"
                  >
                    Ya, Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  active = false,
  index = 0,
}: {
  icon: any;
  label: string;
  href: string;
  active?: boolean;
  index?: number;
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          active
            ? "font-medium"
            : "hover:bg-gray-50"
        }`}
        style={{
          backgroundColor: active ? "rgba(238, 46, 36, 0.08)" : undefined,
          color: active ? TELKOM_COLORS.red : "#4B5563",
          boxShadow: active ? "inset 0 0 0 1px rgba(238, 46, 36, 0.2)" : undefined,
        }}
        variants={navItemVariants}
        whileHover={{ x: 6, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div whileHover={{ rotate: active ? 0 : 15 }}>
          <Icon
            className="w-5 h-5"
            style={{ color: active ? TELKOM_COLORS.red : "#9CA3AF" }}
          />
        </motion.div>
        <span className="text-sm">{label}</span>
        {active && (
          <motion.div
            className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: TELKOM_COLORS.red }}
            initial={false}
            animate={{ scale: 1 }}
          />
        )}
      </motion.div>
    </Link>
  );
}
