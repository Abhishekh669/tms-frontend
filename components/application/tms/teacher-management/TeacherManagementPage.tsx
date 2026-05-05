"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  List,
  LayoutGrid,
  SlidersHorizontal,
  RefreshCw,
  GraduationCap,
  Plus,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useGetAllTeachers } from "@/utils/hooks/tanstack/teacher/use-get-teachers-list";
import { Teacher, TeacherQuery, TeacherStatus } from "@/utils/types/teacher.types";
import { User } from "@/utils/types/user.types";
import { ActionsDropdown } from "./DeelteTeacher";

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 20;

type SortField = "name" | "email" | "location" | "status" | "created_at";
type SortDirection = "asc" | "desc";

// ─── useMounted ───────────────────────────────────────────────────────────────
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TeacherStatus }) {
  return status === "on_duty" ? (
    <Badge className="gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold px-2.5 py-0.5">
      <CheckCircle2 className="w-3 h-3" />
      On Duty
    </Badge>
  ) : (
    <Badge className="gap-1 rounded-full bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] font-semibold px-2.5 py-0.5">
      <Clock className="w-3 h-3" />
      Vacant
    </Badge>
  );
}

// ─── Link Button ──────────────────────────────────────────────────────────────
function LinkButton({ href, label }: { href?: string | null; label: string }) {
  if (!href) return <span className="text-xs text-muted-foreground/50 italic">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────
function SortHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp
          className={cn(
            "w-2.5 h-2.5 -mb-0.5",
            active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/30"
          )}
        />
        <ChevronDown
          className={cn(
            "w-2.5 h-2.5",
            active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/30"
          )}
        />
      </span>
    </button>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function TeachersTable({
  teachers,
  isRefetching,
  sortField,
  sortDirection,
  onSort,
}: {
  teachers: Teacher[];
  isRefetching: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (f: SortField) => void;
}) {
  return (
    <div className={cn("transition-opacity duration-200", isRefetching && "opacity-50 pointer-events-none")}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[220px]">
              <SortHeader label="Name" field="name" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Contact" field="email" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Location" field="location" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documents
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <SortHeader label="Joined" field="created_at" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow
              key={teacher.id}
              className="border-border hover:bg-muted/40 transition-colors group"
            >
              {/* Name */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {teacher.name}
                  </span>
                </div>
              </TableCell>

              {/* Contact */}
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {teacher.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {teacher.phone}
                  </span>
                </div>
              </TableCell>

              {/* Location */}
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[140px] truncate cursor-default">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{teacher.location}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl text-xs">
                      <p>{teacher.location}</p>
                      {teacher.location_hint && (
                        <p className="text-muted-foreground">{teacher.location_hint}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusBadge status={teacher.status} />
              </TableCell>

              {/* Documents */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <LinkButton href={teacher.cv_link} label="CV" />
                  <LinkButton href={teacher.transcript_link} label="Transcript" />
                  {teacher.addition_link && (
                    <LinkButton href={teacher.addition_link} label="Additional" />
                  )}
                </div>
              </TableCell>

              {/* Joined */}
              <TableCell>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {new Date(teacher.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell>
                <ActionsDropdown teacher={teacher} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────
function TeachersGrid({
  teachers,
  isRefetching,
}: {
  teachers: Teacher[];
  isRefetching: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200",
        isRefetching && "opacity-50 pointer-events-none"
      )}
    >
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {teacher.name}
                </p>
                <StatusBadge status={teacher.status} />
              </div>
            </div>
            <ActionsDropdown teacher={teacher} />
          </div>

          {/* Contact */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{teacher.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              {teacher.phone}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{teacher.location}</span>
            </div>
          </div>

          {/* Documents */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <LinkButton href={teacher.cv_link} label="CV" />
            <LinkButton href={teacher.transcript_link} label="Transcript" />
            {teacher.addition_link && (
              <LinkButton href={teacher.addition_link} label="Additional" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-14 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherManagementPage({ user }: { user: User }) {
  const [query, setQuery] = useState<TeacherQuery>({
    limit: DEFAULT_LIMIT,
    page: 0,
    search: "",
    phone: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const mounted = useMounted();

  const { data, isLoading, isError, refetch, isRefetching } = useGetAllTeachers(query);

  const stats = data?.teachersResponse?.teacher_data;
  const teachers = data?.teachersResponse?.teachers ?? [];
  const total = data?.teachersResponse?.total ?? 0;

  // Pagination (0-based)
  const currentPage = query.page;
  const totalPages = total ? Math.ceil(total / query.limit) : 1;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  // Debounced search
  const applySearch = useCallback(() => {
    const nextSearch = searchInput.trim();
    const nextPhone = phoneInput.trim();
    setQuery((prev) => ({
      ...prev,
      search: nextSearch,
      phone: nextPhone,
      page: 0,
    }));
  }, [searchInput, phoneInput]);

  // Client-side status filter + sort
  const displayedTeachers = useMemo(() => {
    let result = [...teachers];
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
        case "email":
        case "location":
        case "status":
          cmp = a[sortField].localeCompare(b[sortField]);
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  }, [teachers, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages || isLoading) return;
    setQuery((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVisiblePages = useCallback(() => {
    const pages: number[] = [];
    const windowSize = 2;
    const startPage = Math.max(0, currentPage - windowSize);
    const endPage = Math.min(totalPages - 1, currentPage + windowSize);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i + 1);
    }
    return pages;
  }, [currentPage, totalPages]);

  const safeIsLoading = mounted && isLoading;
  const safeIsRefetching = mounted && isRefetching;
  const safeIsError = mounted && isError;

  return (
    <TooltipProvider>
      <div className="min-h-screen space-y-8 px-1">

        {/* ── Page Header ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                  Teacher Management
                </p>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Teachers Directory
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Manage teachers, view documents and track availability across your institution.
              </p>
            </div>

            <Button className="h-9 rounded-xl gap-2 text-sm font-semibold px-4">
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label="Total Teachers"
              value={stats.total_teachers}
              icon={<GraduationCap className="w-5 h-5" />}
              accent="#6366f1"
            />
            <StatCard
              label="On Duty"
              value={stats.duty_teachers}
              icon={<CheckCircle2 className="w-5 h-5" />}
              accent="#10b981"
            />
            <StatCard
              label="Vacant"
              value={stats.vacent_teacher}
              icon={<Clock className="w-5 h-5" />}
              accent="#f59e0b"
            />
            <StatCard
              label="Male"
              value={stats.male_count}
              icon={<Users className="w-5 h-5" />}
              accent="#3b82f6"
            />
            <StatCard
              label="Female"
              value={stats.female_count}
              icon={<Users className="w-5 h-5" />}
              accent="#ec4899"
            />
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TeacherStatus | "all")}
              >
                <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl border-border bg-muted/40 hover:bg-muted transition-colors">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(query.limit)}
                onValueChange={(v) =>
                  setQuery((prev) => ({ ...prev, limit: Number(v), page: 0 }))
                }
              >
                <SelectTrigger className="h-8 text-xs w-[105px] rounded-xl border-border bg-muted/40 hover:bg-muted transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[10, 15, 20, 30].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl gap-1.5 text-xs border-border bg-muted/40 hover:bg-muted"
                onClick={() => refetch()}
                disabled={safeIsRefetching || safeIsLoading}
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", safeIsRefetching && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            {/* Search + Phone + View */}
            <div className="flex items-center gap-2.5">
              {/* Name / email search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="h-8 pl-9 pr-3 text-xs w-[220px] rounded-xl border-border bg-muted/40 hover:bg-muted focus:bg-background transition-colors placeholder:text-muted-foreground/60"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Phone filter */}
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Phone..."
                  className="h-8 pl-9 pr-3 text-xs w-[160px] rounded-xl border-border bg-muted/40 hover:bg-muted focus:bg-background transition-colors placeholder:text-muted-foreground/60"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                />
                {phoneInput && (
                  <button
                    onClick={() => setPhoneInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Search button (applies both fields) */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl gap-1.5 text-xs border-border bg-muted/40 hover:bg-muted"
                onClick={applySearch}
                disabled={safeIsLoading || safeIsRefetching}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Button>

              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 rounded-lg p-0 transition-all",
                    viewMode === "list"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 rounded-lg p-0 transition-all",
                    viewMode === "grid"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          {safeIsError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load teachers</p>
              <p className="text-xs text-muted-foreground">Please try again.</p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl mt-1"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          ) : safeIsLoading ? (
            viewMode === "list" ? (
              <TableSkeleton rows={query.limit} />
            ) : (
              <GridSkeleton count={query.limit} />
            )
          ) : displayedTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No teachers found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : viewMode === "list" ? (
            <TeachersTable
              teachers={displayedTeachers}
              isRefetching={safeIsRefetching}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          ) : (
            <div className="p-5">
              <TeachersGrid teachers={displayedTeachers} isRefetching={safeIsRefetching} />
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {safeIsLoading
                  ? "Loading..."
                  : `Page ${currentPage + 1} of ${totalPages} · ${total} total teachers`}
              </p>

              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <div className={cn(isFirstPage || safeIsLoading ? "pointer-events-none opacity-35" : "")}>
                      <PaginationPrevious
                        href="#"
                        className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                      />
                    </div>
                  </PaginationItem>

                  {getVisiblePages().map((displayPage) => {
                    const actualPage = displayPage - 1;
                    return (
                      <PaginationItem key={displayPage}>
                        <PaginationLink
                          href="#"
                          className={cn(
                            "h-8 w-8 rounded-xl text-xs font-medium transition-all",
                            currentPage === actualPage
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "border-border hover:bg-muted text-muted-foreground"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(actualPage);
                          }}
                        >
                          {displayPage}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <div className={cn(isLastPage || safeIsLoading ? "pointer-events-none opacity-35" : "")}>
                      <PaginationNext
                        href="#"
                        className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                      />
                    </div>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}