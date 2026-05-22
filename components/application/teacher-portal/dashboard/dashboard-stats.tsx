"use client";

import { TeacherDashboardStats } from "@/utils/types/report.types";
import { Briefcase, ClipboardCheck, TrendingUp, Banknote } from "lucide-react";

interface Props {
  stats: TeacherDashboardStats | undefined;
  isLoading: boolean;
}

interface KpiItem {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  dot: string; // small coloured dot class
}

export function DashboardStats({ stats, isLoading }: Props) {
  const items: KpiItem[] = [
    {
      label: "Vacancies",
      value: `${stats?.active_vacancies ?? 0}/${stats?.total_vacancies ?? 0}`,
      sub: "Active / Total",
      icon: <Briefcase className="h-3.5 w-3.5 text-teal-600" />,
      dot: "bg-teal-500",
    },
    {
      label: "Tests",
      value: `${stats?.total_tests ?? 0}`,
      sub: "Active vacancies",
      icon: <ClipboardCheck className="h-3.5 w-3.5 text-sky-600" />,
      dot: "bg-sky-500",
    },
    {
      label: "Pass Rate",
      value: `${stats?.pass_rate?.toFixed(1) ?? "0.0"}%`,
      sub: "Avg per vacancy",
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
      dot: "bg-emerald-500",
    },
    {
      label: "Due",
      value: `Rs.${((stats?.commission_due ?? 0) / 1000).toFixed(1)}k`,
      sub: "Commission",
      icon: <Banknote className="h-3.5 w-3.5 text-amber-600" />,
      dot: "bg-amber-500",
    },
  ];

  return (
    <div className="px-4 space-y-2">
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
        Overview
      </p>

      {/* 2×2 compact grid */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-zinc-100 shadow-sm px-3 py-2.5 flex items-center gap-2.5"
          >
            {isLoading ? (
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-14 bg-zinc-100 animate-pulse rounded" />
                <div className="h-2.5 w-10 bg-zinc-100 animate-pulse rounded" />
              </div>
            ) : (
              <>
                {/* Left: icon dot */}
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${item.dot} bg-opacity-10`}
                  style={{ backgroundColor: undefined }}
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-zinc-50`}>
                    {item.icon}
                  </div>
                </div>

                {/* Right: value + labels */}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-800 leading-none">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">
                    {item.label} · {item.sub}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}