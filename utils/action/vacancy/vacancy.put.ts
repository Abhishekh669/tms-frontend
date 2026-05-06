'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { AddPaymentInVacancy, AssignVacancy, UnassignVacancy, UpdatePaymentInVacancy, UpdateVacancy } from "@/utils/types/vacancy.types";
import axios from "axios";



export const addPaymentDetails = async (avp : AddPaymentInVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/add-payment`,
      avp,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error || "failed to add payment");
    }

    return {
      success: true,
      message: "succesfully added payment",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};



export const updateVacancyPaymentDetails = async (uvp : UpdatePaymentInVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/update-payment`,
      uvp,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    if (!data?.success) {
      throw new Error(data?.error || "failed to update payment");
    }

    return {
      success: true,
      message: "succesfully updated payment"
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};



export const unAssignVacancyToTeacher = async (updatedData: UnassignVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/unassign-vacancy`,
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
      throw new Error(data?.error || "failed to unassign vacancy");
    }

    return {
      success: true,
      message: "succesfully unassigned vacancy",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};


export const assignVacancyToTeacher = async (updatedData: AssignVacancy) => {
  try {
    const user_token = await get_cookies("user_token");
    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/vacancy-service/assign-vacancy`,
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
      throw new Error(data?.error || "failed to assign vacancy");
    }

    return {
      success: true,
      message: "succesfully assigned vacancy",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};




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
