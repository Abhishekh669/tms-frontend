"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileImage, AlertCircle, Upload, X, ChevronLeft, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing/uploadthing.client";
import { createVacancyRecords, createVacancyRecordsByAdmin } from "@/utils/action/vacancy/vacancy.post";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import { CreateVacancyRecord } from "@/utils/types/vacancy.types";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_FILE_LABEL = "4 MB";
const STORAGE_KEY = "vacancy-record-draft";
const IMAGE_UPLOAD_KEY = "vacancy-record-image";

// ─── Schema ──────────────────────────────────────────────────────────────────
const vacancyRecordSchema = z.object({
  vac_id: z.string().min(1, "Vacancy ID is required"),
  subject: z.string().min(1, "Subject is required"),
  submitted_date: z.date({ required_error: "Submitted date is required" }),
  full_marks: z.number({ invalid_type_error: "Full marks must be a number" })
    .min(0, "Full marks must be greater than or equal to 0"),
  pass_marks: z.number({ invalid_type_error: "Pass marks must be a number" })
    .min(0, "Pass marks must be greater than or equal to 0"),
  student_mark: z.number({ invalid_type_error: "Student mark must be a number" })
    .min(0, "Student mark must be greater than or equal to 0"),
  teacher_id: z.string().min(1, "Teacher ID is required"),
}).refine((data) => data.pass_marks <= data.full_marks, {
  message: "Pass marks cannot exceed full marks",
  path: ["pass_marks"],
}).refine((data) => data.student_mark <= data.full_marks, {
  message: "Student mark cannot exceed full marks",
  path: ["student_mark"],
});

type VacancyRecordFormValues = z.infer<typeof vacancyRecordSchema>;

interface AddVacancyRecordDialogBoxProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  teacherId: string;
  vacancyId: string;
  onSuccess?: () => void;
}

// ─── File Drop Zone Component ────────────────────────────────────────────────
interface FileDropZoneProps {
  label: string;
  hint: string;
  file: File | null;
  preview: string;
  isUploaded: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
}

function FileDropZone({
  label,
  hint,
  file,
  preview,
  isUploaded,
  onSelect,
  onRemove,
  disabled,
  invalid,
  error,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onSelect(dropped);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
        {label}
      </Label>

      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-200 group block",
          preview ? "h-32 sm:h-36" : "h-20 sm:h-24",
          disabled && "opacity-50 pointer-events-none",
          invalid
            ? "border-destructive bg-destructive/5"
            : file || isUploaded
            ? "border-green-500/40 bg-green-50/40 dark:border-green-500/30 dark:bg-green-950/20"
            : "border-border/60 bg-muted/30 hover:border-blue-400/60 hover:bg-blue-50/20"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-xs font-medium">Replace</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-destructive transition-colors z-10"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full gap-2 sm:gap-3 px-3 sm:px-4">
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              invalid ? "bg-destructive/10" : "bg-background"
            )}>
              <Upload className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", invalid ? "text-destructive" : "text-muted-foreground group-hover:text-blue-500 transition-colors")} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium">
                <span className="text-blue-600">Upload</span> or drag & drop
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onSelect(f);
          }}
        />
      </label>

      {invalid && error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AddVacancyRecordsByAdmin({
  open,
  setOpen,
  teacherId,
  vacancyId,
  onSuccess,
}: AddVacancyRecordDialogBoxProps) {
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const uploadedUrlRef = useRef<string | null>(null);
  const { startUpload } = useUploadThing("imageUploader", {
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const form = useForm<VacancyRecordFormValues>({
    resolver: zodResolver(vacancyRecordSchema),
    defaultValues: {
      vac_id: vacancyId || "",
      subject: "",
      submitted_date: new Date(),
      full_marks: 100,
      pass_marks: 40,
      student_mark: 0,
      teacher_id: teacherId || "",
    },
  });

  // ─── Load persisted data from sessionStorage ─────────────────────────────
  useEffect(() => {
    if (open) {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const { subject, submitted_date, full_marks, pass_marks, student_mark } = parsed;
          form.reset({
            vac_id: vacancyId,
            subject: subject || "",
            submitted_date: submitted_date ? new Date(submitted_date) : new Date(),
            full_marks: full_marks || 100,
            pass_marks: pass_marks || 40,
            student_mark: student_mark || 0,
            teacher_id: teacherId || "",
          });
        } catch (_) {}
      }

      const savedImage = sessionStorage.getItem(IMAGE_UPLOAD_KEY);
      if (savedImage) {
        try {
          const { preview, isUploaded, url } = JSON.parse(savedImage);
          if (preview) setImagePreview(preview);
          setIsImageUploaded(isUploaded || false);
          setUploadedImageUrl(url || null);
          uploadedUrlRef.current = url || null;
        } catch (_) {}
      }
    }
  }, [open, form, vacancyId, teacherId]);

  // ─── Persist form data on change (only non-vacancy/teacher fields) ──────
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch((values) => {
      const { subject, submitted_date, full_marks, pass_marks, student_mark } = values;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        subject,
        submitted_date: submitted_date?.toISOString(),
        full_marks,
        pass_marks,
        student_mark,
      }));
    });
    return () => subscription.unsubscribe();
  }, [form, open]);

  // ─── Persist image data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    sessionStorage.setItem(
      IMAGE_UPLOAD_KEY,
      JSON.stringify({
        preview: imagePreview,
        isUploaded: isImageUploaded,
        url: uploadedImageUrl,
      })
    );
  }, [imagePreview, isImageUploaded, uploadedImageUrl, open]);

  // ─── Sanitize file MIME type to prevent double URL-encoding ────────────
  // UploadThing URL-encodes the file type when building the presigned URL.
  // If file.type is already URL-encoded (e.g. "image%2Fjpeg" instead of
  // "image/jpeg"), UploadThing double-encodes it to "image%252Fjpeg", which
  // causes a FetchError. We decode it here so the File object always carries
  // a clean MIME type before it reaches UploadThing.
  const sanitizeFile = (file: File): File => {
    const decodedType = decodeURIComponent(file.type);
    if (decodedType === file.type) return file; // already clean, no-op
    return new File([file], file.name, {
      type: decodedType,
      lastModified: file.lastModified,
    });
  };

  // ─── Validate file ──────────────────────────────────────────────────────
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files (JPG, PNG, WEBP) are accepted.";
    }
    if (file.size > MAX_FILE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return `File is ${sizeMB} MB — please use an image under ${MAX_FILE_LABEL}.`;
    }
    return null;
  };

  // ─── Make preview ───────────────────────────────────────────────────────
  const makePreview = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  // ─── Handle file select ─────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    // Sanitize MIME type first to prevent %252F double-encoding bug
    const safeFile = sanitizeFile(file);

    const validationError = validateFile(safeFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // If there was a previously uploaded image, delete it from server
    if (uploadedUrlRef.current && isImageUploaded) {
      await removeMultipleImages([uploadedUrlRef.current]);
      uploadedUrlRef.current = null;
      setIsImageUploaded(false);
      setUploadedImageUrl(null);
    }

    setImageFile(safeFile);
    setImagePreview(await makePreview(safeFile));
    setIsImageUploaded(false);
    setUploadedImageUrl(null);
  };

  // ─── Handle file remove ─────────────────────────────────────────────────
  const handleFileRemove = async () => {
    // Delete from server if it was uploaded
    if (uploadedUrlRef.current && isImageUploaded) {
      await removeMultipleImages([uploadedUrlRef.current]);
    }
    setImageFile(null);
    setImagePreview("");
    setIsImageUploaded(false);
    setUploadedImageUrl(null);
    uploadedUrlRef.current = null;
  };

  // ─── Cleanup on dialog close ───────────────────────────────────────────
  const handleClose = () => {
    setOpen(false);
  };

  // ─── Submit form ────────────────────────────────────────────────────────
  const onSubmit = async (values: VacancyRecordFormValues) => {
    setSubmitting(true);
    let freshlyUploadedUrls: string[] = [];

    try {
      let imageLink = uploadedUrlRef.current;

      // If we have a new file that hasn't been uploaded yet
      if (imageFile && !isImageUploaded) {
        const uploadToast = toast.loading("Uploading image...");
        const uploadResults = await startUpload([imageFile]);
        toast.dismiss(uploadToast);

        if (!uploadResults || uploadResults.length === 0) {
          throw new Error("Image upload failed");
        }

        const uploadedUrl = uploadResults[0].ufsUrl || uploadResults[0].url;
        if (!uploadedUrl) throw new Error("Missing URL for uploaded image");

        imageLink = uploadedUrl;
        freshlyUploadedUrls.push(uploadedUrl);

        // Update state to mark as uploaded
        setIsImageUploaded(true);
        setUploadedImageUrl(uploadedUrl);
        uploadedUrlRef.current = uploadedUrl;
      } else if (!imageLink && !isImageUploaded) {
        throw new Error("Image is required");
      }

      const payload: CreateVacancyRecord = {
        vac_id: vacancyId,
        subject: values.subject,
        submitted_date: values.submitted_date.toISOString(),
        full_marks: values.full_marks,
        pass_marks: values.pass_marks,
        student_mark: values.student_mark,
        image_link: imageLink!,
        teacher_id: teacherId || "",
      };

      const result = await createVacancyRecordsByAdmin(payload);

      if (!result.success) {
        throw new Error(result.error || "Failed to create vacancy record");
      }

      // Clear persisted data
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(IMAGE_UPLOAD_KEY);

      // Reset form state
      form.reset({
        vac_id: vacancyId,
        subject: "",
        submitted_date: new Date(),
        full_marks: 100,
        pass_marks: 40,
        student_mark: 0,
        teacher_id: teacherId || "",
      });
      setImageFile(null);
      setImagePreview("");
      setIsImageUploaded(false);
      setUploadedImageUrl(null);
      uploadedUrlRef.current = null;

      toast.success(result.message || "Vacancy record created successfully!");
      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      // If there was an error and we uploaded a new image, delete it
      if (freshlyUploadedUrls.length) {
        await removeMultipleImages(freshlyUploadedUrls);
        // Reset upload state for the new image
        if (imageFile && !isImageUploaded) {
          setIsImageUploaded(false);
          setUploadedImageUrl(null);
          uploadedUrlRef.current = null;
        }
      }
      toast.error(getErrorMessage(error) || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset form manually ────────────────────────────────────────────────
  const handleReset = async () => {
    // Delete uploaded image from server if exists
    if (uploadedUrlRef.current && isImageUploaded) {
      await removeMultipleImages([uploadedUrlRef.current]);
    }
    form.reset({
      vac_id: vacancyId,
      subject: "",
      submitted_date: new Date(),
      full_marks: 100,
      pass_marks: 40,
      student_mark: 0,
      teacher_id: teacherId || "",
    });
    setImageFile(null);
    setImagePreview("");
    setIsImageUploaded(false);
    setUploadedImageUrl(null);
    uploadedUrlRef.current = null;
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(IMAGE_UPLOAD_KEY);
    toast.info("Form reset");
  };

  const isImageRequired = !imagePreview && !isImageUploaded;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-xl">
        {/* Mobile-friendly header with back button for small screens */}
        <div className="sticky top-0 bg-background z-10 pb-3 sm:pb-4">
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8 -ml-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-base">Create Vacancy Record</DialogTitle>
          </div>
          <div className="hidden sm:block">
            <DialogTitle>Create Vacancy Record</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm mt-1">
            Fill in the details to create a new vacancy record 
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 py-2">
          {/* Hidden fields */}
          <input type="hidden" {...form.register("vac_id")} value={vacancyId} />
          <input type="hidden" {...form.register("teacher_id")} value={teacherId || ""} />

          

          {/* Subject Field */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-[11px] font-semibold uppercase tracking-widest">
              Subject *
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="e.g., Mathematics, Science, English"
              disabled={submitting}
              className={cn(
                "h-10 sm:h-11 rounded-lg text-sm",
                form.formState.errors.subject && "border-destructive"
              )}
              {...form.register("subject")}
            />
            {form.formState.errors.subject && (
              <div className="text-[11px] text-destructive">{form.formState.errors.subject.message}</div>
            )}
          </div>

          {/* Submitted Date with Calendar */}
          <div className="space-y-1.5">
            <Label htmlFor="submitted_date" className="text-[11px] font-semibold uppercase tracking-widest">
              Submitted Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 sm:h-11 rounded-lg",
                    !form.watch("submitted_date") && "text-muted-foreground",
                    form.formState.errors.submitted_date && "border-destructive"
                  )}
                  disabled={submitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("submitted_date") ? (
                    format(form.watch("submitted_date"), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("submitted_date")}
                  onSelect={(date) => form.setValue("submitted_date", date || new Date())}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.submitted_date && (
              <div className="text-[11px] text-destructive">{form.formState.errors.submitted_date.message}</div>
            )}
          </div>

          {/* Marks Section */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {/* Full Marks */}
            <div className="space-y-1.5">
              <Label htmlFor="full_marks" className="text-[11px] font-semibold uppercase tracking-widest">
                Full Marks *
              </Label>
              <Input
                id="full_marks"
                type="number"
                step="any"
                placeholder="100"
                disabled={submitting}
                className={cn(
                  "h-10 sm:h-11 rounded-lg text-sm",
                  form.formState.errors.full_marks && "border-destructive"
                )}
                {...form.register("full_marks", { valueAsNumber: true })}
              />
              {form.formState.errors.full_marks && (
                <div className="text-[11px] text-destructive">{form.formState.errors.full_marks.message}</div>
              )}
            </div>

            {/* Pass Marks */}
            <div className="space-y-1.5">
              <Label htmlFor="pass_marks" className="text-[11px] font-semibold uppercase tracking-widest">
                Pass Marks *
              </Label>
              <Input
                id="pass_marks"
                type="number"
                step="any"
                placeholder="40"
                disabled={submitting}
                className={cn(
                  "h-10 sm:h-11 rounded-lg text-sm",
                  form.formState.errors.pass_marks && "border-destructive"
                )}
                {...form.register("pass_marks", { valueAsNumber: true })}
              />
              {form.formState.errors.pass_marks && (
                <div className="text-[11px] text-destructive">{form.formState.errors.pass_marks.message}</div>
              )}
            </div>

            {/* Student Mark */}
            <div className="space-y-1.5">
              <Label htmlFor="student_mark" className="text-[11px] font-semibold uppercase tracking-widest">
                Student Mark *
              </Label>
              <Input
                id="student_mark"
                type="number"
                step="any"
                placeholder="0"
                disabled={submitting}
                className={cn(
                  "h-10 sm:h-11 rounded-lg text-sm",
                  form.formState.errors.student_mark && "border-destructive"
                )}
                {...form.register("student_mark", { valueAsNumber: true })}
              />
              {form.formState.errors.student_mark && (
                <div className="text-[11px] text-destructive">{form.formState.errors.student_mark.message}</div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <FileDropZone
            label="Result Image *"
            hint={`JPG, PNG, WEBP · Max ${MAX_FILE_LABEL}`}
            file={imageFile}
            preview={imagePreview}
            isUploaded={isImageUploaded}
            disabled={submitting}
            invalid={isImageRequired && form.formState.isSubmitted}
            error={isImageRequired && form.formState.isSubmitted ? "Result image is required" : undefined}
            onSelect={handleFileSelect}
            onRemove={handleFileRemove}
          />

          {/* Info Box */}
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-3 sm:p-4 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
              <div className="text-[10px] sm:text-[11px] leading-relaxed text-blue-700">
                <strong>Note:</strong> Your uploaded image will be saved in session storage.
                If you refresh the page, the image preview and upload status will be preserved.
                The image will only be uploaded to the server when you submit the form.
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:pt-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting}
                className="flex-1 sm:flex-none gap-2 text-sm h-10 sm:h-11"
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex-1 sm:flex-none gap-2 text-sm h-10 sm:h-11"
              >
                Cancel
              </Button>
            </div>
            <Button
              type="submit"
              disabled={submitting || (!imagePreview && !isImageUploaded)}
              className="w-full sm:w-auto gap-2 text-sm h-10 sm:h-11"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}