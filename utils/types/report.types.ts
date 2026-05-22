// types/teacher-report.ts


export interface GrowthTreand {
    mode : "daily" | "weekly" | "monthly";
    from ?: string | null;
    to ?: string | null;
}

export interface TeacherReportQuery {
    mode : "daily" | "weekly" | "monthly";
    page : number;
    limit : number; 
    search ?: string | null;
    phone ?: string | null;
}

export interface OverAllTeacherReport {
    teacher_overview : TeacherOverview;
    growth_data : GrowthData;
    teacher_location : TeacherLocation[]
    teacher_performance_list : TeacherPerformanceList
}

export interface TeacherOverview {
  total: number;
  on_duty: number;
  vacant: number;
  male: number;
  female: number;
}

export interface GrowthPoint {
  period: string; // "2025-05-01" | "2025-W18" | "2025-04"
  count: number;
}

export type GrowthMode = "daily" | "weekly" | "monthly";

export interface GrowthData {
  points: GrowthPoint[];
  mode: GrowthMode;
}

export interface TeacherLocation {
  name: string;
  phone: string;
  lat: number;
  long: number;
  location: string;
  location_hint: string;
}

export interface TeacherPerformance {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "on_duty" | "vacant";
  gender: "male" | "female" | "other";
  total_assigned: number;
  total_commission_paid: number;
}

export interface TeacherPerformanceList {
  teachers: TeacherPerformance[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  next_page: number;
}



// utils/types/vacancy-report.types.ts

// ── Vacancy Overview ──────────────────────────────────────────────────────────

export interface VacancyOverview {
  total: number;
  open: number;
  assigned: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  last_7_days: number;
}

// ── Vacancy Trend ─────────────────────────────────────────────────────────────

export type VacancyStatus =
  | "open"
  | "assigned"
  | "ongoing"
  | "completed"
  | "cancelled";

export type VacancyTrendMode = "daily" | "weekly" | "monthly";

export interface VacancyTrendPoint {
  period: string;
  open: number;
  assigned: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export interface VacancyTrendData {
  points: VacancyTrendPoint[];
  mode: VacancyTrendMode;
}

// ── Vacancy Locations (density) ───────────────────────────────────────────────

export interface VacancyLocationDensity {
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  vacancy_count: number;
}

// ── Supply vs Demand ──────────────────────────────────────────────────────────

export interface SupplyDemandRow {
  location: string;
  vacancy_count: number;   // demand
  teacher_count: number;   // supply
  gap: number;             // vacancy_count - teacher_count (positive = understaffed)
}

// ── Revenue Overview ──────────────────────────────────────────────────────────

export interface RevenueOverview {
  total_revenue: number;      // SUM of commission_charge for all completed/partial
  pending: number;
  partial: number;
  completed: number;
  failed: number;
  total_vacancies_with_payment: number;
}

// ── Revenue Trend ─────────────────────────────────────────────────────────────

export type RevenueTrendMode = "daily" | "weekly" | "monthly";

export interface RevenueTrendPoint {
  period: string;
  completed: number;
  partial: number;
  pending: number;
  failed: number;
}

export interface RevenueTrendData {
  points: RevenueTrendPoint[];
  mode: RevenueTrendMode;
}

// ── Monthly Revenue Summary ───────────────────────────────────────────────────

export interface MonthlyRevenueSummary {
  avg_monthly_income: number;
  best_month: string;         // e.g. "2025-04"
  best_month_amount: number;
  current_month_income: number;
  last_12_months: MonthlySummaryPoint[];
}

export interface MonthlySummaryPoint {
  month: string;    // "2025-04"
  completed: number;
  partial: number;
  pending: number;
  failed: number;
  total: number;
}



export interface TeacherDashboardStats {
  active_vacancies: number; // ongoing+assigned count
  total_vacancies: number; // all ever assigned
  total_tests: number; // tests on active vacancies
  pass_rate: number; // 0-100, avg of per-vac rates
  commission_due: number;
}

// ActiveVacancyCard is shown in the "latest 3 active vacancies" component.
export interface ActiveVacancyCard {
  id: string;
  code: string;
  subject: string;
  grade: string;
  salary: number;
  contact_number: string;
  location: string;
  location_hint: string;
  status: string;

  // Payment progress
  amount_to_be_paid: number;
  payment_done: number;
  remaining_amount: number;
  payment_status: string;
}

// Used for the weekly-test dropdown selector.
export interface ActiveVacancyDropdownItem {
  id: string;
  code: string;
  subject: string;
  grade: string;
  status: string;

  // tests submitted for this vacancy so far
  total_tests: number;
}

// One weekly test record
export interface WeeklyTestRecord {
  id: string;
  subject: string;
  submitted_date: string; // ISO date string
  full_marks: number;
  pass_marks: number;
  student_mark: number;
  gpa: number; // 0.0 – 4.0
  passed: boolean;
  image_link: string;
  verified: boolean;
}

// Returned when selecting a vacancy from dropdown
export interface VacancyWeeklyProgress {
  vacancy_id: string;
  vacancy_code: string;
  subject: string;
  grade: string;

  tests: WeeklyTestRecord[];

  total_tests: number;
  pass_rate: number; // 0-100
  avg_gpa: number; // 0-4
}

// Teacher leaderboard rank
export interface TeacherRank {
  teacher_id: string; // UUID
  rank: number; // 1-based; 0 = not ranked
  total_teachers: number;

  total_tests: number;
  avg_pass_rate: number; // 0-100
  avg_gpa: number; // 0-4

  score: number; // 0-100 composite
  window_days: number;
}



export interface  OverAllDasboardData{
  dashboard_stats : TeacherDashboardStats
  active_vacancy_card : ActiveVacancyCard[]
  active_vacancy_dropdown_item : ActiveVacancyDropdownItem[]
  teacher_ranking_data : TeacherRank
} 