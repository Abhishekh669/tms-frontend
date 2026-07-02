import { getTeacherVacancyRecordsForAdmin } from "@/utils/action/teacher/teacher.get";
import { pickTeacherVacancyRecordsForAdminQuery,  TeacherVacancyRecordsForAdminQuery, TeacherVacancyRecordsQuery } from "@/utils/types/teacher.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeacherVacanciesRecordByIdForAdmin = async (query: TeacherVacancyRecordsForAdminQuery) => {
    return getTeacherVacancyRecordsForAdmin(pickTeacherVacancyRecordsForAdminQuery(query));
};

export const useGetTeacherVacancyRecordyByIdForAdmin = (query: TeacherVacancyRecordsForAdminQuery) => {
    const q = pickTeacherVacancyRecordsForAdminQuery(query);
    return useQuery({
        queryKey: ["get-teacher-vacancy-records-by-id-for-admin", q.vacancy_id, q.limit, q.page],
        queryFn: () => fetchTeacherVacanciesRecordByIdForAdmin(q),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,   // ❌ stop refetch on tab switch
        refetchOnReconnect: false,    // ❌ stop refetch on internet reconnect
        refetchOnMount: false,        // ❌ don't refetch when component remounts

        staleTime: 1000 * 60 * 5,     // ✅ data stays fresh for 5 minutes
        gcTime: 1000 * 60 * 10,
    });
}