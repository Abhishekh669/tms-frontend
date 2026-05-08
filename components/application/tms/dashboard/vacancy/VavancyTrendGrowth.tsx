// components/vacancies/VacancyTrendChart.tsx

"use client";

import { useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AlertCircle, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetVacancyTrend } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";
import { VacancyTrendMode } from "@/utils/types/report.types";

// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  open: "#0ea5e9",
  assigned: "#8b5cf6",
  ongoing: "#f59e0b",
  completed: "#10b981",
  cancelled: "#f43f5e",
} as const;

const MODES: VacancyTrendMode[] = ["daily", "weekly", "monthly"];
const MODE_LABEL: Record<VacancyTrendMode, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function defaultFrom(mode: VacancyTrendMode) {
  if (mode === "weekly") return daysAgo(8 * 7);
  if (mode === "monthly") return daysAgo(8 * 30);
  return daysAgo(8);
}
function enforceMaxRange(from: string, to: string): string {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (diff > oneYear) {
    return new Date(new Date(to).getTime() - oneYear).toISOString().slice(0, 10);
  }
  return from;
}

// ─────────────────────────────────────────────────────────────

export function VacancyTrendChart() {
  const [mode, setMode] = useState<VacancyTrendMode>("daily");
  const [to, setTo] = useState(today());
  const [from, setFrom] = useState(defaultFrom("daily"));

  const { data, isLoading, error } = useGetVacancyTrend({ mode, from, to });

  const chartData = useMemo(() => {
    const points = data?.trend?.points;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => ({
      period: p?.period ?? "",
      open: p?.open ?? 0,
      assigned: p?.assigned ?? 0,
      ongoing: p?.ongoing ?? 0,
      completed: p?.completed ?? 0,
      cancelled: p?.cancelled ?? 0,
    }));
  }, [data]);

  function handleModeChange(m: VacancyTrendMode) {
    setMode(m);
    setFrom(defaultFrom(m));
    setTo(today());
  }
  function handleFromChange(val: string) {
    if (!val) return;
    setFrom(enforceMaxRange(val, to));
  }
  function handleToChange(val: string) {
    if (!val) return;
    setTo(val);
    setFrom(enforceMaxRange(from, val));
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold">Vacancy trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stacked by status · max 1-year range
          </p>
        </div>

        <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                mode === m
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 text-xs">
        <span className="text-muted-foreground shrink-0">From</span>
        <Input
          type="date"
          value={from}
          max={to}
          onChange={(e) => handleFromChange(e.target.value)}
          className="h-8 text-xs w-36"
        />
        <span className="text-muted-foreground shrink-0">to</span>
        <Input
          type="date"
          value={to}
          max={today()}
          min={from}
          onChange={(e) => handleToChange(e.target.value)}
          className="h-8 text-xs w-36"
        />
      </div>

      {error ? (
        <div className="h-48 rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-medium text-destructive">Failed to load vacancy trend</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
      ) : isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-48 rounded-lg border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2">
          <BarChart2 className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              formatter={(value) =>
                value.charAt(0).toUpperCase() + value.slice(1)
              }
            />
            {(
              [
                "open",
                "assigned",
                "ongoing",
                "completed",
                "cancelled",
              ] as const
            ).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                stackId="a"
                fill={STATUS_COLORS[key]}
                radius={key === "cancelled" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}