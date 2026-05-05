'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { UpdateVacancy } from "@/utils/types/vacancy.types";
import axios from "axios";

export const updateVacancyData = async (updatedData: UpdateVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/update-vacancy`,
      updatedData,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error || "failed to update vacancy");
    }

    return {
      success: true,
      message: "succesfully update vacancy",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};
