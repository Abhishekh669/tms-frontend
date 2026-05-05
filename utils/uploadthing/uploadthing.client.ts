// utils/uploadthing/uploadthing.client.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// This generates the hooks with full type safety
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();