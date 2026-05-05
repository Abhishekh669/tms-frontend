'use server'

import { getErrorMessage } from "@/utils/helper/get.error.message"
import { pickTeacherQuery, TeacherQuery, TeachersListResponse } from "@/utils/types/teacher.types"
import { get_cookies } from "@/utils/helper/get-cookies";
import axios from "axios";

export const getTeacherLists = async (query: TeacherQuery) => {
    const q = pickTeacherQuery(query)
    try {
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.get(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/get-all-teachers`,
            {
                params: {
                    offset: q.page,
                    limit: q.limit,
                    search: q.search || "",
                    phone: q.phone || "",
                },
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true,
            }
        );

        const data = res.data;
        const payload = data?.payload;
        if(!data?.success || !payload){
            throw new Error(data?.error || "failed to get teachers")
        }

        const teachersResponse: TeachersListResponse = payload?.teachersResponse;
        if(!teachersResponse){
            console.log("thisis hte teacher payload : ", teachersResponse)
            throw new Error("failed to get teachers")
        }

        return {
            success : true,
            teachersResponse
        }

    } catch (error) {
        throw new Error(getErrorMessage(error))

    }
}