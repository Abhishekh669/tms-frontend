// components/vacancies/VacancyOverviewCards.tsx

"use client";

import { AlertCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetVacancyOverview } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  accent?: string;
  dot?: string;
}

function StatCard({ label, value, sub, accent, dot }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/40 px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {dot && (
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: dot }}
          />
        )}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${accent ?? ""}`}>
        {value.toLocaleString()}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function OverviewError({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-start gap-3">
      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load vacancy overview</p>
        {message && <p className="text-xs text-muted-foreground mt-0.5">{message}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function VacancyOverviewCards() {
  const { data, isLoading, error } = useGetVacancyOverview();

  if (error) {
    return (
      <OverviewError
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[84px] rounded-xl" />
        ))}
      </div>
    );
  }

  const o = data?.overview;

  if (!o) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 px-5 py-6 text-sm text-muted-foreground text-center">
        No vacancy data available
      </div>
    );
  }

  const total = o.total ?? 0;
  const pct = (n: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}% of total` : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      <StatCard label="Total vacancies" value={total} />

      <StatCard
        label="Open"
        value={o.open ?? 0}
        sub={pct(o.open ?? 0)}
        accent="text-sky-600 dark:text-sky-400"
        dot="#0ea5e9"
      />
      <StatCard
        label="Assigned"
        value={o.assigned ?? 0}
        sub={pct(o.assigned ?? 0)}
        accent="text-violet-600 dark:text-violet-400"
        dot="#8b5cf6"
      />
      <StatCard
        label="Ongoing"
        value={o.ongoing ?? 0}
        sub={pct(o.ongoing ?? 0)}
        accent="text-amber-600 dark:text-amber-400"
        dot="#f59e0b"
      />
      <StatCard
        label="Completed"
        value={o.completed ?? 0}
        sub={pct(o.completed ?? 0)}
        accent="text-emerald-600 dark:text-emerald-400"
        dot="#10b981"
      />
      <StatCard
        label="Cancelled"
        value={o.cancelled ?? 0}
        sub={pct(o.cancelled ?? 0)}
        accent="text-rose-600 dark:text-rose-400"
        dot="#f43f5e"
      />

      {/* Last 7 days card — slightly highlighted */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingUp className="w-3 h-3 text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Last 7 days</p>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-primary">
          {(o.last_7_days ?? 0).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">new vacancies</p>
      </div>
    </div>
  );
}