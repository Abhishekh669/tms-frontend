import { searchTeachersForVacancy } from "@/utils/action/vacancy/vacancy.get";
import {
  pickTeachersNearVacancyQuery,
  TeachersNearVacancyQuery,
} from "@/utils/types/vacancy.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchNearbyTeachers = async (query: TeachersNearVacancyQuery) => {
  const q = pickTeachersNearVacancyQuery(query);
  return searchTeachersForVacancy({
    vacancyId: q.vacancyId,
    page: q.page,
    limit: q.limit,
    lat: q.lat,
    lon: q.lon,
    location: q.location,
    search: q.search,
    phone: q.phone,
  });
};

export const useGetNearbyTeachers = (
  query: TeachersNearVacancyQuery,
  opts?: { enabled?: boolean }
) => {
  const q = pickTeachersNearVacancyQuery(query);
  return useQuery({
    queryKey: [
      "get-nearby-teachers",
      q.vacancyId,
      q.page,
      q.limit,
      q.lat,
      q.lon,
      q.location,
      q.search,
      q.phone,
    ],
    queryFn: () => fetchNearbyTeachers(q),
    placeholderData: keepPreviousData,
    enabled: (opts?.enabled ?? true) && q.vacancyId.trim().length > 0,
    staleTime: 100 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};