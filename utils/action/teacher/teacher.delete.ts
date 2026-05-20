'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get.error.message"
import axios from "axios"



export const deleteTeacherVacancyRecordsById = async (id: string) => {
    try {
        const user_token = await get_cookies("teacher_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.delete(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/delete-teacher-vacancy-record-by-id/${id}`,
            {
                headers: {
                     Cookie : `teacher_token=${user_token}`
                },
                withCredentials: true,
            }
        );
        const data =res.data;
        if(!data?.success){
            throw  new Error(data?.error || "failed to delete the vacancy record")
        }
        return {
            success : true,
            message : "succesfully deleted vacancy records"
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error)
        }

    }
}


export const deleteTeacherById = async (id: string) => {
    try {
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.delete(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/delete-teacher-by-id/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true,
            }
        );
        const data =res.data;
        if(!data?.success){
            throw  new Error(data?.error || "failed to delete the teacher")
        }
        return {
            success : true,
            message : "succesfully deleted data"
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error)
        }

    }
}