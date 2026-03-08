// components/dashboard/DashboardView.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CapexTab from "./tabs/CapexTab";
import WaspangTab from "./tabs/WaspangTab";
import { DashboardData } from "@/types/dashboard";

// Telkom Indonesia Brand Colors
const TELKOM_COLORS = {
  red: "#EE2E24",
  dark: "#231F20",
  blue: "#0050AE",
  white: "#FFFFFF",
  gray: "#E6E7E8",
};

// Animation variants
const tabContentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const tabButtonVariants = {
  inactive: { scale: 1 },
  active: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export default function DashboardView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<"waspang" | "capex">("waspang");

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Overview of WASPANG and CAPEX project reports</p>
      </div>

      {/* Tab Navigation */}
      <div 
        className="flex space-x-2 mb-6 pb-1"
        style={{ borderBottom: `1px solid ${TELKOM_COLORS.gray}` }}
      >
        <motion.button
          onClick={() => setActiveTab("waspang")}
          variants={tabButtonVariants}
          initial="inactive"
          animate={activeTab === "waspang" ? "active" : "inactive"}
          whileTap="tap"
          className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
          style={{
            backgroundColor: activeTab === "waspang" ? TELKOM_COLORS.white : "transparent",
            color: activeTab === "waspang" ? TELKOM_COLORS.red : "#6B7280",
            border: activeTab === "waspang" ? `1px solid ${TELKOM_COLORS.gray}` : "none",
            borderBottom: activeTab === "waspang" ? "none" : undefined,
          }}
        >
          WASPANG Report
          {activeTab === "waspang" && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: TELKOM_COLORS.red }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("capex")}
          variants={tabButtonVariants}
          initial="inactive"
          animate={activeTab === "capex" ? "active" : "inactive"}
          whileTap="tap"
          className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
          style={{
            backgroundColor: activeTab === "capex" ? TELKOM_COLORS.white : "transparent",
            color: activeTab === "capex" ? TELKOM_COLORS.red : "#6B7280",
            border: activeTab === "capex" ? `1px solid ${TELKOM_COLORS.gray}` : "none",
            borderBottom: activeTab === "capex" ? "none" : undefined,
          }}
        >
          CAPEX Report
          {activeTab === "capex" && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: TELKOM_COLORS.red }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      </div>

      {/* Content Area with AnimatePresence */}
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
            <WaspangTab data={data} />
          ) : (
            <CapexTab data={data} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

