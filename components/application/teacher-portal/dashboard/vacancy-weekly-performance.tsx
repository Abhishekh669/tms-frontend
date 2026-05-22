"use client";

import { useEffect, useState } from "react";
import {
  ActiveVacancyDropdownItem,
  VacancyWeeklyProgress,
  WeeklyTestRecord,
} from "@/utils/types/report.types";
import { useGetVacancyWeeklyPerformance } from "@/utils/hooks/tanstack/report/use-get-teacher-overall-stats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  AlertCircle,
  BookOpen,
  TrendingUp,
  BarChart3,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  dropdownItems: ActiveVacancyDropdownItem[] | undefined;
  isLoading: boolean;
}

// ── Mini stat strip ───────────────────────────────────────────────────────────
function StatStrip({ progress }: { progress: VacancyWeeklyProgress }) {
  const passed = progress.tests.filter((t) => t.passed).length;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[
        { label: "Tests",     val: `${progress.total_tests}`,           color: "text-zinc-700" },
        { label: "Passed",    val: `${passed}/${progress.total_tests}`, color: "text-emerald-600" },
        { label: "Avg GPA",  val: progress.avg_gpa.toFixed(2),         color: "text-teal-600" },
      ].map((s) => (
        <div key={s.label} className="bg-zinc-50 rounded-xl p-2 text-center">
          <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
          <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartPoint;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-md px-3 py-2 text-xs space-y-0.5">
      <p className="font-semibold text-zinc-700">{d.label}</p>
      <p className="text-zinc-500">
        Mark: <span className="font-bold text-zinc-700">{d.mark}/{d.full}</span>
      </p>
      <p className="text-zinc-500">
        GPA: <span className="font-bold text-teal-600">{d.gpa.toFixed(2)}</span>
      </p>
      <p className={d.passed ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
        {d.passed ? "✓ Passed" : "✗ Failed"}
      </p>
    </div>
  );
}

interface ChartPoint {
  label: string;  // "Test 1", "Test 2" …
  mark: number;
  full: number;
  pass: number;
  gpa: number;
  passed: boolean;
  pct: number;    // student_mark / full_marks * 100 for area chart
}

// ── Chart view ────────────────────────────────────────────────────────────────
function PerformanceChart({ tests }: { tests: WeeklyTestRecord[] }) {
  const points: ChartPoint[] = tests.map((t, i) => ({
    label: `T${i + 1}`,
    mark: t.student_mark,
    full: t.full_marks,
    pass: t.pass_marks,
    gpa: t.gpa,
    passed: t.passed,
    pct: Math.round((t.student_mark / t.full_marks) * 100),
  }));

  // pass-mark % (use first test's ratio as guide line)
  const passLineValue = tests[0]
    ? Math.round((tests[0].pass_marks / tests[0].full_marks) * 100)
    : 50;

  return (
    <div className="space-y-2">
      {/* Score area chart */}
      <div className="bg-white rounded-xl border border-zinc-100 p-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Score % per test
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
            />
            {/* Pass-mark reference line */}
            <ReferenceLine
              y={passLineValue}
              stroke="#f87171"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: "Pass", position: "right", fontSize: 9, fill: "#f87171" }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e4e4e7", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="pct"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.label}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.passed ? "#0d9488" : "#f87171"}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* GPA bar chart (manual bars — lightweight) */}
      <div className="bg-white rounded-xl border border-zinc-100 p-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          GPA per test (0 – 4.0)
        </p>
        <div className="flex items-end gap-1.5 h-16">
          {points.map((p) => {
            const heightPct = Math.max(4, (p.gpa / 4.0) * 100);
            const color = p.gpa >= 3.5
              ? "bg-emerald-500"
              : p.gpa >= 2.5
              ? "bg-teal-500"
              : p.gpa >= 1.5
              ? "bg-amber-400"
              : "bg-rose-400";
            return (
              <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-zinc-400 font-semibold">
                  {p.gpa.toFixed(1)}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: "44px" }}>
                  <div
                    className={`w-full rounded-t-md ${color} transition-all`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[8px] text-zinc-400">{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact test legend */}
      <div className="bg-white rounded-xl border border-zinc-100 p-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Test details
        </p>
        {tests.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-2 py-1.5 border-b border-zinc-50 last:border-0"
          >
            <span className="text-[10px] font-mono text-zinc-300 w-5 shrink-0">
              T{i + 1}
            </span>
            <span className="text-xs font-medium text-zinc-600 flex-1 truncate">
              {t.subject}
            </span>
            <span className="text-[10px] text-zinc-400 shrink-0">
              {format(new Date(t.submitted_date), "dd MMM")}
            </span>
            <span className="text-[10px] font-semibold text-zinc-600 shrink-0">
              {t.student_mark}/{t.full_marks}
            </span>
            <span className="shrink-0">
              {t.passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
              )}
            </span>
            <span className="shrink-0">
              {t.verified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-300" />
              )}
            </span>
            {t.image_link && (
              <a
                href={t.image_link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <ImageIcon className="h-3.5 w-3.5 text-teal-400" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress content (after vacancy selected) ─────────────────────────────────
function WeeklyProgressContent({ vacancyId }: { vacancyId: string }) {
  const { data, isLoading, isError } = useGetVacancyWeeklyPerformance(vacancyId);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-44 bg-zinc-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !data?.weekly_progress) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-8 text-center">
        <AlertCircle className="h-6 w-6 text-zinc-300" />
        <p className="text-xs text-zinc-400">Failed to load. Try again.</p>
      </div>
    );
  }

  const progress = data.weekly_progress as VacancyWeeklyProgress;

  if (progress.tests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-8 text-center">
        <BookOpen className="h-6 w-6 text-zinc-300" />
        <p className="text-xs font-medium text-zinc-400">No tests yet</p>
        <p className="text-[10px] text-zinc-300">Records appear once submitted</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <StatStrip progress={progress} />
      <PerformanceChart tests={progress.tests} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function VacancyWeeklyPerformance({ dropdownItems, isLoading }: Props) {
  // Auto-select first vacancy when dropdown items arrive
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (dropdownItems && dropdownItems.length > 0 && !selectedId) {
      setSelectedId(dropdownItems[0].id);
    }
  }, [dropdownItems, selectedId]);

  const selected = dropdownItems?.find((v) => v.id === selectedId);

  return (
    <div className="px-4 space-y-2">
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
        Weekly Performance
      </p>

      {/* Dropdown */}
      {isLoading ? (
        <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
      ) : (
        <Select
          value={selectedId}
          onValueChange={setSelectedId}
          disabled={!dropdownItems || dropdownItems.length === 0}
        >
          <SelectTrigger className="w-full h-10 rounded-xl border-zinc-100 bg-white text-xs font-medium text-zinc-700 shadow-sm">
            <SelectValue placeholder="Select vacancy…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-zinc-100 shadow-lg">
            {dropdownItems && dropdownItems.length > 0 ? (
              dropdownItems.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs py-2.5">
                  <span className="font-bold font-mono text-zinc-700">{item.code}</span>
                  <span className="text-zinc-400 ml-1.5">
                    {item.subject} · Gr.{item.grade} · {item.total_tests}t
                  </span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__none__" disabled>No active vacancies</SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {/* Selected meta */}
      {selected && (
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-teal-100 text-teal-700`}>
            {selected.status}
          </span>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-2 py-0.5 rounded-full">
            {selected.subject} · Grade {selected.grade}
          </span>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-2 py-0.5 rounded-full">
            {selected.total_tests} test{selected.total_tests !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Content */}
      {!selectedId ? (
        <div className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col items-center gap-1.5 text-center">
          <BarChart3 className="h-5 w-5 text-zinc-300" />
          <p className="text-xs text-zinc-400">Select a vacancy to see charts</p>
        </div>
      ) : (
        <WeeklyProgressContent vacancyId={selectedId} />
      )}
    </div>
  );
}