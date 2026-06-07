"use client";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "amber" | "red" | "teal";
  trend?: string;
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-600",   text: "text-blue-700",   ring: "ring-blue-100" },
  green:  { bg: "bg-green-50",  icon: "bg-green-600",  text: "text-green-700",  ring: "ring-green-100" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-700", ring: "ring-purple-100" },
  amber:  { bg: "bg-amber-50",  icon: "bg-amber-600",  text: "text-amber-700",  ring: "ring-amber-100" },
  red:    { bg: "bg-red-50",    icon: "bg-red-600",    text: "text-red-700",    ring: "ring-red-100" },
  teal:   { bg: "bg-teal-50",   icon: "bg-teal-600",   text: "text-teal-700",   ring: "ring-teal-100" },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          {trend && <p className={`mt-2 text-xs font-semibold ${c.text}`}>{trend}</p>}
        </div>
        <div className={`${c.icon} p-3 rounded-xl shadow-lg ring-4 ${c.ring} group-hover:scale-110 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}
