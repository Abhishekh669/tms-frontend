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
  iconBg: string;
}

export function DashboardStats({ stats, isLoading }: Props) {
  const items: KpiItem[] = [
    {
      label: "Vacancies",
      value: `${stats?.active_vacancies ?? 0}/${stats?.total_vacancies ?? 0}`,
      sub: "Active / Total",
      icon: <Briefcase className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />,
      iconBg: "bg-teal-50 dark:bg-teal-950",
    },
    {
      label: "Tests",
      value: `${stats?.total_tests ?? 0}`,
      sub: "Active vacancies",
      icon: <ClipboardCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />,
      iconBg: "bg-sky-50 dark:bg-sky-950",
    },
    {
      label: "Pass Rate",
      value: `${stats?.pass_rate?.toFixed(1) ?? "0.0"}%`,
      sub: "Avg per vacancy",
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Due",
      value: `Rs.${((stats?.commission_due ?? 0) / 1000).toFixed(1)}k`,
      sub: "Commission",
      icon: <Banknote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-50 dark:bg-amber-950",
    },
  ];

  return (
    <div className="px-4 space-y-2">
      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        Overview
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm px-3 py-2.5 flex items-center gap-2.5"
          >
            {isLoading ? (
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-14 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                <div className="h-2.5 w-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-none">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
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