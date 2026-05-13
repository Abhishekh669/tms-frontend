// components/teachers/TeacherGrowthChart.tsx

"use client";

import { useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AlertCircle, BarChart2, CalendarIcon, GraduationCap, X } from "lucide-react";
import {
  format,
  subDays,
  differenceInDays,
  addYears,
  isAfter,
  startOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { GrowthMode } from "@/utils/types/report.types";
import { useGetTeacherGrowth } from "@/utils/hooks/tanstack/report/use-get-teacher-report";

// ─────────────────────────────────────────────────────────────

const MAX_RANGE_DAYS = 365;
const BAR_COLOR = "#818cf8"; // indigo-400 — visible in both light and dark

const MODES: GrowthMode[] = ["daily", "weekly", "monthly"];
const MODE_LABEL: Record<GrowthMode, string> = {
  daily:   "Daily",
  weekly:  "Weekly",
  monthly: "Monthly",
};

function defaultRange(mode: GrowthMode): DateRange {
  const to = new Date();
  const fromDays =
    mode === "weekly" ? 8 * 7 : mode === "monthly" ? 8 * 30 : 8;
  return { from: subDays(to, fromDays), to };
}

// ─────────────────────────────────────────────────────────────

function GrowthError({ message }: { message?: string }) {
  return (
    <div className="h-56 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col items-center justify-center gap-2">
      <AlertCircle className="w-5 h-5 text-rose-400" />
      <p className="text-sm font-medium text-rose-400">Failed to load growth chart</p>
      {message && (
        <p className="text-xs text-muted-foreground max-w-xs text-center">{message}</p>
      )}
    </div>
  );
}

function GrowthEmpty() {
  return (
    <div className="h-56 rounded-lg border border-white/8 bg-white/3 flex flex-col items-center justify-center gap-2">
      <BarChart2 className="w-6 h-6 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">No data for the selected period</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

interface RangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

function RangePicker({ range, onChange }: RangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(range);

  const today = startOfDay(new Date());

  const maxToDate = useMemo(() => {
    if (!draft.from || draft.to) return null;
    const max = addYears(draft.from, 1);
    return isAfter(max, today) ? today : max;
  }, [draft.from, draft.to, today]);

  const committedDays = useMemo(() => {
    if (!range.from || !range.to) return 0;
    return differenceInDays(range.to, range.from);
  }, [range.from, range.to]);

  const isMidSelection = !!(draft.from && !draft.to);

  function handleSelect(selected: DateRange | undefined) {
    if (!selected) return;
    let { from, to } = selected;
    if (from && to) {
      const diff = differenceInDays(to, from);
      if (diff > MAX_RANGE_DAYS) {
        to = addYears(from, 1);
        if (isAfter(to, today)) to = today;
      }
      setDraft({ from, to });
      onChange({ from, to });
      setOpen(false);
      return;
    }
    setDraft(selected);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    const def = defaultRange("daily");
    setDraft(def);
    onChange(def);
  }

  function isDisabled(day: Date): boolean {
    if (isAfter(day, today)) return true;
    if (draft.from && !draft.to && maxToDate) {
      if (isAfter(day, maxToDate)) return true;
    }
    return false;
  }

  const progressPct = Math.min(100, Math.round((committedDays / MAX_RANGE_DAYS) * 100));
  const progressColor =
    progressPct >= 95 ? "bg-rose-400" :
    progressPct >= 70 ? "bg-amber-400" :
    "bg-indigo-400";

  const label = useMemo(() => {
    const { from, to } = range;
    if (!from) return "Pick a date range";
    if (!to)   return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  }, [range]);

  function handleOpenChange(val: boolean) {
    if (val) setDraft(range);
    setOpen(val);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 text-xs gap-1.5 font-normal pr-2 border-white/10 bg-white/5 hover:bg-white/10 text-foreground",
            !range.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
          <span className="truncate max-w-[220px]">{label}</span>
          {range.from && range.to && (
            <span
              onClick={handleClear}
              className="ml-1 rounded-sm hover:bg-white/10 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 shadow-xl border-white/10 bg-card"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── Status bar ── */}
        <div className="px-4 py-3 border-b border-white/8 space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-foreground">
              {isMidSelection ? (
                <span className="text-indigo-400">Step 2 — pick an end date</span>
              ) : (
                "Select date range"
              )}
            </p>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {isMidSelection && maxToDate
                ? `max end: ${format(maxToDate, "MMM d, yyyy")}`
                : committedDays > 0
                ? `${committedDays} day${committedDays !== 1 ? "s" : ""} selected`
                : "Max 1 year"}
            </span>
          </div>

          {committedDays > 0 && !isMidSelection && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{format(range.from!, "MMM d, yyyy")}</span>
                <span className={cn("font-medium", progressPct >= 95 && "text-rose-400")}>
                  {progressPct}% of 1-year limit
                  {progressPct >= 95 && " — at limit"}
                </span>
                <span>{format(range.to!, "MMM d, yyyy")}</span>
              </div>
            </div>
          )}

          {isMidSelection && maxToDate && (
            <div className="flex items-start gap-2 text-[11px] bg-white/5 rounded-md px-2.5 py-2">
              <CalendarIcon className="w-3 h-3 shrink-0 text-indigo-400 mt-0.5" />
              <div className="space-y-0.5">
                <p>
                  <span className="text-muted-foreground">Start: </span>
                  <span className="font-medium text-foreground">{format(draft.from!, "MMM d, yyyy")}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Latest allowed end: </span>
                  <span className="font-medium text-foreground">{format(maxToDate, "MMM d, yyyy")}</span>
                  <span className="text-muted-foreground"> ({differenceInDays(maxToDate, draft.from!)} days)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Calendar ── */}
        <Calendar
          mode="range"
          selected={draft}
          onSelect={handleSelect}
          disabled={isDisabled}
          numberOfMonths={2}
          defaultMonth={range.from ? range.from : subDays(new Date(), 30)}
        />

        {/* ── Quick presets ── */}
        {!isMidSelection && (
          <div className="px-3 pb-3 pt-2 border-t border-white/8">
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
              Quick select
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "7 days",   days: 7   },
                { label: "30 days",  days: 30  },
                { label: "90 days",  days: 90  },
                { label: "6 months", days: 182 },
                { label: "1 year",   days: 365 },
              ].map(({ label: pl, days }) => {
                const presetFrom = subDays(today, days);
                const isActive =
                  range.from &&
                  range.to &&
                  differenceInDays(today, range.from) === days &&
                  differenceInDays(today, range.to) === 0;
                return (
                  <button
                    key={pl}
                    onClick={() => {
                      const r = { from: presetFrom, to: today };
                      setDraft(r);
                      onChange(r);
                      setOpen(false);
                    }}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      isActive
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "border-white/10 text-muted-foreground hover:bg-white/8 hover:text-foreground"
                    )}
                  >
                    {pl}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────

export function TeacherGrowthChart() {
  const [mode, setMode] = useState<GrowthMode>("daily");
  const [range, setRange] = useState<DateRange>(defaultRange("daily"));

  const fromStr = range.from ? format(range.from, "yyyy-MM-dd") : "";
  const toStr   = range.to   ? format(range.to,   "yyyy-MM-dd") : "";

  const { data, isLoading, error } = useGetTeacherGrowth({
    mode,
    from: fromStr,
    to:   toStr,
  });

  const growth = data?.growth ?? null;

  const chartData = useMemo(() => {
    const points = growth?.points;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => ({
      period: p?.period ?? "",
      count:  p?.count  ?? 0,
    }));
  }, [growth]);

  function handleModeChange(m: GrowthMode) {
    setMode(m);
    setRange(defaultRange(m));
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card p-5 shadow-sm">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-indigo-500/15 p-2 text-indigo-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Teacher registrations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              New registrations over time · max 1-year range
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  mode === m
                    ? "bg-indigo-500 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          {/* Calendar range picker */}
          <RangePicker range={range} onChange={setRange} />
        </div>
      </div>

      {/* ── Chart body ── */}
      {error ? (
        <GrowthError
          message={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      ) : isLoading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <GrowthEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              formatter={(value: unknown) => [Number(value ?? 0).toLocaleString(), "Registrations"]}
            />
            <Bar
              dataKey="count"
              name="Registrations"
              fill={BAR_COLOR}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}