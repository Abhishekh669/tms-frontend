'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { Teacher } from "@/utils/types/teacher.types";
import {
  pickVacancyQuery,
  VacancyListResponse,
  VacancyQuery,
  VacancyTypeById,
} from "@/utils/types/vacancy.types";
import axios from "axios";

export const searchTeachersForVacancy = async( vacancyId : string, lat?: number, lon?: number, location?: string) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/search-teachers-for-vacancy/${vacancyId}`,
      {
        params: { lat, lon, location },
        headers: { Authorization: `Bearer ${user_token}` },
        withCredentials: true,
      }
    );
    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to search teachers for vacancy");
    }
    const teachers : Teacher[] = payload?.teachers;
   
    return {
      success: true,
      teachers,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getVacancyLists = async (query: VacancyQuery) => {
  const q = pickVacancyQuery(query);
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const params: Record<string, string | number> = {
      offset: q.page ?? 0,
      limit: q.limit ?? 20,
      search: q.search ?? "",
      location: q.location ?? "",
      contact_number: q.contact_number ?? "",
      status: q.status ?? "",
      payment_status: q.payment_status ?? "",
      gender: q.gender ?? "",
    };
    if (typeof q.lat === "number" && typeof q.lon === "number") {
      params.lat = q.lat;
      params.lon = q.lon;
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/get-all-vacancies`,
      {
        params,
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get vacancies");
    }

    const vacanciesResponse: VacancyListResponse = payload?.vacanciesResponse;
    if (!vacanciesResponse) {
      throw new Error("failed to get vacancies");
    }

    return {
      success: true,
      vacanciesResponse,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getVacancyById = async (id: string) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/get-vacancy-by-id/${id}`,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get vacancy by id");
    }

    const vacancy: VacancyTypeById = payload?.vacancy;
    if (!vacancy) {
      throw new Error("failed to get vacancy by id");
    }

    return {
      success: true,
      vacancy,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
