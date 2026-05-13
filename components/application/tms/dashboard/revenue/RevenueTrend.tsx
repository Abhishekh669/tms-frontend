// components/revenue/RevenueTrendChart.tsx

"use client";

import { useMemo, useState } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AlertCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import type { RevenueTrendMode } from "@/utils/types/report.types";
import { useGetRevenueTrend } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

// Vibrant, high-contrast colours that work in both light and dark modes
const LINE_COLORS = {
  earned:   "#22d3ee", // cyan-400  — actual collected revenue
  expected: "#a78bfa", // violet-400 — expected / pending revenue
} as const;

const MODES: RevenueTrendMode[] = ["daily", "weekly", "monthly"];
const MODE_LABEL: Record<RevenueTrendMode, string> = {
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
function defaultFrom(mode: RevenueTrendMode) {
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

function fmtNpr(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
  return `${value.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────

export function RevenueTrendChart() {
  const [mode, setMode] = useState<RevenueTrendMode>("monthly");
  const [to,   setTo]   = useState(today());
  const [from, setFrom] = useState(defaultFrom("monthly"));

  const { data, isLoading, error } = useGetRevenueTrend({ mode, from, to });

  // Map API points → { period, earned, expected }
  // "earned"   = completed payments
  // "expected" = completed + partial + pending (what should have come in)
  const chartData = useMemo(() => {
    const points = data?.trend?.points;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => {
      const completed = p?.completed ?? 0;
      const partial   = p?.partial   ?? 0;
      const pending   = p?.pending   ?? 0;
      return {
        period:   p?.period ?? "",
        earned:   completed,
        expected: completed + partial + pending,
      };
    });
  }, [data]);

  function handleModeChange(m: RevenueTrendMode) {
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
          <div className="mt-0.5 rounded-lg bg-cyan-500/15 p-2 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Revenue trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expected income vs earned income · max 1-year range
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
                  ? "bg-cyan-500 text-white"
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

      {/* ── Chart body ── */}
      {error ? (
        <div className="h-56 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-sm font-medium text-rose-400">Failed to load revenue trend</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
      ) : isLoading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-56 rounded-lg border border-white/8 bg-white/3 flex flex-col items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No revenue data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              width={48}
              tickFormatter={(v) => `${fmtNpr(v)}`}
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
              formatter={(value: unknown, name: unknown) => {
                const num = Number(value ?? 0);
                const key = String(name ?? "");
                return [
                  `NPR ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  key === "earned" ? "Earned income" : "Expected income",
                ];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
              formatter={(value) =>
                value === "earned" ? "Earned income" : "Expected income"
              }
            />
            {/* Expected income — dashed, lighter */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke={LINE_COLORS.expected}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            {/* Earned income — solid, primary */}
            <Line
              type="monotone"
              dataKey="earned"
              stroke={LINE_COLORS.earned}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}