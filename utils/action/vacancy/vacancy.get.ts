'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { Teacher } from "@/utils/types/teacher.types";
import {
  GetTeacherForVacancy,
  pickGetTeacherForVacancy,
  pickVacancyQuery,
  TeachersNearVacancyListResponse,
  VacancyListResponse,
  VacancyQuery,
  VacancyTypeById,
} from "@/utils/types/vacancy.types";
import axios from "axios";

export const getTeacherForVacancy = async (query: GetTeacherForVacancy) => {
  const q = pickGetTeacherForVacancy(query);
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/get-teacher-for-vacancy`,
      {
        params: {
          page: q.page,
          limit: q.limit,
          search: q.search || undefined,
          phone: q.phone || undefined,
        },
        headers: { Authorization: `Bearer ${user_token}` },
        withCredentials: true,
      }
    );
    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teachers for vacancy");
    }
    const raw =
      payload?.teacherSearchResponse ?? payload?.teachersSearchResponse;
    const teacherSearchResponse = raw as TeachersNearVacancyListResponse | undefined;
    if (!teacherSearchResponse) {
      throw new Error("failed to get teacher search response");
    }

    const teachers: Teacher[] = teacherSearchResponse?.teachers || [];
    const total: number = teacherSearchResponse?.total || 0;
    const has_more: boolean = teacherSearchResponse?.has_more || false;
    const next_offset: number = teacherSearchResponse?.next_offset || 0;

    return {
      success: true,
      teachers,
      total,
      has_more,
      next_offset,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export type SearchTeachersForVacancyParams = {
  vacancyId: string;
  page?: number;
  limit?: number;
  lat?: number;
  lon?: number;
  location?: string;
  search?: string;
  phone?: string;
};

export const searchTeachersForVacancy = async (params: SearchTeachersForVacancyParams) => {
  const {
    vacancyId,
    page = 0,
    limit = 20,
    lat,
    lon,
    location,
    search = "",
    phone = "",
  } = params;
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/search-teachers-for-vacancy/${vacancyId}`,
      {
        params: {
          page,
          limit,
          ...(typeof lat === "number" && Number.isFinite(lat) ? { lat } : {}),
          ...(typeof lon === "number" && Number.isFinite(lon) ? { lon } : {}),
          ...(location ? { location } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
        headers: { Authorization: `Bearer ${user_token}` },
        withCredentials: true,
      }
    );
    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to search teachers for vacancy");
    }
    const raw =
      payload?.teachersSearchResponse ?? payload?.teacherSearchResponse;
    const teacherSearchResponse = raw as TeachersNearVacancyListResponse | undefined;
    if (!teacherSearchResponse) {
      throw new Error("failed to get teacher search response");
    }

    const teachers: Teacher[] = teacherSearchResponse?.teachers || [];
    const total: number = teacherSearchResponse?.total || 0;
    const has_more: boolean = teacherSearchResponse?.has_more || false;
    const next_offset: number = teacherSearchResponse?.next_offset || 0;

    return {
      success: true,
      teachers,
      total,
      has_more,
      next_offset,
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
