// components/revenue/RevenueTrendChart.tsx

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

import type { RevenueTrendMode } from "@/utils/types/report.types";
import { useGetRevenueTrend } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";

// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  completed: "#10b981",
  partial: "#0ea5e9",
  pending: "#f59e0b",
  failed: "#f43f5e",
} as const;

const MODES: RevenueTrendMode[] = ["daily", "weekly", "monthly"];
const MODE_LABEL: Record<RevenueTrendMode, string> = {
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
function defaultFrom(mode: RevenueTrendMode) {
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

function fmtNpr(value: number) {
  if (value >= 1_000_000) return `NPR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `NPR ${(value / 1_000).toFixed(0)}K`;
  return `NPR ${value.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────

export function RevenueTrendChart() {
  const [mode, setMode] = useState<RevenueTrendMode>("monthly");
  const [to, setTo] = useState(today());
  const [from, setFrom] = useState(defaultFrom("monthly"));

  const { data, isLoading, error } = useGetRevenueTrend({ mode, from, to });

  const chartData = useMemo(() => {
    const points = data?.trend?.points;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => ({
      period: p?.period ?? "",
      completed: p?.completed ?? 0,
      partial: p?.partial ?? 0,
      pending: p?.pending ?? 0,
      failed: p?.failed ?? 0,
    }));
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
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold">Revenue trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Payment collected by status · max 1-year range
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
          <p className="text-sm font-medium text-destructive">Failed to load revenue trend</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
      ) : isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-48 rounded-lg border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2">
          <BarChart2 className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No revenue data for selected period</p>
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
              width={52}
              tickFormatter={fmtNpr}
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
  formatter={(value: unknown, name: unknown) => {
    const num = Number(value ?? 0);

    return [
      `NPR ${num.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      String(name ?? "")
        .charAt(0)
        .toUpperCase() + String(name ?? "").slice(1),
    ];
  }}
/>        <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            {(["completed", "partial", "pending", "failed"] as const).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                stackId="a"
                fill={STATUS_COLORS[key]}
                radius={key === "failed" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}