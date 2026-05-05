"use server"
import { UTApi } from "uploadthing/server";
import { auth } from "../auth/auth.get";


const utapi = new UTApi();


export const removeMultipleImages = async (imageUrls: string[]) => {
    try {
        const data = await auth();
        if(!data){
            throw new Error("unauthorized")
        }

        const user = data?.user;
        if (!user) {
            throw new Error("unauthorized")
        }
        
        const keys = imageUrls.map(url => {
            const parts = url.split('/');
            return parts[parts.length - 1];
        });

        const deleteResult = await utapi.deleteFiles(keys);
        if (!deleteResult) {
            throw new Error("Failed to delete images")
        }

        console.log("imags deleted succssuflly")
        return {
            message: "Images deleted successfully",
            success: true
        }
    } catch (error) {
        console.log("error in deleting image : ", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Something went wrong",
        }

    }
}