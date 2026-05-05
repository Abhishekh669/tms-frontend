import { searchTeachersForVacancy } from "@/utils/action/vacancy/vacancy.get";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchNearbyTeachers = async (vacancyId : string, lat?: number, lon?: number, location?: string) => {
  const res = await searchTeachersForVacancy(vacancyId, lat, lon, location);
  return res;
}

export const useGetNearbyTeachers = (
  vacancyId : string,
  lat?: number,
  lon?: number,
  location?: string,
  opts?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["get-nearby-teachers", vacancyId, lat, lon, location],
    queryFn: () => fetchNearbyTeachers(vacancyId, lat, lon, location),
    placeholderData: keepPreviousData,
    enabled : (opts?.enabled ?? true) && vacancyId.trim().length > 0,
    staleTime: 100 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    meta : {
      persist : true
    }
  });
}