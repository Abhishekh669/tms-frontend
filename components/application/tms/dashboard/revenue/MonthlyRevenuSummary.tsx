// components/revenue/MonthlyRevenueSummary.tsx

"use client";

import { useMemo } from "react";

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

import { AlertCircle, BarChart2, Star, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMonthlyRevenueSummary } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
    return `NPR ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtShort(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return String(Math.round(value));
}

function formatMonthLabel(m: string) {
    if (!m) return "—";
    const [year, month] = m.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

const STATUS_COLORS = {
    completed: "#10b981",
    partial: "#0ea5e9",
    pending: "#f59e0b",
    failed: "#f43f5e",
} as const;

// ─────────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${accent ?? "text-muted-foreground"}`} />
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <p className={`text-lg font-semibold tracking-tight leading-tight ${accent ? "" : ""}`}>
                {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────

export function MonthlyRevenueSummaryPanel() {
    const { data, isLoading, error } = useGetMonthlyRevenueSummary();

    const summary = data?.summary ?? null;

    const chartData = useMemo(() => {
        const months = summary?.last_12_months;
        if (!Array.isArray(months) || months.length === 0) return [];
        return months.map((m) => ({
            period: formatMonthLabel(m?.month ?? ""),
            completed: m?.completed ?? 0,
            partial: m?.partial ?? 0,
            pending: m?.pending ?? 0,
            failed: m?.failed ?? 0,
        }));
    }, [summary]);

    if (error) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-5 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-medium text-destructive">Failed to load monthly revenue summary</p>
                    {error instanceof Error && (
                        <p className="text-xs text-muted-foreground mt-0.5">{error.message}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
            <div>
                <h3 className="text-sm font-semibold">Monthly revenue summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Last 12 months · completed, partial, pending, failed
                </p>
            </div>

            {/* KPI cards */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-[80px] rounded-xl" />
                    ))}
                </div>
            ) : !summary ? (
                <div className="rounded-lg border border-border/40 bg-muted/20 py-6 text-center text-sm text-muted-foreground">
                    No summary data available
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <KpiCard
                        icon={TrendingUp}
                        label="Avg monthly income"
                        value={fmt(summary.avg_monthly_income ?? 0)}
                        sub="over tracked months"
                        accent="text-primary"
                    />
                    <KpiCard
                        icon={Star}
                        label="Best month"
                        value={fmt(summary.best_month_amount ?? 0)}
                        sub={
                            summary.best_month
                                ? formatMonthLabel(summary.best_month)
                                : "—"
                        }
                        accent="text-amber-500"
                    />
                    <KpiCard
                        icon={Calendar}
                        label="This month"
                        value={fmt(summary.current_month_income ?? 0)}
                        sub="current month total"
                        accent="text-emerald-500"
                    />
                </div>
            )}

            {/* 12-month chart */}
            {isLoading ? (
                <Skeleton className="h-60 w-full rounded-lg" />
            ) : chartData.length === 0 ? (
                <div className="h-60 rounded-lg border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2">
                    <BarChart2 className="w-6 h-6 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No monthly data available</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} barCategoryGap="28%">
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                            tickFormatter={fmtShort}
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
                        />
                        <Legend
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