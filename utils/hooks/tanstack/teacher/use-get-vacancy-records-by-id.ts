import { getTeacherVacancyRecords } from "@/utils/action/teacher/teacher.get";
import { pickTeacherVacancyRecordsQuery, TeacherVacancyQuery, TeacherVacancyRecordsQuery } from "@/utils/types/teacher.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeacherVacanciesRecordById = async (query: TeacherVacancyRecordsQuery) => {
    return getTeacherVacancyRecords(pickTeacherVacancyRecordsQuery(query));
};

export const useGetTeacherVacancyRecordyById = (query: TeacherVacancyRecordsQuery) => {
    const q = pickTeacherVacancyRecordsQuery(query);
    return useQuery({
        queryKey: ["get-teacher-vacancy-records-by-id", q.vacancy_id, q.limit, q.page],
        queryFn: () => fetchTeacherVacanciesRecordById(q),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,   // ❌ stop refetch on tab switch
        refetchOnReconnect: false,    // ❌ stop refetch on internet reconnect
        refetchOnMount: false,        // ❌ don't refetch when component remounts

        staleTime: 1000 * 60 * 5,     // ✅ data stays fresh for 5 minutes
        gcTime: 1000 * 60 * 10,
    });
}