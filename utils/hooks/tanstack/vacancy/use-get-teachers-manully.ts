import { getTeacherForVacancy } from "@/utils/action/vacancy/vacancy.get";
import {
  GetTeacherForVacancy,
  pickGetTeacherForVacancy,
} from "@/utils/types/vacancy.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchTeachersManully = async (query: GetTeacherForVacancy) => {
  return getTeacherForVacancy(pickGetTeacherForVacancy(query));
};

export const useGetTeachersManully = (
  query: GetTeacherForVacancy,
  opts?: { enabled?: boolean }
) => {
  const q = pickGetTeacherForVacancy(query);
  return useQuery({
    queryKey: ["get-teachers-manully", q.search, q.phone, q.limit, q.page],
    queryFn: () => fetchTeachersManully(q),
    placeholderData: keepPreviousData,
    enabled: opts?.enabled ?? true,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};