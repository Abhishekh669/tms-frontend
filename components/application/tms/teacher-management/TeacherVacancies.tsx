"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    CreditCard,
    RefreshCw,
    ExternalLink,
    Phone,
    ArrowLeft,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useGetTeacherVacanciesByTeacherId } from "@/utils/hooks/tanstack/teacher/use-get-teacher-vacancies-by-teacher-id";
import {
    GetTeacherVacanciesRecordsByTeacherIdQuery,
    VacancyCardData,
} from "@/utils/types/teacher.types";
import { PaymentStatus, VacancyStatus } from "@/utils/types/vacancy.types";
import { User } from "@/utils/types/user.types";

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
                    </div>
                    <div className="h-7 w-16 rounded-lg bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Main Page Component ───────────────────────────────────────────────────

function TeacherVacanciesPage({ user }: { user: User }) {
    const router = useRouter();
    const teacherParams = useSearchParams();
    const teacherId = teacherParams.get("teacherId") || "";

    const [query, setQuery] = useState<GetTeacherVacanciesRecordsByTeacherIdQuery>({
        limit: 10,
        page: 0,
        phone: "",
        payment_status: "all",
        vacancy_status: "all",
    });

    const [phoneInput, setPhoneInput] = useState("");

    const { data, isLoading, isError, refetch, isRefetching } = useGetTeacherVacanciesByTeacherId(teacherId, query);

    const vacancies = data?.vacancies ?? [];
    const teacherData = data?.teacher_data;
    const pagination = data?.pagination;
    const total = pagination?.total ?? 0;
    const totalPages = total ? Math.ceil(total / query.limit) : 1;
    const currentPage = query.page;
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage >= totalPages - 1;

    const patchQuery = useCallback((patch: Partial<GetTeacherVacanciesRecordsByTeacherIdQuery>) => {
        setQuery((prev) => ({ ...prev, ...patch, page: 0 }));
    }, []);

    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages || isLoading) return;
        setQuery((prev) => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patchQuery({ phone: phoneInput.trim() });
    };

    const getVisiblePages = () => {
        const pages: number[] = [];
        const start = Math.max(0, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i + 1);
        return pages;
    };

    if (!user) return null;
    if (!teacherId) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* ── Page Header ── */}
            <div className="border-b border-border bg-card">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Teachers
                    </button>

                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Teacher Info */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold shrink-0 ring-2 ring-primary/20">
                                {teacherData?.name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="inline-block w-1 h-4 rounded-full bg-primary" />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                        Teacher Vacancies
                                    </p>
                                </div>
                                <h1 className="text-2xl font-bold text-foreground leading-tight">
                                    {teacherData?.name ?? "—"}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                    <span className="text-sm text-muted-foreground">{teacherData?.email}</span>
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        {teacherData?.phone}
                                    </span>
                                    {teacherData?.gender && (
                                        <Badge className="gap-1 rounded-full text-[10px] font-semibold px-2.5 py-0.5 border bg-primary/10 text-primary border-primary/20">
                                            {teacherData.gender}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-start mt-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl gap-2 text-xs font-medium border-border"
                                onClick={() => refetch()}
                                disabled={isLoading || isRefetching}
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Page Body ── */}
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* ── Filters + Table card ── */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
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

                        <form onSubmit={handlePhoneSubmit} className="flex items-center gap-1.5">
                            <Input
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Search by contact number"
                                className="h-8 text-xs w-[190px] rounded-xl border-border bg-card"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl px-2.5 border-border"
                            >
                                <Search className="w-3.5 h-3.5" />
                            </Button>
                            {query.phone && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 rounded-xl px-2 text-xs text-muted-foreground"
                                    onClick={() => {
                                        setPhoneInput("");
                                        patchQuery({ phone: "" });
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>

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

                        <span className="ml-auto text-xs text-muted-foreground font-medium">
                            {!isLoading && `${total} total`}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {isError ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                                <p className="text-sm font-semibold">Failed to load vacancies</p>
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetch()}>
                                    Retry
                                </Button>
                            </div>
                        ) : isLoading ? (
                            <TableSkeleton rows={query.limit} />
                        ) : vacancies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                                <GraduationCap className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm font-semibold text-foreground">No vacancies found</p>
                                <p className="text-xs text-muted-foreground">Try adjusting the filters.</p>
                            </div>
                        ) : (
                            <div className={cn("transition-opacity duration-200", isRefetching && "opacity-50 pointer-events-none")}>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent bg-muted/20">
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
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Salary
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Contact
                                            </TableHead>
                                            <TableHead className="w-20" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vacancies.map((vacancy: VacancyCardData) => (
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
                                                    {vacancy.location_hint && (
                                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate max-w-[120px] pl-4">
                                                            {vacancy.location_hint}
                                                        </p>
                                                    )}
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

                                                {/* Salary */}
                                                <TableCell>
                                                    <p className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                                                        <DollarSign className="w-3 h-3 shrink-0" />
                                                        Rs. {vacancy.salary.toLocaleString()}
                                                    </p>
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="w-3 h-3 shrink-0" />
                                                        {vacancy.contact_number}
                                                    </p>
                                                </TableCell>

                                                {/* Visit Action */}
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 rounded-lg gap-1.5 text-xs font-semibold px-3 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                                        onClick={() => router.push(`/teacher-management/vacancies/${teacherId}/vacancy-records/${vacancy.id}`)}
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
                        <div className="border-t border-border bg-card px-5 py-3.5">
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
                </div>
            </div>
        </div>
    );
}

export default TeacherVacanciesPage;