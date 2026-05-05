import { getVacancyById, getVacancyLists } from "@/utils/action/vacancy/vacancy.get";
import { pickVacancyQuery, VacancyQuery } from "@/utils/types/vacancy.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchVacancies = async (query: VacancyQuery) => {
  return getVacancyLists(pickVacancyQuery(query));
};

export const useGetAllVacancies = (query: VacancyQuery) => {
  const q = pickVacancyQuery(query);
  return useQuery({
    queryKey: [
      "get-all-vacancies",
      q.limit,
      q.page,
      q.search,
      q.location,
      q.contact_number,
      q.status,
      q.payment_status,
      q.gender,
      q.lat,
      q.lon,
    ],
    queryFn: () => fetchVacancies(q),
    placeholderData: keepPreviousData,
  });
};

export const fetchVacancyById = async (id: string) => {
  return getVacancyById(id);
};

export const useGetVacancyById = (id: string) => {
  return useQuery({
    queryKey: ["get-vacancy-by-id", id],
    queryFn: () => fetchVacancyById(id as string),
    enabled: Boolean(id),
  });
};
