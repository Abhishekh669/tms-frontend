"use client"
import { Button } from '@/components/ui/button';
import { SafeTokenTeacherData, TeacherVacancyRecordsQuery, VacancyRecordType, VacancyDataForVacancyRecords, TeacherVacancyRecordStats } from '@/utils/types/teacher.types'
import { useParams } from 'next/navigation';
import { useState } from 'react';
import AddVacancyRecordDialogBox from './AddVacancyRecordDialogBox';
import { useGetTeacherVacancyRecordyById } from '@/utils/hooks/tanstack/teacher/use-get-vacancy-records-by-id';
import {
  MapPin,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Calendar,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  BarChart2,
  Percent,
  CreditCard,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { RecordCard } from './RecordCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
function fmtCurrency(n: number) {
  return `Rs ${n.toLocaleString("en-US")}`;
}

// ─── Payment status badge ─────────────────────────────────────────────────────

const paymentColors: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
  partial:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed:    "bg-red-500/10 text-red-600 border-red-500/20",
};

function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", paymentColors[status] ?? paymentColors.pending)}>
      {status}
    </span>
  );
}

// ─── Vacancy status badge ─────────────────────────────────────────────────────

const vacancyStatusColors: Record<string, string> = {
  open:      "bg-sky-500/10 text-sky-600 border-sky-500/20",
  assigned:  "bg-violet-500/10 text-violet-600 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ongoing:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

function VacancyStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", vacancyStatusColors[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}

// ─── Vacancy Detail Card ──────────────────────────────────────────────────────

function VacancyDetailCard({ v }: { v: VacancyDataForVacancyRecords }) {
  const paidPct = v.amount_to_be_paid > 0
    ? Math.min(100, Math.round((v.payment_done / v.amount_to_be_paid) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header strip - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Vacancy</p>
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">{v.title}</h2>
          {v.subject && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{v.subject}</p>}
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 shrink-0">
          <VacancyStatusBadge status={v.status} />
          <PaymentBadge status={v.payment_status} />
        </div>
      </div>

      {/* Info grid — 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-4 px-4 py-3 sm:py-4">
        <InfoItem icon={<MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Location" value={v.location} hint={v.location_hint} />
        <InfoItem icon={<Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Students" value={String(v.no_of_students)} />
        <InfoItem icon={<BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Grade" value={v.grade} />
        <InfoItem icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Time" value={v.time} />
        <InfoItem icon={<span className='text-sm'>Rs</span>} label="Salary" value={fmtCurrency(v.salary)} />
        <InfoItem icon={<CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Commission" value={fmtCurrency(v.commission_charge)} />
      </div>

      {/* Payment bar - responsive */}
      <div className="px-4 pb-4">
        <div className="rounded-xl bg-muted/40 border border-border p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wide">Payment Progress</span>
            <span className="font-bold text-foreground sm:text-base">{paidPct}%</span>
          </div>
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] sm:text-xs text-muted-foreground">
            <span>Paid: <span className="text-emerald-600 font-semibold">{fmtCurrency(v.payment_done)}</span></span>
            <span>Remaining: <span className="text-amber-600 font-semibold">{fmtCurrency(v.remaining_amount)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xs sm:text-sm font-medium text-foreground truncate">{value}</p>
        {hint && <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: TeacherVacancyRecordStats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MiniStat
        icon={<BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Total Tests"
        value={String(stats.total_records)}
        accent="#6366f1"
      />
      <MiniStat
        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Avg Mark"
        value={stats.average_mark.toFixed(2)}
        accent="#3b82f6"
      />
      <MiniStat
        icon={<Percent className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Pass Rate"
        value={`${stats.pass_rate.toFixed(1)}%`}
        accent="#10b981"
      />
    </div>
  );
}

function MiniStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }} />
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
        <span className="p-1.5 sm:p-2 rounded-lg" style={{ background: `${accent}18`, color: accent }}>{icon}</span>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-0.5 sm:mt-1">{label}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecordSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-4 w-12 rounded-full bg-muted" />
      </div>
      <div className="h-6 w-1/3 rounded bg-muted" />
      <div className="h-1.5 w-full rounded-full bg-muted" />
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-14 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function VacancyRecordsById({ teacher }: { teacher: SafeTokenTeacherData }) {
  if (!teacher) return null;

  const params = useParams();
  const vacancyId = (params?.["id"] ?? params?.id ?? "") as string;
  if (!vacancyId) return null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<TeacherVacancyRecordsQuery>({
    limit: 20,
    page: 0,
    vacancy_id: vacancyId,
  });

  const { data, isLoading, error, refetch } = useGetTeacherVacancyRecordyById(query);
  console.log("this is the data of the teacher : ", data)

  const vacancy = data?.vacancy_details;
  const records = data?.records ?? [];
  const stats = data?.stats;
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / query.limit) : 1;
  const currentPage = query.page;

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages || isLoading) return;
    setQuery((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVisiblePages = () => {
    const pages: number[] = [];
    // Show more pages on desktop
    const pageRange = window.innerWidth >= 640 ? 2 : 1;
    const start = Math.max(0, currentPage - pageRange);
    const end = Math.min(totalPages - 1, currentPage + pageRange);
    for (let i = start; i <= end; i++) pages.push(i + 1);
    return pages;
  };

  return (
    <>
      {/* Mobile view (max-width: 640px) */}
      <div className="block sm:hidden">
        <div className="min-h-screen space-y-4 px-3 py-4 max-w-2xl mx-auto">
          {/* ── Add Record Dialog ── */}
          <AddVacancyRecordDialogBox
            open={open}
            setOpen={setOpen}
            teacher={teacher}
            vacancyId={vacancyId}
            onSuccess={() => { refetch(); setOpen(false); }}
          />

          {/* ── Vacancy Detail Card ── */}
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-muted" />
                ))}
              </div>
            </div>
          ) : vacancy ? (
            <VacancyDetailCard v={vacancy} />
          ) : null}

          {/* ── Stats ── */}
          {stats && !isLoading && <StatsRow stats={stats} />}

          {/* ── Records Header ── */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-sm font-bold text-foreground">Weekly Test Records</h3>
              <p className="text-[11px] text-muted-foreground">{total} record{total !== 1 ? "s" : ""} total</p>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-xl gap-1.5 text-xs font-semibold px-3"
              onClick={() => setOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </Button>
          </div>

          {/* ── Records List ── */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <RecordSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center rounded-2xl border border-border bg-card">
              <AlertCircle className="w-7 h-7 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load records</p>
              <Button size="sm" variant="outline" className="rounded-xl mt-1" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
              <BookOpen className="w-7 h-7 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No records yet</p>
              <p className="text-xs text-muted-foreground">Add the first weekly test record.</p>
              <Button size="sm" className="rounded-xl mt-1 gap-1.5" onClick={() => setOpen(true)}>
                <Plus className="w-3.5 h-3.5" />Add Record
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} onRefetch={refetch} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Page {currentPage + 1} of {totalPages} · {total} total
                </p>
                <Pagination>
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <div className={cn(currentPage === 0 || isLoading ? "pointer-events-none opacity-35" : "")}>
                        <PaginationPrevious
                          href="#"
                          className="h-8 rounded-xl text-xs border-border hover:bg-muted px-2"
                          onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
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
                            onClick={(e) => { e.preventDefault(); handlePageChange(actualPage); }}
                          >
                            {displayPage}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <div className={cn(currentPage >= totalPages - 1 || isLoading ? "pointer-events-none opacity-35" : "")}>
                        <PaginationNext
                          href="#"
                          className="h-8 rounded-xl text-xs border-border hover:bg-muted px-2"
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

      {/* Desktop view (min-width: 641px) */}
      <div className="hidden sm:block min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Vacancy Records</h1>
            <p className="text-muted-foreground mt-1">Manage and track all test records for this vacancy</p>
          </div>

          {/* ── Add Record Dialog ── */}
          <AddVacancyRecordDialogBox
            open={open}
            setOpen={setOpen}
            teacher={teacher}
            vacancyId={vacancyId}
            onSuccess={() => { refetch(); setOpen(false); }}
          />

          {/* ── Vacancy Detail Card ── */}
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="h-6 w-64 rounded bg-muted" />
                <div className="h-6 w-24 rounded-full bg-muted" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded bg-muted" />
                ))}
              </div>
            </div>
          ) : vacancy ? (
            <VacancyDetailCard v={vacancy} />
          ) : null}

          {/* ── Stats ── */}
          {stats && !isLoading && (
            <div className="mt-6">
              <StatsRow stats={stats} />
            </div>
          )}

          {/* ── Records Header ── */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Test Records</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {total} record{total !== 1 ? "s" : ""} total
              </p>
            </div>
            <Button
              size="default"
              className="h-10 rounded-xl gap-2 text-sm font-semibold px-4 shadow-sm"
              onClick={() => setOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </div>

          {/* ── Records Grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <RecordSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-2xl border border-border bg-card">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-base font-semibold text-foreground">Failed to load records</p>
              <p className="text-sm text-muted-foreground">There was an error loading the test records. Please try again.</p>
              <Button size="default" variant="outline" className="rounded-xl mt-2" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/50">
              <BookOpen className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">No records yet</p>
              <p className="text-sm text-muted-foreground">Add the first weekly test record to get started.</p>
              <Button size="default" className="rounded-xl mt-2 gap-2" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Add First Record
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} onRefetch={refetch} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {currentPage * query.limit + 1} to {Math.min((currentPage + 1) * query.limit, total)} of {total} records
                </p>
                <Pagination>
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <div className={cn(currentPage === 0 || isLoading ? "pointer-events-none opacity-35" : "")}>
                        <PaginationPrevious
                          href="#"
                          className="h-9 rounded-xl text-sm border-border hover:bg-muted px-3"
                          onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        />
                      </div>
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage < 3) {
                        pageNum = i + 1;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      const actualPage = pageNum - 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            className={cn(
                              "h-9 w-9 rounded-xl text-sm font-medium transition-all",
                              currentPage === actualPage
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "border-border hover:bg-muted text-muted-foreground"
                            )}
                            onClick={(e) => { e.preventDefault(); handlePageChange(actualPage); }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <div className={cn(currentPage >= totalPages - 1 || isLoading ? "pointer-events-none opacity-35" : "")}>
                        <PaginationNext
                          href="#"
                          className="h-9 rounded-xl text-sm border-border hover:bg-muted px-3"
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
    </>
  );
}

export default VacancyRecordsById;