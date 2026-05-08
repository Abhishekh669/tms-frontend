// hooks/report/use.teacher.overview.ts

import { useQuery } from "@tanstack/react-query";
import { getTeacherOverview } from "@/utils/action/report/teacher.report.get";

export const fetchTeacherOverview = async () => {
  const res = await getTeacherOverview();
  return res;
};

export const useGetTeacherOverview = () => {
  return useQuery({
    queryKey: ["get-teacher-overview"],
    queryFn: fetchTeacherOverview,
    retry: false,
  });
};



// hooks/report/use.teacher.growth.ts


import { getTeacherGrowth } from "@/utils/action/report/teacher.report.get";
import { GrowthTreand } from "@/utils/types/report.types";

export const fetchTeacherGrowth = async (
  query: GrowthTreand
) => {
  const res = await getTeacherGrowth(query);
  return res;
};

export const useGetTeacherGrowth = (
  query: GrowthTreand
) => {
  return useQuery({
    queryKey: ["get-teacher-growth", query],
    queryFn: () => fetchTeacherGrowth(query),
    retry: false,
  });
};


// hooks/report/use.teacher.locations.ts


import { getTeacherLocations } from "@/utils/action/report/teacher.report.get";

export const fetchTeacherLocations = async () => {
  const res = await getTeacherLocations();
  return res;
};

export const useGetTeacherLocations = () => {
  return useQuery({
    queryKey: ["get-teacher-locations"],
    queryFn: fetchTeacherLocations,
    retry: false,
  });
};


// hooks/report/use.teacher.performance.ts


import { getTeacherPerformance } from "@/utils/action/report/teacher.report.get";
import { TeacherReportQuery } from "@/utils/types/report.types";

export const fetchTeacherPerformance = async (
  query: TeacherReportQuery
) => {
  const res = await getTeacherPerformance(query);
  return res;
};

export const useGetTeacherPerformance = (
  query: TeacherReportQuery
) => {
  return useQuery({
    queryKey: ["get-teacher-performance", query],
    queryFn: () => fetchTeacherPerformance(query),
    retry: false,
  });
};