// components/revenue/RevenueOverviewCards.tsx

"use client";

import { AlertCircle, Banknote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetRevenueOverview } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `NPR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  dot?: string;
}

function StatCard({ label, value, sub, accent, dot }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/40 px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {dot && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-semibold tracking-tight leading-tight ${accent ?? ""}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function RevenueOverviewCards() {
  const { data, isLoading, error } = useGetRevenueOverview();

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Failed to load revenue overview</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground mt-0.5">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[84px] rounded-xl" />
        ))}
      </div>
    );
  }

  const o = data?.overview;

  if (!o) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 px-5 py-6 text-sm text-muted-foreground text-center">
        No revenue data available
      </div>
    );
  }

  const total = o.total_revenue ?? 0;
  const collected = (o.completed ?? 0) + (o.partial ?? 0);
  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Total revenue highlight */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Total commission revenue</p>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-primary">
            {fmt(total)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {collectedPct}% collected · {o.total_vacancies_with_payment ?? 0} vacancies with payments
          </p>
        </div>
        {/* Collection progress bar */}
        <div className="hidden sm:block w-40">
          <p className="text-[10px] text-muted-foreground mb-1.5">Collection progress</p>
          <div className="h-2 rounded-full bg-border/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${collectedPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{fmt(collected)} of {fmt(total)}</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Completed"
          value={fmt(o.completed ?? 0)}
          accent="text-emerald-600 dark:text-emerald-400"
          dot="#10b981"
        />
        <StatCard
          label="Partial"
          value={fmt(o.partial ?? 0)}
          accent="text-sky-600 dark:text-sky-400"
          dot="#0ea5e9"
        />
        <StatCard
          label="Pending"
          value={fmt(o.pending ?? 0)}
          accent="text-amber-600 dark:text-amber-400"
          dot="#f59e0b"
        />
        <StatCard
          label="Failed"
          value={fmt(o.failed ?? 0)}
          accent="text-rose-600 dark:text-rose-400"
          dot="#f43f5e"
        />
      </div>
    </div>
  );
}