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

import { AlertCircle, BarChart2, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetVacancyTrend } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";
import { VacancyTrendMode } from "@/utils/types/report.types";

// ─────────────────────────────────────────────────────────────

// High-contrast colours that pop in dark mode
const STATUS_COLORS = {
  open:      "#38bdf8", // sky-400
  assigned:  "#a78bfa", // violet-400
  ongoing:   "#fb923c", // orange-400
  completed: "#4ade80", // green-400
  cancelled: "#f87171", // red-400
} as const;

const STATUS_KEYS = ["open", "assigned", "ongoing", "completed", "cancelled"] as const;

const MODES: VacancyTrendMode[] = ["daily", "weekly", "monthly"];
const MODE_LABEL: Record<VacancyTrendMode, string> = {
  daily:   "Daily",
  weekly:  "Weekly",
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
  if (mode === "weekly")  return daysAgo(8 * 7);
  if (mode === "monthly") return daysAgo(8 * 30);
  return daysAgo(8);
}
function enforceMaxRange(from: string, to: string): string {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (diff > oneYear) {
    return new Date(new Date(to).getTime() - oneYear)
      .toISOString()
      .slice(0, 10);
  }
  return from;
}

// ─────────────────────────────────────────────────────────────

export function VacancyTrendChart() {
  const [mode, setMode] = useState<VacancyTrendMode>("daily");
  const [to,   setTo]   = useState(today());
  const [from, setFrom] = useState(defaultFrom("daily"));

  const { data, isLoading, error } = useGetVacancyTrend({ mode, from, to });

  const chartData = useMemo(() => {
    const points = data?.trend?.points;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => ({
      period:    p?.period    ?? "",
      open:      p?.open      ?? 0,
      assigned:  p?.assigned  ?? 0,
      ongoing:   p?.ongoing   ?? 0,
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
    <div className="rounded-xl border border-white/10 bg-card p-5 shadow-sm">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-sky-500/15 p-2 text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Vacancy trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stacked by status · max 1-year range
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                mode === m
                  ? "bg-sky-500 text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Date range ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs text-muted-foreground shrink-0">From</span>
        <Input
          type="date"
          value={from}
          max={to}
          onChange={(e) => handleFromChange(e.target.value)}
          className="h-8 text-xs w-36 border-white/10 bg-white/5 text-foreground"
        />
        <span className="text-xs text-muted-foreground shrink-0">to</span>
        <Input
          type="date"
          value={to}
          max={today()}
          min={from}
          onChange={(e) => handleToChange(e.target.value)}
          className="h-8 text-xs w-36 border-white/10 bg-white/5 text-foreground"
        />
      </div>

      {/* ── Status legend pills ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_KEYS.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: `${STATUS_COLORS[key]}18`,
              color: STATUS_COLORS[key],
              border: `1px solid ${STATUS_COLORS[key]}40`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[key] }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </span>
        ))}
      </div>

      {/* ── Chart body ── */}
      {error ? (
        <div className="h-56 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-sm font-medium text-rose-400">Failed to load vacancy trend</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
      ) : isLoading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-56 rounded-lg border border-white/8 bg-white/3 flex flex-col items-center justify-center gap-2">
          <BarChart2 className="w-6 h-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.07)"
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
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(value: unknown, name: unknown) => {
                const num = Number(value ?? 0);
                const key = String(name ?? "");
                return [num.toLocaleString(), key.charAt(0).toUpperCase() + key.slice(1)];
              }}
            />
            {/* Hidden recharts Legend — replaced by our custom pills above */}
            {STATUS_KEYS.map((key) => (
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