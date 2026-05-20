'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get.error.message"
import { UpdateStatusTeacher, UpdateTeacher } from "@/utils/types/teacher.types"
import { UpdateVacancyRecord } from "@/utils/types/vacancy.types"
import axios from "axios"


export const updateTeacherVacancyRecord = async (recordData : UpdateVacancyRecord) =>{
    try {
          const user_token = await get_cookies("teacher_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.put(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/update-teacher-vacancy-record`, recordData,
            {
                headers: {
                    Cookie : `teacher_token=${user_token}`
                },
                withCredentials: true,
            }
        );
        const data =res.data;
        if(!data?.success){
            throw  new Error(data?.error || "failed to update the teacher")
        }
        return {
            success : true,
            message : "succesfully update data"
        }
    } catch (error) {
        return {
            error : getErrorMessage(error),
            success : false,
        }
        
    }
}

export const updateTeacherData = async(udpatedData : UpdateTeacher) =>{
    try {
         const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.put(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/update-teacher-data`, udpatedData,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true,
            }
        );
        const data =res.data;
        if(!data?.success){
            throw  new Error(data?.error || "failed to update the teacher")
        }
        return {
            success : true,
            message : "succesfully update data"
        }
    } catch (error) {
    return {
        error : getErrorMessage(error),
        success : false,
    }
        
    }

}




export const updateTeacherStatus = async(udpatedData : UpdateStatusTeacher) =>{
    try {
         const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error('unauthorized user')
        }
        const res = await axios.put(
            `${process.env.NEXT_BACKEND_URL}/api/v1/teacher-service/update-teacher-status`, udpatedData,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true,
            }
        );
        const data =res.data;
        if(!data?.success){
            throw  new Error(data?.error || "failed to update  status")
        }
        return {
            success : true,
            message : "succesfully update status"
        }
    } catch (error) {
    return {
        error : getErrorMessage(error),
        success : false,
    }
        
    }

}