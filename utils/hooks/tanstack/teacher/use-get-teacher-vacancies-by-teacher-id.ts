import { getTeacherVacancyRecordsByTeacherId } from "@/utils/action/teacher/teacher.get";
import { GetTeacherVacanciesRecordsByTeacherIdQuery } from "@/utils/types/teacher.types";
import { useQuery } from "@tanstack/react-query";

export const fetchTeacherVacanciesByTeacherId = async (teacherId : string, query : GetTeacherVacanciesRecordsByTeacherIdQuery) => {
    const res = await getTeacherVacancyRecordsByTeacherId(teacherId, query);
    return res;
};

export const useGetTeacherVacanciesByTeacherId = (teacherId: string, query: GetTeacherVacanciesRecordsByTeacherIdQuery) => {
    return useQuery({
        queryKey: ["get-teacher-vacancies-by-teacher-id", teacherId, query],
        queryFn: () => fetchTeacherVacanciesByTeacherId(teacherId, query),
        retry: false,
        refetchOnWindowFocus: true, // refresh on tab focus
  });
}