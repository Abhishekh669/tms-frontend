"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    MapPin,
    Users,
    BookOpen,
    DollarSign,
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
    TrendingUp,
    Wallet,
    ReceiptText,
    CircleDollarSign,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useGetAllTeacherVacancies } from "@/utils/hooks/tanstack/teacher/use-get-teacher-vacancies";
import { Teacher, TeacherStats, TeacherVacancyQuery } from "@/utils/types/teacher.types";
import { PaymentStatus, VacancyStatus, VacancyTypeById } from "@/utils/types/vacancy.types";

// ─── Status Badges ─────────────────────────────────────────────────────────

function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
    const map: Record<VacancyStatus, { label: string; className: string; icon: React.ReactNode }> = {
        open: {
            label: "Open",
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            icon: <CheckCircle2 className="w-3 h-3" />,
        },
        assigned: {
            label: "Assigned",
            className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            icon: <Users className="w-3 h-3" />,
        },
        completed: {
            label: "Completed",
            className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
            icon: <CheckCircle2 className="w-3 h-3" />,
        },
        ongoing: {
            label: "Ongoing",
            className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
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
        <Badge className={cn("gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 border", className)}>
            {icon}
            {label}
        </Badge>
    );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const map: Record<PaymentStatus, { label: string; className: string }> = {
        pending:   { label: "Pending",   className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        partial:   { label: "Partial",   className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        failed:    { label: "Failed",    className: "bg-red-500/10 text-red-500 border-red-500/20" },
    };
    const { label, className } = map[status];
    return (
        <Badge className={cn("gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 border", className)}>
            <CreditCard className="w-3 h-3" />
            {label}
        </Badge>
    );
}

// ─── Payment Progress Cell ─────────────────────────────────────────────────

function PaymentProgress({ vacancy }: { vacancy: VacancyTypeById }) {
    const paidPercent =
        vacancy.amount_to_be_paid > 0
            ? Math.round((vacancy.payment_done / vacancy.amount_to_be_paid) * 100)
            : 0;
    return (
        <div className="space-y-1 min-w-[110px]">
            <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Rs. {vacancy.payment_done.toLocaleString()}</span>
                <span className="font-semibold text-foreground">{paidPercent}%</span>
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
                <span className={cn("font-semibold", vacancy.remaining_amount > 0 ? "text-red-500" : "text-foreground")}>
                    Rs. {vacancy.remaining_amount.toLocaleString()}
                </span>
            </p>
        </div>
    );
}

// ─── Stats Strip ───────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: TeacherStats }) {
    const items = [
        {
            label: "Total Vacancies",
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
            label: "Total Earned",
            value: `Rs. ${stats.total_earned.toLocaleString()}`,
            icon: <CircleDollarSign className="w-3.5 h-3.5" />,
            valueClass: "text-emerald-600",
            iconBg: "bg-emerald-500/10 text-emerald-600",
        },
        {
            label: "Pending Amount",
            value: `Rs. ${stats.total_pending.toLocaleString()}`,
            icon: <Wallet className="w-3.5 h-3.5" />,
            valueClass: "text-red-500",
            iconBg: "bg-red-500/10 text-red-500",
        },
    ];

    return (
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border shrink-0 bg-muted/10">
            {items.map(({ label, value, icon, valueClass, iconBg }, idx) => (
                <div
                    key={label}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 px-3 py-3 text-center",
                        // vertical dividers between cells
                        idx !== 0 && "border-l border-border",
                        // horizontal divider between the two rows on mobile (3-col grid)
                        idx >= 3 && "border-t border-border sm:border-t-0",
                    )}
                >
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg shrink-0", iconBg)}>
                        {icon}
                    </div>
                    <p className={cn("text-sm font-bold leading-none", valueClass)}>{value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                        {label}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ─── Table Skeleton ────────────────────────────────────────────────────────

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

// ─── Stats Skeleton ────────────────────────────────────────────────────────

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border shrink-0 bg-muted/10">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 px-3 py-3",
                        i !== 0 && "border-l border-border",
                        i >= 3 && "border-t border-border sm:border-t-0",
                    )}
                >
                    <div className="h-6 w-6 rounded-lg bg-muted animate-pulse" />
                    <div className="h-4 w-10 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Main Dialog Component ─────────────────────────────────────────────────

function TeacherVacanciesDailogBox({
    teacher,
    open,
    onClose,
}: {
    teacher : Teacher
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();

    const [query, setQuery] = useState<TeacherVacancyQuery>({
        limit: 10,
        page: 0,
        phone: "",
        payment_status: "all",
        vacancy_status: "all",
    });

    const { data, isLoading, isError, refetch, isRefetching } = useGetAllTeacherVacancies(teacher.id, query);

    const vacancies  = data?.vacancies ?? [];
    const stats      = data?.stats as TeacherStats | undefined;
    const total      = data?.total ?? 0;
    const totalPages = total ? Math.ceil(total / query.limit) : 1;
    const currentPage = query.page;
    const isFirstPage = currentPage === 0;
    const isLastPage  = currentPage >= totalPages - 1;

    const patchQuery = useCallback((patch: Partial<TeacherVacancyQuery>) => {
        setQuery((prev) => ({ ...prev, ...patch, page: 0 }));
    }, []);

    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages || isLoading) return;
        setQuery((prev) => ({ ...prev, page }));
    };

    const getVisiblePages = () => {
        const pages: number[] = [];
        const start = Math.max(0, currentPage - 1);
        const end   = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i + 1);
        return pages;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="!max-w-6xl w-full p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogTitle className="sr-only">Teacher Vacancies</DialogTitle>

                {/* ── Header ── */}
                <div className="relative overflow-hidden border-b border-border bg-card px-6 py-5 shrink-0">
                    <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,#6366f118,transparent_70%)]" />
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {teacher ? (
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary text-base font-bold shrink-0 ring-2 ring-primary/20">
                                    {teacher.name.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <div className="h-11 w-11 rounded-xl bg-muted animate-pulse shrink-0" />
                            )}
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                        Teacher Vacancies
                                    </p>
                                </div>
                                <h2 className="text-lg font-bold text-foreground leading-tight">
                                    {teacher?.name ?? "Loading…"}
                                </h2>
                                {teacher ? (
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                        <span className="text-xs text-muted-foreground">{teacher.email}</span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Phone className="w-3 h-3" />
                                            {teacher.phone}
                                        </span>
                                        <Badge className="gap-1 rounded-full text-[10px] font-semibold px-2 py-0 border bg-primary/10 text-primary border-primary/20">
                                            {teacher.gender}
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="h-3 w-48 rounded bg-muted animate-pulse mt-1.5" />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => refetch()}
                                disabled={isLoading || isRefetching}
                            >
                                <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
                            </Button>
                            <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Stats Strip ── */}
                {isLoading ? <StatsSkeleton /> : stats ? <StatsStrip stats={stats} /> : null}

                {/* ── Filters ── */}
                <div className="flex flex-wrap items-center gap-2.5 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
                    <Select
                        value={query.vacancy_status}
                        onValueChange={(v) => patchQuery({ vacancy_status: v as VacancyStatus | "all" })}
                    >
                        <SelectTrigger className="h-8 text-xs w-[145px] rounded-xl border-border bg-card">
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

                    <Select
                        value={query.payment_status}
                        onValueChange={(v) => patchQuery({ payment_status: v as PaymentStatus | "all" })}
                    >
                        <SelectTrigger className="h-8 text-xs w-[145px] rounded-xl border-border bg-card">
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

                    <Select
                        value={String(query.limit)}
                        onValueChange={(v) => patchQuery({ limit: Number(v) })}
                    >
                        <SelectTrigger className="h-8 text-xs w-[110px] rounded-xl border-border bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {[5, 10, 15, 20].map((s) => (
                                <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="ml-auto text-xs text-muted-foreground">
                        {!isLoading && `${total} total`}
                    </span>
                </div>

                {/* ── Table (scrollable) ── */}
                <div className="flex-1 overflow-auto min-h-0">
                    {isError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                            <p className="text-sm font-semibold">Failed to load vacancies</p>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetch()}>
                                Retry
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <TableSkeleton rows={query.limit} />
                    ) : vacancies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold text-foreground">No vacancies found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting the filters.</p>
                        </div>
                    ) : (
                        <div className={cn("transition-opacity duration-200", isRefetching && "opacity-50 pointer-events-none")}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Title / Subject
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Location
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Details
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Payment
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[130px]">
                                            Progress
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Salary
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Assigned To
                                        </TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vacancies.map((vacancy) => (
                                        <TableRow
                                            key={vacancy.id}
                                            className="border-border hover:bg-muted/40 transition-colors"
                                        >
                                            {/* Title / Subject */}
                                            <TableCell>
                                                <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[160px]">
                                                    {vacancy.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate max-w-[160px]">
                                                    <BookOpen className="w-3 h-3 shrink-0" />
                                                    {vacancy.subject}
                                                </p>
                                            </TableCell>

                                            {/* Location */}
                                            <TableCell>
                                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[120px]">
                                                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                                    <span className="truncate">{vacancy.location}</span>
                                                </div>
                                            </TableCell>

                                            {/* Details */}
                                            <TableCell>
                                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3 shrink-0" />
                                                        Grade {vacancy.grade}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 shrink-0" />
                                                        {vacancy.no_of_students} students
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 shrink-0" />
                                                        <span className="truncate max-w-[80px]">{vacancy.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Hash className="w-3 h-3 shrink-0" />
                                                        <span className="font-mono">{vacancy.code}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Vacancy Status */}
                                            <TableCell>
                                                <VacancyStatusBadge status={vacancy.status} />
                                            </TableCell>

                                            {/* Payment Status */}
                                            <TableCell>
                                                <PaymentStatusBadge status={vacancy.payment_status} />
                                            </TableCell>

                                            {/* Payment Progress */}
                                            <TableCell>
                                                <PaymentProgress vacancy={vacancy} />
                                            </TableCell>

                                            {/* Salary */}
                                            <TableCell>
                                                <p className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                                                    <DollarSign className="w-3 h-3 shrink-0" />
                                                    Rs. {vacancy.salary.toLocaleString()}
                                                </p>
                                                {vacancy.salary_note && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[90px]">
                                                        {vacancy.salary_note}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    {new Date(vacancy.created_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </TableCell>

                                            {/* Assigned To */}
                                            <TableCell>
                                                {vacancy.assigned_to ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                                                            {teacher?.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                                                                {teacher?.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Phone className="w-3 h-3 shrink-0" />
                                                                <span className="truncate max-w-[100px]">
                                                                    {teacher?.phone}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50 italic">—</span>
                                                )}
                                            </TableCell>

                                            {/* Visit Action */}
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 rounded-lg gap-1.5 text-xs font-semibold px-3 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                                    onClick={() => {
                                                        onClose();
                                                        router.push(`/vacancy/${vacancy.vacancy_id}`);
                                                    }}
                                                >
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

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="shrink-0 border-t border-border bg-card px-6 py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                Page {currentPage + 1} of {totalPages} · {total} vacancies
                            </p>
                            <Pagination>
                                <PaginationContent className="gap-1">
                                    <PaginationItem>
                                        <div className={cn(isFirstPage || isLoading ? "pointer-events-none opacity-35" : "")}>
                                            <PaginationPrevious
                                                href="#"
                                                className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                            />
                                        </div>
                                    </PaginationItem>
                                    {getVisiblePages().map((displayPage) => {
                                        const actual = displayPage - 1;
                                        return (
                                            <PaginationItem key={displayPage}>
                                                <PaginationLink
                                                    href="#"
                                                    className={cn(
                                                        "h-8 w-8 rounded-xl text-xs font-medium transition-all",
                                                        currentPage === actual
                                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                            : "border-border hover:bg-muted text-muted-foreground"
                                                    )}
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(actual); }}
                                                >
                                                    {displayPage}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <div className={cn(isLastPage || isLoading ? "pointer-events-none opacity-35" : "")}>
                                            <PaginationNext
                                                href="#"
                                                className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                            />
                                        </div>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default TeacherVacanciesDailogBox;