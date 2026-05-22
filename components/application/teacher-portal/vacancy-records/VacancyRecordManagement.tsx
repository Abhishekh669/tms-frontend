"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    MapPin,
    Users,
    BookOpen,
    Clock,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Calendar,
    Hash,
    CreditCard,
    RefreshCw,
    ExternalLink,
    Phone,
    Wallet,
    ReceiptText,
    CircleDollarSign,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useGetTeacherVacanciesForTeacher } from "@/utils/hooks/tanstack/teacher/use-get-teacher-vacanceis-for-teacher";
import {
    SafeTokenTeacherData,
    TeacherStats,
    TeacherVacancyQuery,
} from "@/utils/types/teacher.types";
import {
    PaymentStatus,
    VacancyStatus,
    VacancyTypeById,
} from "@/utils/types/vacancy.types";

// ─── Status Badges ───────────────────────────────────────────────────────────

function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
    const map: Record<
        VacancyStatus,
        { label: string; className: string; icon: React.ReactNode }
    > = {
        open: {
            label: "Open",
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            icon: <CheckCircle2 className="w-3 h-3" />,
        },
        assigned: {
            label: "Assigned",
            className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            icon: <Clock className="w-3 h-3" />,
        },
        completed: {
            label: "Completed",
            className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
            icon: <CheckCircle2 className="w-3 h-3" />,
        },
        ongoing: {
            label: "Ongoing",
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            icon: <Clock className="w-3 h-3" />,
        },
        cancelled: {
            label: "Cancelled",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
            icon: <X className="w-3 h-3" />,
        },
    };
    const { label, className, icon } = map[status];
    return (
        <Badge
            className={cn(
                "gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 border",
                className
            )}
        >
            {icon}
            {label}
        </Badge>
    );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const map: Record<PaymentStatus, { label: string; className: string }> = {
        pending: {
            label: "Pending",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
        },
        partial: {
            label: "Partial",
            className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        },
        completed: {
            label: "Paid",
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        },
        failed: {
            label: "Failed",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
        },
    };
    const { label, className } = map[status];
    return (
        <Badge
            className={cn(
                "gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 border",
                className
            )}
        >
            <CreditCard className="w-3 h-3" />
            {label}
        </Badge>
    );
}

// ─── Payment Progress (desktop table) ───────────────────────────────────────

function PaymentProgress({ vacancy }: { vacancy: VacancyTypeById }) {
    const paidPercent =
        vacancy.amount_to_be_paid > 0
            ? Math.round(
                  (vacancy.payment_done / vacancy.amount_to_be_paid) * 100
              )
            : 0;
    return (
        <div className="space-y-1 min-w-[110px]">
            <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                    Rs. {vacancy.payment_done.toLocaleString()}
                </span>
                <span className="font-semibold text-foreground">
                    {paidPercent}%
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        paidPercent === 100
                            ? "bg-emerald-500"
                            : paidPercent > 50
                            ? "bg-amber-500"
                            : "bg-red-400"
                    )}
                    style={{ width: `${paidPercent}%` }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground">
                Due:{" "}
                <span
                    className={cn(
                        "font-semibold",
                        vacancy.remaining_amount > 0
                            ? "text-red-500"
                            : "text-foreground"
                    )}
                >
                    Rs. {vacancy.remaining_amount.toLocaleString()}
                </span>
            </p>
        </div>
    );
}

// ─── Mini Stats Row (mobile - compact) ─────────────────────────────────────

function MiniStatsRow({ stats }: { stats: TeacherStats }) {
    return (
        <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-muted/5 border-b border-border">
            <div className="text-center">
                <p className="text-base font-bold text-foreground">{stats.total_vacancies}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
            <div className="text-center">
                <p className="text-base font-bold text-emerald-600">{stats.paid_vacancies}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Paid</p>
            </div>
            <div className="text-center">
                <p className="text-base font-bold text-amber-600">{stats.partial_vacancies}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Partial</p>
            </div>
            <div className="text-center">
                <p className="text-base font-bold text-red-500">{stats.unpaid_vacancies}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Unpaid</p>
            </div>
        </div>
    );
}

// ─── Compact Payment Summary (mobile) ─────────────────────────────────────

function CompactPaymentSummary({ stats }: { stats: TeacherStats }) {
    const total = stats.total_earned + stats.total_pending;
    const paidPercent = total > 0 ? Math.round((stats.total_earned / total) * 100) : 0;

    return (
        <div className="px-3 py-2 border-b border-border bg-muted/5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Commission</span>
                        <span className="text-[10px] font-bold text-foreground">Rs. {total.toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPercent}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px]">
                        <span className="text-emerald-600">Paid: Rs.{stats.total_earned.toLocaleString()}</span>
                        <span className="text-red-500">Due: Rs.{stats.total_pending.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Desktop Stats Strip ─────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: TeacherStats }) {
    const items = [
        {
            label: "Total",
            value: stats.total_vacancies,
            icon: <ReceiptText className="w-3.5 h-3.5" />,
            valueClass: "text-foreground",
            iconBg: "bg-primary/10 text-primary",
        },
        {
            label: "Paid",
            value: stats.paid_vacancies,
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            valueClass: "text-emerald-600",
            iconBg: "bg-emerald-500/10 text-emerald-600",
        },
        {
            label: "Unpaid",
            value: stats.unpaid_vacancies,
            icon: <AlertCircle className="w-3.5 h-3.5" />,
            valueClass: "text-red-500",
            iconBg: "bg-red-500/10 text-red-500",
        },
        {
            label: "Partial",
            value: stats.partial_vacancies,
            icon: <Clock className="w-3.5 h-3.5" />,
            valueClass: "text-amber-600",
            iconBg: "bg-amber-500/10 text-amber-600",
        },
        {
            label: "Commision Paid",
            value: `Rs. ${stats.total_earned.toLocaleString()}`,
            icon: <CircleDollarSign className="w-3.5 h-3.5" />,
            valueClass: "text-emerald-600",
            iconBg: "bg-emerald-500/10 text-emerald-600",
        },
        {
            label: "Pending",
            value: `Rs. ${stats.total_pending.toLocaleString()}`,
            icon: <Wallet className="w-3.5 h-3.5" />,
            valueClass: "text-red-500",
            iconBg: "bg-red-500/10 text-red-500",
        },
    ];

    return (
        <div className="grid grid-cols-6 border-b border-border shrink-0 bg-muted/10">
            {items.map(({ label, value, icon, valueClass, iconBg }, idx) => (
                <div
                    key={label}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center",
                        idx !== 0 && "border-l border-border"
                    )}
                >
                    <div
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg shrink-0",
                            iconBg
                        )}
                    >
                        {icon}
                    </div>
                    <p
                        className={cn(
                            "text-xs font-bold leading-none truncate max-w-full px-1",
                            valueClass
                        )}
                    >
                        {value}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                        {label}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ─── Desktop Stats Skeleton ──────────────────────────────────────────────────

function DesktopStatsSkeleton() {
    return (
        <div className="grid grid-cols-6 border-b border-border shrink-0 bg-muted/10">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 px-3 py-3",
                        i !== 0 && "border-l border-border"
                    )}
                >
                    <div className="h-6 w-6 rounded-lg bg-muted animate-pulse" />
                    <div className="h-4 w-10 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Mobile Vacancy Card ─────────────────────────────────────────────────────

function MobileVacancyCard({
    vacancy,
    teacher,
    onVisit,
}: {
    vacancy: VacancyTypeById;
    teacher: SafeTokenTeacherData;
    onVisit: () => void;
}) {
    const paidPercent =
        vacancy.amount_to_be_paid > 0
            ? Math.round(
                  (vacancy.payment_done / vacancy.amount_to_be_paid) * 100
              )
            : 0;

    return (
        <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{vacancy.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{vacancy.subject}</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg gap-1 text-xs font-semibold px-2"
                    onClick={onVisit}
                >
                    <ExternalLink className="w-3 h-3" />
                    Visit
                </Button>
            </div>

            <div className="flex flex-wrap gap-1">
                <VacancyStatusBadge status={vacancy.status} />
                <PaymentStatusBadge status={vacancy.payment_status} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{vacancy.location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>{vacancy.no_of_students} std.</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{vacancy.time}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-semibold">Rs.{vacancy.salary.toLocaleString()}</span>
                </div>
            </div>

            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        paidPercent === 100 ? "bg-emerald-500" : paidPercent > 50 ? "bg-amber-500" : "bg-red-400"
                    )}
                    style={{ width: `${paidPercent}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-emerald-600 font-semibold">Paid: Rs.{vacancy.payment_done.toLocaleString()}</span>
                <span className={cn("font-semibold", vacancy.remaining_amount > 0 ? "text-red-500" : "")}>
                    Due: Rs.{vacancy.remaining_amount.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

// ─── Mobile Card Skeleton ────────────────────────────────────────────────────

function MobileCardSkeleton({ count }: { count: number }) {
    return (
        <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                        <div className="h-7 w-16 rounded-lg bg-muted animate-pulse ml-auto" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="h-3 rounded bg-muted animate-pulse" />
                        ))}
                    </div>
                    <div className="h-1 rounded-full bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Table Skeleton ──────────────────────────────────────────────────────────

function TableSkeleton({ rows }: { rows: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="space-y-1.5 w-36">
                        <div className="h-3 w-full rounded bg-muted animate-pulse" />
                        <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                        <div className="h-3 w-full rounded bg-muted animate-pulse" />
                        <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
                    </div>
                    <div className="h-7 w-16 rounded-lg bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Pagination Bar ──────────────────────────────────────────────────────────

function PaginationBar({
    currentPage,
    totalPages,
    total,
    isLoading,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    total: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    const isFirst = currentPage === 0;
    const isLast = currentPage >= totalPages - 1;

    const getVisiblePages = () => {
        const pages: number[] = [];
        const start = Math.max(0, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i + 1);
        return pages;
    };

    return (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    Page {currentPage + 1} of {totalPages} · {total} vacancies
                </p>
                <div className="flex items-center gap-1">
                    <button
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors",
                            isFirst || isLoading
                                ? "opacity-35 pointer-events-none bg-muted"
                                : "bg-card hover:bg-muted"
                        )}
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={isFirst || isLoading}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Prev
                    </button>
                    {getVisiblePages().map((displayPage) => {
                        const actual = displayPage - 1;
                        return (
                            <button
                                key={displayPage}
                                className={cn(
                                    "h-8 w-8 rounded-lg text-xs font-medium border transition-all",
                                    currentPage === actual
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "border-border hover:bg-muted text-muted-foreground bg-card"
                                )}
                                onClick={() => onPageChange(actual)}
                                disabled={isLoading}
                            >
                                {displayPage}
                            </button>
                        );
                    })}
                    <button
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors",
                            isLast || isLoading
                                ? "opacity-35 pointer-events-none bg-muted"
                                : "bg-card hover:bg-muted"
                        )}
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={isLast || isLoading}
                    >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function VacancyRecordManagement({
    teacher,
}: {
    teacher: SafeTokenTeacherData;
}) {
    const router = useRouter();

    const [query, setQuery] = useState<TeacherVacancyQuery>({
        limit: 10,
        page: 0,
        phone: "",
        payment_status: "all",
        vacancy_status: "all",
    });

    const { data, isLoading, isError, refetch, isRefetching, error } =
        useGetTeacherVacanciesForTeacher(teacher.id, query);

    const vacancies = data?.vacancies ?? [];
    const stats = data?.stats as TeacherStats | undefined;
    const total = data?.total ?? 0;
    const totalPages = total ? Math.ceil(total / query.limit) : 1;
    const currentPage = query.page;

    const patchQuery = useCallback((patch: Partial<TeacherVacancyQuery>) => {
        setQuery((prev) => ({ ...prev, ...patch, page: 0 }));
    }, []);

    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages || isLoading) return;
        setQuery((prev) => ({ ...prev, page }));
    };

    if (!teacher) return null;

    // ── Shared vacancy content (error / loading / empty / list) ─────────────

    const mobileVacancyContent = isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm font-semibold">Failed to load vacancies</p>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetch()}>
                Retry
            </Button>
        </div>
    ) : isLoading ? (
        <MobileCardSkeleton count={query.limit} />
    ) : vacancies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
            <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No vacancies found</p>
            <p className="text-xs text-muted-foreground">Try adjusting the filters.</p>
        </div>
    ) : (
        <div className={cn("space-y-2 px-4 pb-4", isRefetching && "opacity-50 pointer-events-none")}>
            {vacancies.map((vacancy) => (
                <MobileVacancyCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    teacher={teacher}
                    onVisit={() => router.push(`/teacher-portal/vacancy-records/${vacancy.vacancy_id}`)}
                />
            ))}
        </div>
    );

    return (
        <>
            {/* ════════════════════════════════════════════════════════════
                MOBILE LAYOUT (sm:hidden) - COMPACT VERSION WITH PAYMENT SUMMARY
            ════════════════════════════════════════════════════════════ */}
            <div className="sm:hidden flex flex-col bg-background min-h-0">
                {/* Mini Header */}
                <div className="bg-card border-b border-border px-3 py-2 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xs font-bold text-foreground truncate">{teacher.name}</h2>
                            <p className="text-[9px] text-muted-foreground truncate">{teacher.phone}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 rounded-lg p-0" onClick={() => refetch()} disabled={isLoading || isRefetching}>
                        <RefreshCw className={cn("w-3 h-3", isRefetching && "animate-spin")} />
                    </Button>
                </div>

                {/* Compact Stats Row + Payment Summary */}
                {!isLoading && stats && (
                    <>
                        <MiniStatsRow stats={stats} />
                        <CompactPaymentSummary stats={stats} />
                    </>
                )}

                {/* Scrollable Area */}
                <div className="flex-1 overflow-auto min-h-0">
                    {/* Section label */}
                    <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Vacancies · {total}
                        </p>
                    </div>

                    {/* Status chips */}
                    <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
                        {(["all", "open", "ongoing", "assigned", "completed", "cancelled"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => patchQuery({ vacancy_status: s as VacancyStatus | "all" })}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap transition-all",
                                    query.vacancy_status === s
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-card border-border text-muted-foreground"
                                )}
                            >
                                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Filters row */}
                    <div className="flex gap-2 px-4 pb-2">
                        <Select value={query.payment_status} onValueChange={(v) => patchQuery({ payment_status: v as PaymentStatus | "all" })}>
                            <SelectTrigger className="h-7 text-xs flex-1 rounded-lg border-border bg-card">
                                <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="completed">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={String(query.limit)} onValueChange={(v) => patchQuery({ limit: Number(v) })}>
                            <SelectTrigger className="h-7 text-xs w-[85px] rounded-lg border-border bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                {[5, 10, 15, 20].map((s) => (
                                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vacancy cards */}
                    {mobileVacancyContent}
                </div>

                {/* Pagination */}
                <PaginationBar currentPage={currentPage} totalPages={totalPages} total={total} isLoading={isLoading} onPageChange={handlePageChange} />
            </div>

            {/* ════════════════════════════════════════════════════════════
                DESKTOP LAYOUT (hidden sm:flex) - UNCHANGED
            ════════════════════════════════════════════════════════════ */}
            <div className="hidden sm:flex flex-col bg-background rounded-xl border border-border overflow-hidden shadow-sm min-h-0">
                <div className="relative overflow-hidden border-b border-border bg-card px-6 py-5 shrink-0">
                    <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,#6366f118,transparent_70%)]" />
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-base font-bold shrink-0 ring-2 ring-primary/20">
                                {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="inline-block w-1 h-3.5 rounded-full bg-primary" />
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                        My Vacancy Records
                                    </p>
                                </div>
                                <h2 className="text-base font-bold text-foreground leading-tight truncate">
                                    {teacher.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                    <span className="text-[11px] text-muted-foreground truncate max-w-none">
                                        {teacher.email}
                                    </span>
                                    {teacher.phone && (
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Phone className="w-3 h-3" />
                                            {teacher.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => refetch()}
                            disabled={isLoading || isRefetching}
                        >
                            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {isLoading ? <DesktopStatsSkeleton /> : stats && <StatsStrip stats={stats} />}

                <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
                    <Select value={query.vacancy_status} onValueChange={(v) => patchQuery({ vacancy_status: v as VacancyStatus | "all" })}>
                        <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border bg-card">
                            <SelectValue placeholder="Vacancy Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Vacancies</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={query.payment_status} onValueChange={(v) => patchQuery({ payment_status: v as PaymentStatus | "all" })}>
                        <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border bg-card">
                            <SelectValue placeholder="Payment Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={String(query.limit)} onValueChange={(v) => patchQuery({ limit: Number(v) })}>
                        <SelectTrigger className="h-8 text-xs w-[100px] rounded-xl border-border bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {[5, 10, 15, 20].map((s) => (
                                <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="ml-auto text-xs text-muted-foreground">{!isLoading && `${total} total`}</span>
                </div>

                <div className="flex-1 overflow-auto min-h-0">
                    {isError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                            <p className="text-sm font-semibold">Failed to load vacancies</p>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetch()}>Retry</Button>
                        </div>
                    ) : isLoading ? (
                        <TableSkeleton rows={query.limit} />
                    ) : vacancies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
                            <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold text-foreground">No vacancies found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting the filters.</p>
                        </div>
                    ) : (
                        <div className={cn("transition-opacity duration-200", isRefetching && "opacity-50 pointer-events-none")}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title / Subject</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[130px]">Progress</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salary</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vacancies?.map((vacancy) => (
                                        <TableRow key={vacancy.id} className="border-border hover:bg-muted/40 transition-colors">
                                            <TableCell>
                                                <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[160px]">{vacancy.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate max-w-[160px]">
                                                    <BookOpen className="w-3 h-3 shrink-0" />
                                                    {vacancy.subject}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[120px]">
                                                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                                    <span className="truncate">{vacancy.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 shrink-0" />Grade {vacancy.grade}</div>
                                                    <div className="flex items-center gap-1"><Users className="w-3 h-3 shrink-0" />{vacancy.no_of_students} students</div>
                                                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" /><span className="truncate max-w-[80px]">{vacancy.time}</span></div>
                                                    <div className="flex items-center gap-1"><Hash className="w-3 h-3 shrink-0" /><span className="font-mono">{vacancy.code}</span></div>
                                                </div>
                                            </TableCell>
                                            <TableCell><VacancyStatusBadge status={vacancy.status} /></TableCell>
                                            <TableCell><PaymentStatusBadge status={vacancy.payment_status} /></TableCell>
                                            <TableCell><PaymentProgress vacancy={vacancy} /></TableCell>
                                            <TableCell>
                                                <p className="text-xs font-semibold text-foreground">Rs. {vacancy.salary.toLocaleString()}</p>
                                                {vacancy.salary_note && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[90px]">{vacancy.salary_note}</p>}
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    {new Date(vacancy.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" className="h-7 rounded-lg gap-1.5 text-xs font-semibold px-3 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all" onClick={() => router.push(`/teacher-portal/vacancy-records/${vacancy.vacancy_id}`)}>
                                                    <ExternalLink className="w-3 h-3" />
                                                    Visit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
                <PaginationBar currentPage={currentPage} totalPages={totalPages} total={total} isLoading={isLoading} onPageChange={handlePageChange} />
            </div>
        </>
    );
}

export default VacancyRecordManagement;