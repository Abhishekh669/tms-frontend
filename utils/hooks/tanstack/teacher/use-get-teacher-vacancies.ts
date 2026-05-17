import {  getTeacherVacancies } from "@/utils/action/teacher/teacher.get";
import {  pickTeacherVacancyQuery,  TeacherVacancyQuery } from "@/utils/types/teacher.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeacherVacancies = async (id: string, query: TeacherVacancyQuery) => {
  return getTeacherVacancies(id, pickTeacherVacancyQuery(query));
};

export const useGetAllTeacherVacancies = (id: string, query: TeacherVacancyQuery) => {
  const q = pickTeacherVacancyQuery(query);
  return useQuery({
    queryKey: ["get-all-teacher-vacancies", id, q.limit, q.page, q.phone, q.payment_status, q.vacancy_status],
    queryFn: () => fetchTeacherVacancies(id, q),
    placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,   // ❌ stop refetch on tab switch
    refetchOnReconnect: false,    // ❌ stop refetch on internet reconnect
    refetchOnMount: false,        // ❌ don't refetch when component remounts

    staleTime: 1000 * 60 * 5,     // ✅ data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}