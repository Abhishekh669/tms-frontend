"use server";


import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { ActiveVacancyCard, ActiveVacancyDropdownItem, GrowthData, GrowthTreand, OverAllDasboardData, TeacherDashboardStats, TeacherLocation, TeacherOverview, TeacherPerformanceList, TeacherRank, TeacherReportQuery, VacancyWeeklyProgress } from "@/utils/types/report.types";
import axios from "axios";

export const getVacancyWeeklyPerformance = async(vacancy_id : string) =>{
  try {
    if(!vacancy_id)throw new Error("invalid vacancy")
    const teacher_token = await get_cookies("teacher_token")
   if (!teacher_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-report-service/weekly-progress/${vacancy_id}`,
      {
        headers: {
           Cookie : `teacher_token=${teacher_token}`
        },
        withCredentials: true,
      }
    );

     const data = res.data;
    const payload   = data?.payload as VacancyWeeklyProgress;


    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher overview");
    }
    return {
      success : true,
      weekly_progress : payload
    }



  } catch (error) {
    throw new Error(getErrorMessage(error))
    
  }
}



export const getTeacherVacancyReportData = async () => {
  try {
    const teacher_token = await get_cookies("teacher_token");

    if (!teacher_token) {
      throw new Error("unauthorized user");
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-report-service/overall-data`,
      {
        headers: {
           Cookie : `teacher_token=${teacher_token}`
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    const payload   = data?.payload as OverAllDasboardData;

    if (!data?.success || !payload) {
      throw new Error(data?.error || "failed to get teacher overview");
    }

    return {
      success: true,
      dashboard_stats : payload?.dashboard_stats as TeacherDashboardStats,
      active_vacancy_card : payload?.active_vacancy_card as ActiveVacancyCard[],
      active_vacancy_dropdown_item : payload?.active_vacancy_dropdown_item as ActiveVacancyDropdownItem[],
      teacehr_ranking_data : payload?. teacher_ranking_data as TeacherRank
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};





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
