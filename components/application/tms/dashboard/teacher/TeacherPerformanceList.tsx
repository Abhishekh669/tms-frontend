// components/teachers/TeacherPerformanceTable.tsx

"use client";

import { useState } from "react";

import { AlertCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useGetTeacherPerformance } from "@/utils/hooks/tanstack/report/use-get-teacher-report";

// ─────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "on_duty" | "vacant" | string }) {
  if (status === "on_duty") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
      >
        On duty
      </Badge>
    );
  }
  if (status === "vacant") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
      >
        Vacant
      </Badge>
    );
  }
  // Unknown/unexpected status
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {status ?? "—"}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────

function PaginationStrip({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const delta = 2;
  const pages: (number | "…")[] = [];
  const start = Math.max(0, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  if (start > 0) {
    pages.push(0);
    if (start > 1) pages.push("…");
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) {
    if (end < totalPages - 2) pages.push("…");
    pages.push(totalPages - 1);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 0) onPage(page - 1);
            }}
            aria-disabled={page === 0}
            className={page === 0 ? "pointer-events-none opacity-40" : ""}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === "…" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPage(p as number);
                }}
              >
                {(p as number) + 1}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages - 1) onPage(page + 1);
            }}
            aria-disabled={page >= totalPages - 1}
            className={
              page >= totalPages - 1 ? "pointer-events-none opacity-40" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// ─────────────────────────────────────────────────────────────

function PerformanceError({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-5 flex items-start gap-3">
      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">
          Failed to load teacher performance
        </p>
        {message && (
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        )}
      </div>
    </div>
  );
}

function PerformanceEmpty({ query }: { query?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <Users className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {query ? `No teachers found for "${query}"` : "No teachers found"}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────

export function TeacherPerformanceTable() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [inputPhone, setInputPhone] = useState("");

  const { data, isLoading, error } = useGetTeacherPerformance({
    mode: "daily",
    page,
    limit: PAGE_LIMIT,
    search,
    phone,
  });

  const performance = data?.performance ?? null;
  const teachers = performance?.teachers ?? [];
  const total = performance?.total ?? 0;

  const applySearch = () => {
    setPage(0);
    setSearch(inputSearch.trim());
    setPhone(inputPhone.trim());
  };

  const resetSearch = () => {
    setPage(0);
    setSearch("");
    setPhone("");
    setInputSearch("");
    setInputPhone("");
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applySearch();
  }

  const activeQuery = search || phone || null;
  const errorMessage =
    error instanceof Error ? error.message : undefined;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold">Teacher performance</h3>
          {!isLoading && !error && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {total.toLocaleString()} teacher{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name or email"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs w-44"
          />
          <Input
            placeholder="Phone number"
            value={inputPhone}
            onChange={(e) => setInputPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs w-36"
          />
          <Button size="sm" className="h-8 text-xs px-3" onClick={applySearch}>
            Search
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs px-3"
            onClick={resetSearch}
          >
            Reset
          </Button>
        </div>
      </div>

      {error ? (
        <PerformanceError message={errorMessage} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                  <TableHead className="text-right">Commission paid</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : teachers.length === 0 ? (
                  <PerformanceEmpty query={activeQuery ?? undefined} />
                ) : (
                  teachers.map((t, idx) => {
                    if (t == null) return null;

                    const id = t.id ?? String(idx);
                    const name = t.name ?? "—";
                    const email = t.email ?? "—";
                    const phone = t.phone ?? "—";
                    const status = t.status ?? "vacant";
                    const gender = t.gender ?? "—";
                    const totalAssigned = t.total_assigned ?? 0;
                    const commission = t.total_commission_paid ?? 0;

                    return (
                      <TableRow key={id} className="text-sm">
                        <TableCell className="font-medium">{name}</TableCell>

                        <TableCell className="text-muted-foreground text-xs">
                          {email}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {phone}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>

                        <TableCell className="capitalize text-muted-foreground text-xs">
                          {gender}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {totalAssigned.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          NPR{" "}
                          {commission.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && performance && total > PAGE_LIMIT && (
            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Page {(performance.page ?? 0) + 1} of{" "}
                {Math.ceil(total / (performance.limit ?? PAGE_LIMIT))}
              </p>
              <PaginationStrip
                page={performance.page ?? 0}
                total={total}
                limit={performance.limit ?? PAGE_LIMIT}
                onPage={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}