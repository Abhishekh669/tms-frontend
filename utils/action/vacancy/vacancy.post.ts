'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { CreateVacancy } from "@/utils/types/vacancy.types";
import axios from "axios";

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
