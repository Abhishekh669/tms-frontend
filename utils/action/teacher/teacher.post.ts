'use server'

import { TeacherPayload } from "@/components/application/teacher-form/TeacherFormPage"
import { getErrorMessage } from "@/utils/helper/get.error.message";
import axios from "axios";

export const createTeacherFrom = async (teacherData: TeacherPayload) => {
    try {
        const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/create-teacher-form`, teacherData)
        const data = response.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to create teacher");
        }

        return {
            success: true,
            message: `${data?.message || "created successfully"}. You will be notified soon.`
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        console.error("login error : ", errMsg)
        return {
            success: false,
            error: errMsg,
        }
    }

}