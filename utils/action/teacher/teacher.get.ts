'use server'

import { getErrorMessage } from "@/utils/helper/get.error.message"
import { pickTeacherQuery, pickTeacherVacancyQuery, pickTeacherVacancyRecordsQuery, SafeTokenTeacherData, Teacher, TeacherQuery, TeachersListResponse, TeacherVacancyQuery, TeacherVacancyRecordsQuery, TeacherVacancyResponse, VacancyDataForVacancyRecords, VacancyRecordDataResponse } from "@/utils/types/teacher.types"
import { get_cookies } from "@/utils/helper/get-cookies";
import axios from "axios";
import { TeacherVacancyData, } from "@/utils/types/vacancy.types";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const getForgetPasswordSession = async (email: string, token: string) => {
  try {
    const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-forget-password-session?email=${email}&token=${token}`)
    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "Failed to get forget password session");
    }

    return {
      success: true,
      message: data?.message || "Forget password session created successfully"
    }
  } catch (error) {
    error = getErrorMessage(error);
    console.log("Error in getForgetPasswordSession: ", error);
    throw new Error(error as string)
  }
}

export const getChangePasswordSession = async (email: string, token: string) => {
  try {
    const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-change-password-session?email=${email}&token=${token}`)
    const data = res.data;
    const payload = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "Failed to get forget password session");
    }

    return {
      success: true,
      message: data?.message || "Forget password session created successfully"
    }
  } catch (error) {
    error = getErrorMessage(error);
    console.log("Error in getForgetPasswordSession: ", error);
    throw new Error(error as string)
  }
}



export const getTeacherVacancyRecords = async (query: TeacherVacancyRecordsQuery) => {
  const q = pickTeacherVacancyRecordsQuery(query);
  try {
    const teacher_token = await get_cookies("teacher_token");
    if (!teacher_token) {
      throw new Error("unauthorized user");
    }
    const params = {
      page: q.page,
      limit: q.limit,
      vacancy_id: q.vacancy_id
    }
    const { data } = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-teacher-vacancy-records`, {
      params,
      headers: {
        Cookie: `teacher_token=${teacher_token}`
      },
      withCredentials: true
    })
    const payload: VacancyRecordDataResponse = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get vacancy records");
    }
    return {
      success: true,
      vacancy_details: payload?.vacancy_details,
      records: payload?.records,
      stats: payload?.stats,
      total: payload?.total,
      has_more: payload?.has_more,
      next_offset: payload?.next_offset
    }
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}


export const getTeacherVacanciesForTeacher = async (id: string, query: TeacherVacancyQuery) => {
  try {
    const q = pickTeacherVacancyQuery(query);
    const teacherToken = await get_cookies("teacher_token");
    if (!teacherToken) {
      throw new Error("unauthorized user");
    }

    const params: Record<string, string | number> = {
      offset: q.page,
      limit: q.limit,
      phone: q.phone || "",
    };

    if (q.payment_status && q.payment_status !== "all") {
      params.payment_status = q.payment_status;
    }

    if (q.vacancy_status && q.vacancy_status !== "all") {
      params.vacancy_status = q.vacancy_status;
    }

    const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-teacher-vacancies-for-teacher/${id}`,
      {
        params,
        headers: {
          Cookie: `teacher_token=${teacherToken}`,

        },
        withCredentials: true,
      })
    const data = res.data;
    const payload: TeacherVacancyResponse = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher vacancies");
    }
    const vacancies: TeacherVacancyData[] = payload?.vacancies || [];
    const total = payload?.total || 0;
    const has_more = payload?.has_more || false;
    const next_offset = payload?.next_offset || 0;
    return {
      success: true,
      vacancies,
      stats: payload?.stats,
      total,
      has_more,
      next_offset
    }

  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}


export const getTeacherVacancies = async (id: string, query: TeacherVacancyQuery) => {
  try {
    const q = pickTeacherVacancyQuery(query);
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const params: Record<string, string | number> = {
      offset: q.page,
      limit: q.limit,
      phone: q.phone || "",
    };

    if (q.payment_status && q.payment_status !== "all") {
      params.payment_status = q.payment_status;
    }

    if (q.vacancy_status && q.vacancy_status !== "all") {
      params.vacancy_status = q.vacancy_status;
    }

    const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-teacher-vacancies/${id}`,
      {
        params,
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      })
    const data = res.data;
    const payload: TeacherVacancyResponse = data?.payload;
    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher vacancies");
    }
    const vacancies: TeacherVacancyData[] = payload?.vacancies || [];
    const total = payload?.total || 0;
    const has_more = payload?.has_more || false;
    const next_offset = payload?.next_offset || 0;
    return {
      success: true,
      vacancies,
      stats: payload?.stats,
      total,
      has_more,
      next_offset
    }

  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}


export const getTeacherLists = async (query: TeacherQuery) => {
  const q = pickTeacherQuery(query);
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const params: Record<string, string | number> = {
      offset: q.page,
      limit: q.limit,
      search: q.search || "",
      phone: q.phone || "",
    };

    // Only send gender if a specific one is selected
    if (q.gender && q.gender !== "all") {
      params.gender = q.gender;
    }

    // Location filter: if lat+lon are set, send radius-based search;
    // otherwise fall back to plain text location search
    if (q.lat != null && q.lon != null) {
      params.lat = q.lat;
      params.lon = q.lon;
      // default radius 10 km — adjust as needed
      params.radius_km = 3;
    }

    if (q.status && q.status !== "all") {
      params.status = q.status;
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-all-teachers`,
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
      throw new Error(data?.error || "failed to get teachers");
    }

    const teachersResponse: TeachersListResponse = payload?.teachersResponse;
    if (!teachersResponse) {
      console.log("this is the teacher payload : ", teachersResponse);
      throw new Error("failed to get teachers");
    }

    return {
      success: true,
      teachersResponse,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export interface TeacherAuthResult {
  teacher: SafeTokenTeacherData;

}


export const teacherAuth = cache(async (): Promise<TeacherAuthResult | null> => {
  const cookieStore = await cookies();
  const teacherToken = cookieStore.get("teacher_token")?.value;
  if (!teacherToken) return null
  try {
    const { data } = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-teacher-from-token`, {
      headers: {
        Cookie: `teacher_token=${teacherToken}`,
      },
      withCredentials: true,
    })
    const payload = data?.payload;
    const teacher: SafeTokenTeacherData | null = payload?.teacher;
    if (!data?.success || !teacher) return null;
    return {
      teacher
    }
  } catch (error) {
    console.log("error in teacher auth : ", getErrorMessage(error))
    return null;
  }
});


export async function requireTeacherAuth(): Promise<TeacherAuthResult> {
  const session = await teacherAuth();
  if (!session) redirect("/teacher-login")
  return session;
}