"use client";
import { useGetTeacherOverviewData } from "@/utils/hooks/tanstack/report/use-get-teacher-overall-stats";
import { SafeTokenTeacherData } from "@/utils/types/teacher.types";
import { GreetingRankSection } from "./greeting-rank-section";
import { DashboardStats } from "./dashboard-stats";
import { ActiveVacancyCards } from "./active-vacancy-cards";
import { VacancyWeeklyPerformance } from "./vacancy-weekly-performance";
import { AlertCircle } from "lucide-react";

function DashboardManagementPage({ teacher }: { teacher: SafeTokenTeacherData }) {
  if (!teacher) return null;
  const { data, isLoading, isError } = useGetTeacherOverviewData();
  const stats         = data?.dashboard_stats;
  const vacancyCards  = data?.active_vacancy_card;
  const dropdownItems = data?.active_vacancy_dropdown_item;
  const rankData      = data?.teacehr_ranking_data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      {isError && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Failed to load dashboard. Pull to refresh.
          </p>
        </div>
      )}
      <GreetingRankSection teacher={teacher} rankData={rankData} isLoading={isLoading} />
      <div className="h-4" />
      <DashboardStats stats={stats} isLoading={isLoading} />
      <div className="h-4" />
      <ActiveVacancyCards cards={vacancyCards} isLoading={isLoading} />
      <div className="h-4" />
      <VacancyWeeklyPerformance dropdownItems={dropdownItems} isLoading={isLoading} />
      <div className="h-6" />
    </div>
  );
}

export default DashboardManagementPage;