import { getTeacherLists } from "@/utils/action/teacher/teacher.get";
import { pickTeacherQuery, TeacherQuery } from "@/utils/types/teacher.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeachers = async (query: TeacherQuery) => {
  return getTeacherLists(pickTeacherQuery(query));
};

export const useGetAllTeachers = (query: TeacherQuery) => {
  const q = pickTeacherQuery(query);
  return useQuery({
    queryKey: ["get-all-teachers", q.limit, q.page, q.phone, q.search],
    queryFn: () => fetchTeachers(q),
    placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,   // ❌ stop refetch on tab switch
    refetchOnReconnect: false,    // ❌ stop refetch on internet reconnect
    refetchOnMount: false,        // ❌ don't refetch when component remounts

    staleTime: 1000 * 60 * 5,     // ✅ data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}