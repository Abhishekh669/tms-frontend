import {   getTeacherVacanciesForTeacher } from "@/utils/action/teacher/teacher.get";
import {  pickTeacherVacancyQuery,  TeacherVacancyQuery } from "@/utils/types/teacher.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeacherVacanciesForTeacher = async (id: string, query: TeacherVacancyQuery) => {
  return getTeacherVacanciesForTeacher(id, pickTeacherVacancyQuery(query));
};

export const useGetTeacherVacanciesForTeacher = (id: string, query: TeacherVacancyQuery) => {
  const q = pickTeacherVacancyQuery(query);
  return useQuery({
    queryKey: ["get-teacher-vacancies-for-teacher", id, q.limit, q.page, q.phone, q.payment_status, q.vacancy_status],
    queryFn: () => fetchTeacherVacanciesForTeacher(id, q),
    placeholderData: keepPreviousData,

    staleTime: 1000 * 60 * 5,     // ✅ data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}