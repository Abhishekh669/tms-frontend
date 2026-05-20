'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { CreateVacancy, CreateVacancyRecord } from "@/utils/types/vacancy.types";
import axios from "axios";

export const createVacancyRecords = async (vacancyRecords: CreateVacancyRecord) => {
  try {
    const teacherToken = await get_cookies("teacher_token");
    if (!teacherToken) {
      throw new Error("unauthorized user");
    }
    const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/create-vacancy-records`, vacancyRecords,
      {
        headers: {
          Cookie: `teacher_token=${teacherToken}`,

        },
        withCredentials: true,
      })
    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error || "failed to create vacancy records");
    }

    return {
      success: true,
      message: data?.message || "created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error)
    }

  }
}



export const createVacancy = async (vacancyData: CreateVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const response = await axios.post(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/create-vacancy`,
      vacancyData,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = response.data;
    if (!data?.success) {
      throw new Error(data?.error || "failed to create vacancy");
    }

    return {
      success: true,
      message: data?.message || "created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};
