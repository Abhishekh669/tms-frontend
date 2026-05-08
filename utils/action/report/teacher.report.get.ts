
// actions/report.actions.ts

"use server";

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { GrowthData, GrowthTreand, OverAllTeacherReport, TeacherLocation, TeacherOverview, TeacherPerformanceList, TeacherReportQuery } from "@/utils/types/report.types";
import axios from "axios";


export const getTeacherOverview = async () => {
  try {
    const user_token = await get_cookies("user_token");

    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/report-service/get-teacher-reports/overview`,
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
      throw new Error(data?.error || "failed to get teacher overview");
    }

    return {
      success: true,
      overview: payload?.data as TeacherOverview,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getTeacherGrowth = async (
  q: GrowthTreand
) => {
  try {
    const user_token = await get_cookies("user_token");

    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/report-service/get-teacher-reports/growth`,
      {
        params: {
          mode: q.mode,
          from: q.from,
          to: q.to,
        },
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    const payload = data?.payload;

    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher growth");
    }

    return {
      success: true,
      growth: payload?.data as GrowthData,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getTeacherLocations = async () => {
  try {
    const user_token = await get_cookies("user_token");

    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/report-service/get-teacher-reports/locations`,
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
      throw new Error(data?.error || "failed to get teacher locations");
    }

    return {
      success: true,
      locations: payload?.data as TeacherLocation[],
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getTeacherPerformance = async (
  q: TeacherReportQuery
) => {
  try {
    const user_token = await get_cookies("user_token");

    if (!user_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/report-service/get-teacher-reports/performance`,
      {
        params: {
          page: q.page,
          limit: q.limit,
          search: q.search,
          phone: q.phone,
        },
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    const payload = data?.payload;

    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher performance");
    }

    return {
      success: true,
      performance: payload?.data as TeacherPerformanceList,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
