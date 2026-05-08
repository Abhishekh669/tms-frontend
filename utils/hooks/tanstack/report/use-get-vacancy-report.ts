// utils/hooks/tanstack/report/use-get-vacancy-report.ts

import { useQuery } from "@tanstack/react-query";
import {
  getVacancyOverview,
  getVacancyTrend,
  getVacancyLocationDensity,
  getSupplyDemand,
  getRevenueOverview,
  getRevenueTrend,
  getMonthlyRevenueSummary,
} from "@/utils/action/report/vacancy.report.get";
import type {
  VacancyTrendMode,
  RevenueTrendMode,
} from "@/utils/types/report.types";

// 🔥 Shared config (no repetition)
const COMMON_QUERY_CONFIG = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 2,
};

// ── 1. Vacancy Overview ────────────────────────────────────────

export function useGetVacancyOverview() {
  return useQuery({
    queryKey: ["vacancy-overview"],
    queryFn: getVacancyOverview,
    staleTime: 1000 * 60 * 5,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 2. Vacancy Trend ───────────────────────────────────────────

export function useGetVacancyTrend(params: {
  mode: VacancyTrendMode;
  from?: string | null;
  to?: string | null;
}) {
  return useQuery({
    queryKey: ["vacancy-trend", params.mode, params.from, params.to],
    queryFn: () => getVacancyTrend(params),
    staleTime: 1000 * 60 * 5,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 3. Vacancy Location Density ────────────────────────────────

export function useGetVacancyLocationDensity() {
  return useQuery({
    queryKey: ["vacancy-location-density"],
    queryFn: getVacancyLocationDensity,
    staleTime: 1000 * 60 * 10,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 4. Supply vs Demand ────────────────────────────────────────

export function useGetSupplyDemand() {
  return useQuery({
    queryKey: ["supply-demand"],
    queryFn: getSupplyDemand,
    staleTime: 1000 * 60 * 5,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 5. Revenue Overview ────────────────────────────────────────

export function useGetRevenueOverview() {
  return useQuery({
    queryKey: ["revenue-overview"],
    queryFn: getRevenueOverview,
    staleTime: 1000 * 60 * 5,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 6. Revenue Trend ───────────────────────────────────────────

export function useGetRevenueTrend(params: {
  mode: RevenueTrendMode;
  from?: string | null;
  to?: string | null;
}) {
  return useQuery({
    queryKey: ["revenue-trend", params.mode, params.from, params.to],
    queryFn: () => getRevenueTrend(params),
    staleTime: 1000 * 60 * 5,
    ...COMMON_QUERY_CONFIG,
  });
}

// ── 7. Monthly Revenue Summary ─────────────────────────────────

export function useGetMonthlyRevenueSummary() {
  return useQuery({
    queryKey: ["monthly-revenue-summary"],
    queryFn: getMonthlyRevenueSummary,
    staleTime: 1000 * 60 * 10,
    ...COMMON_QUERY_CONFIG,
  });
}