import { getTeacherVacancyReportData, getVacancyWeeklyPerformance } from "@/utils/action/report/teacher.report.get";
import { useQuery } from "@tanstack/react-query";

export const fetchTeacherOverviewData = async () => {
  const res = await getTeacherVacancyReportData();
  return res;
};

export const useGetTeacherOverviewData = () => {
  return useQuery({
    queryKey: ["get-teacher-overview-data"],
    queryFn: fetchTeacherOverviewData,
    retry: false,
  });
};




export const fetchWeeklyOverAllProgress = async (vacancy_id : string) =>{
    const res = await getVacancyWeeklyPerformance(vacancy_id)
    return res;
}


export const useGetVacancyWeeklyPerformance = (vacancy_id : string) => {
  return useQuery({
    queryKey: ["get-vacancy-weekly-performance", vacancy_id],
    queryFn: ()=> fetchWeeklyOverAllProgress(vacancy_id),
    retry: false,
    enabled : !!vacancy_id
  });
};
