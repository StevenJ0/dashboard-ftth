"use client";

import { LucideIcon } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface KPICardProps {
  title: string;
  amount: string;
  trend: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  index?: number; // For stagger animation
}

// Animation variants
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const iconVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.15, 
    rotate: [0, -10, 10, 0],
    transition: { duration: 0.3 }
  },
};

const trendVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.1 },
};

export default function KPICard({
  title,
  amount,
  trend,
  desc,
  icon: Icon,
  color,
  bg,
  index = 0,
}: KPICardProps) {
  const isPositive = trend.includes("+");

  return (
    <motion.div
      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group cursor-default"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-4">
        <motion.div
          className={`p-3 rounded-lg ${bg}`}
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </motion.div>
        <motion.span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPositive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
          variants={trendVariants}
          initial="initial"
          whileHover="hover"
        >
          {trend}
        </motion.span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <motion.h3
          className="text-2xl font-bold text-slate-900"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
        >
          {amount}
        </motion.h3>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </div>
    </motion.div>
  );
}
