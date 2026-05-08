// actions/vacancy-report.actions.ts

"use server";

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import axios from "axios";

import type {
  VacancyOverview,
  VacancyTrendData,
  VacancyTrendMode,
  VacancyLocationDensity,
  SupplyDemandRow,
  RevenueOverview,
  RevenueTrendData,
  RevenueTrendMode,
  MonthlyRevenueSummary,
} from "@/utils/types/report.types";

// ── Base URL ───────────────────────────────────────────────────

const BASE = `${process.env.NEXT_BACKEND_URL}/api/v1/report-service`;

// ── Route Constants (🔥 prevents bugs) ─────────────────────────

const REPORT_ROUTES = {
  vacancy: {
    overview: "/get-vacancy-reports/overview",
    trend: "/get-vacancy-reports/trend",
    locationDensity: "/get-vacancy-reports/location-density", // ✅ FIXED
    supplyDemand: "/get-vacancy-reports/supply-demand",
  },
  revenue: {
    overview: "/get-revenue-reports/overview",
    trend: "/get-revenue-reports/trend",
    monthly: "/get-revenue-reports/monthly-summary",
  },
};

// ── Auth Header ────────────────────────────────────────────────

async function authHeader() {
  const token = await get_cookies("user_token");
  if (!token) throw new Error("Unauthorized user");

  return {
    Authorization: `Bearer ${token}`,
  };
}

// ── Generic GET Helper (🔥 reusable) ───────────────────────────

async function fetchGET<T>(url: string, params?: Record<string, unknown>) {
  try {
    const headers = await authHeader();

    const res = await axios.get(url, {
      headers,
      params,
      withCredentials: true,
    });

    const { data } = res;

    if (!data?.success || !data?.payload) {
      throw new Error(data?.error || "Request failed");
    }

    return data.payload.data as T;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ── 1. Vacancy Overview ────────────────────────────────────────

export async function getVacancyOverview() {
  const data = await fetchGET<VacancyOverview>(
    `${BASE}${REPORT_ROUTES.vacancy.overview}`
  );

  return {
    success: true,
    overview: data,
  };
}

// ── 2. Vacancy Trend ───────────────────────────────────────────

export async function getVacancyTrend(params: {
  mode: VacancyTrendMode;
  from?: string | null;
  to?: string | null;
}) {
  const data = await fetchGET<VacancyTrendData>(
    `${BASE}${REPORT_ROUTES.vacancy.trend}`,
    params
  );

  return {
    success: true,
    trend: data,
  };
}

// ── 3. Vacancy Location Density ────────────────────────────────

export async function getVacancyLocationDensity() {
  const data = await fetchGET<VacancyLocationDensity[]>(
    `${BASE}${REPORT_ROUTES.vacancy.locationDensity}`
  );

  return {
    success: true,
    locations: data,
  };
}

// ── 4. Supply vs Demand ────────────────────────────────────────

export async function getSupplyDemand() {
  const data = await fetchGET<SupplyDemandRow[]>(
    `${BASE}${REPORT_ROUTES.vacancy.supplyDemand}`
  );

  return {
    success: true,
    rows: data,
  };
}

// ── 5. Revenue Overview ────────────────────────────────────────

export async function getRevenueOverview() {
  const data = await fetchGET<RevenueOverview>(
    `${BASE}${REPORT_ROUTES.revenue.overview}`
  );

  return {
    success: true,
    overview: data,
  };
}

// ── 6. Revenue Trend ───────────────────────────────────────────

export async function getRevenueTrend(params: {
  mode: RevenueTrendMode;
  from?: string | null;
  to?: string | null;
}) {
  const data = await fetchGET<RevenueTrendData>(
    `${BASE}${REPORT_ROUTES.revenue.trend}`,
    params
  );

  return {
    success: true,
    trend: data,
  };
}

// ── 7. Monthly Revenue Summary ─────────────────────────────────

export async function getMonthlyRevenueSummary() {
  const data = await fetchGET<MonthlyRevenueSummary>(
    `${BASE}${REPORT_ROUTES.revenue.monthly}`
  );

  return {
    success: true,
    summary: data,
  };
}