import { auth } from "@/utils/action/auth/auth.get";
import { createUploadthing, type FileRouter } from "uploadthing/next";

export const UploadPermissions = ["admin", "manager"]

const f = createUploadthing();
export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount : 5,
    },
  })
    
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("file url", file.ufsUrl);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;