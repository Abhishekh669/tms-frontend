'use server'

import { TeacherPayload } from "@/components/application/teacher-form/TeacherFormPage"
import { getErrorMessage } from "@/utils/helper/get.error.message";
import axios from "axios";
import { cookies } from "next/headers";


export const createForgetPassword = async (email : string) =>{
    try {
        const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/create-forget-password-session`, {
            email
        })
        const data = response.data;

        const payload = data?.payload;
        const token = payload?.token as string;

        if (!data?.success || !token) {
            throw new Error(data?.error || "Failed to create forget password session");
        }

        return {
            success: true,
            token,
            message: data?.message || "Forget password session created successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            return {
                success: false,
                error: String(error)
            }
    }
}




export const createChangePasswordSession = async (email : string) =>{
    try {
        const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/create-change-password-session`, {
            email
        })
        const data = response.data;

        const payload = data?.payload;
        const token = payload?.token as string
        if (!data?.success || !token) {
            throw new Error(data?.error || "Failed to create forget password session");
        }

        return {
            success: true,
            token,
            message: data?.message || "Forget password session created successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            return {
                success: false,
                error: String(error)
            }
    }
}




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


export const loginTeacher  = async (email : string, password : string) =>{
    try {
         const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/login-teacher`, {
            email, password
        })
        const data = response.data;
        const payload = data.payload;
        const token = payload.token;

        if (!token || !data?.success) {
            throw new Error(data?.error || "Login failed");
        }


        const cookieStore = await cookies();
        cookieStore.set("teacher_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/"
        })

        return {
            success: true,
            message: data?.message || "login successfull"
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        console.error("login error : ",errMsg )
        return {
            success : false, 
            error :  errMsg,
        }
    }
}