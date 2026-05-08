// components/vacancies/SupplyDemandTable.tsx

"use client";

import { useMemo, useState } from "react";
import { AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetSupplyDemand } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

function GapBadge({ gap }: { gap: number }) {
  if (gap > 0) {
    return (
      <Badge
        variant="outline"
        className="border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 gap-1"
      >
        <TrendingDown className="w-3 h-3" />
        +{gap} short
      </Badge>
    );
  }
  if (gap < 0) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 gap-1"
      >
        <TrendingUp className="w-3 h-3" />
        {Math.abs(gap)} surplus
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border text-muted-foreground gap-1"
    >
      <Minus className="w-3 h-3" />
      Balanced
    </Badge>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function SupplyDemandTable() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useGetSupplyDemand();

  const rows = useMemo(() => {
    const raw = data?.rows;
    if (!Array.isArray(raw)) return [];
    return raw.filter((r) => r != null);
  }, [data]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.location ?? "").toLowerCase().includes(q));
  }, [rows, filter]);

  const maxVacancy = useMemo(
    () => Math.max(1, ...filtered.map((r) => r.vacancy_count ?? 0)),
    [filtered]
  );
  const maxTeacher = useMemo(
    () => Math.max(1, ...filtered.map((r) => r.teacher_count ?? 0)),
    [filtered]
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold">Supply vs demand</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active vacancies (demand) vs available teachers (supply) by location
          </p>
        </div>
        <Input
          placeholder="Filter location..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-xs w-44"
          disabled={isLoading || !!error}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Failed to load supply vs demand</p>
            {error instanceof Error && (
              <p className="text-xs text-muted-foreground mt-0.5">{error.message}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-6">#</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Demand (vacancies)</TableHead>
                <TableHead>Supply (teachers)</TableHead>
                <TableHead className="text-right">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                    {filter ? `No locations matching "${filter}"` : "No data available"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, i) => (
                  <TableRow key={`${row.location}-${i}`} className="text-sm">
                    <TableCell className="text-xs text-muted-foreground/60 font-mono">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium max-w-[160px] truncate">
                      {row.location ?? "—"}
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <MiniBar
                        value={row.vacancy_count ?? 0}
                        max={maxVacancy}
                        color="#f59e0b"
                      />
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <MiniBar
                        value={row.teacher_count ?? 0}
                        max={maxTeacher}
                        color="#10b981"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <GapBadge gap={row.gap ?? 0} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}