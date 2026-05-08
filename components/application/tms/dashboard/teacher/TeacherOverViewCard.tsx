// components/teachers/TeacherOverviewCards.tsx

"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTeacherOverview } from "@/utils/hooks/tanstack/report/use-get-teacher-report";

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/40 px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${accent ?? ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function OverviewError({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-start gap-3">
      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load overview</p>
        {message && (
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        )}
      </div>
    </div>
  );
}

function OverviewEmpty() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {["Total teachers", "On duty", "Vacant", "Male", "Female"].map((label) => (
        <div
          key={label}
          className="rounded-xl border border-border/50 bg-muted/40 px-5 py-4"
        >
          <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-muted-foreground/40">—</p>
        </div>
      ))}
    </div>
  );
}

export function TeacherOverviewCards() {
  const { data, isLoading, error } = useGetTeacherOverview();

  if (error) {
    return (
      <OverviewError
        message={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[82px] rounded-xl" />
        ))}
      </div>
    );
  }

  const overview = data?.overview;

  if (!overview) {
    return <OverviewEmpty />;
  }

  const total = overview.total ?? 0;
  const onDuty = overview.on_duty ?? 0;
  const vacant = overview.vacant ?? 0;
  const male = overview.male ?? 0;
  const female = overview.female ?? 0;

  const dutyPct = total > 0 ? Math.round((onDuty / total) * 100) : 0;
  const vacantPct = total > 0 ? Math.round((vacant / total) * 100) : 0;
  const malePct = total > 0 ? Math.round((male / total) * 100) : 0;
  const femalePct = total > 0 ? Math.round((female / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard label="Total teachers" value={total} />
      <StatCard
        label="On duty"
        value={onDuty}
        sub={`${dutyPct}% of total`}
        accent="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Vacant"
        value={vacant}
        sub={`${vacantPct}% of total`}
        accent="text-amber-600 dark:text-amber-400"
      />
      <StatCard label="Male" value={male} sub={`${malePct}%`} />
      <StatCard label="Female" value={female} sub={`${femalePct}%`} />
    </div>
  );
}