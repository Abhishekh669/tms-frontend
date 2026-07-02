"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X, ChevronLeft,  ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing/uploadthing.client";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import { VacancyRecordType } from "@/utils/types/teacher.types";

import { updateTeacherVacancyRecord, updateTeacherVacancyRecordByAdmin } from "@/utils/action/teacher/teacher.put";
import { UpdateVacancyRecord } from "@/utils/types/vacancy.types";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILE_LABEL = "4 MB";

// ─── Schema with all required fields ──────────────────────────────────────────
const updateRecordSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  full_marks: z.number({ 
    required_error: "Full marks is required",
    invalid_type_error: "Full marks must be a number"
  }).min(0.01, "Full marks must be greater than 0"),
  pass_marks: z.number({ 
    required_error: "Pass marks is required",
    invalid_type_error: "Pass marks must be a number"
  }).min(0, "Pass marks must be 0 or greater"),
  student_mark: z.number({ 
    required_error: "Student mark is required",
    invalid_type_error: "Student mark must be a number"
  }).min(0, "Student mark must be 0 or greater"),
}).refine((d) => d.pass_marks <= d.full_marks, {
  message: "Pass marks cannot exceed full marks",
  path: ["pass_marks"],
}).refine((d) => d.student_mark <= d.full_marks, {
  message: "Student mark cannot exceed full marks",
  path: ["student_mark"],
});

type UpdateRecordForm = z.infer<typeof updateRecordSchema>;

interface UpdateVacancyRecordDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  record: VacancyRecordType;
  onSuccess?: () => void;
}

// ─── File Drop Zone with required indicator ───────────────────────────────────
function FileDropZone({
  file,
  preview,
  disabled,
  invalid,
  error,
  onSelect,
  onRemove,
}: {
  file: File | null;
  preview: string;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onSelect(dropped);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
        Result Image <span className="text-destructive">*</span>
      </Label>
      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-200 group block",
          preview ? "h-36" : "h-20",
          disabled && "opacity-50 pointer-events-none",
          invalid
            ? "border-destructive bg-destructive/5 ring-1 ring-destructive"
            : file || preview
            ? "border-emerald-500/40 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-950/20"
            : "border-border/60 bg-muted/30 hover:border-blue-400/60 hover:bg-blue-50/20"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Result" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Replace</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-destructive transition-colors z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full gap-2 px-4">
            <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
            <div>
              <p className="text-xs font-medium">
                <span className="text-blue-600">Upload</span> or drag & drop
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WEBP · Max {MAX_FILE_LABEL}</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          required={!preview && !file}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onSelect(f);
          }}
        />
      </label>
      {invalid && error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UpdateVacancyRecordDialogByAdmin({
  open,
  setOpen,
  record,
  onSuccess,
}: UpdateVacancyRecordDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isImageRequired, setIsImageRequired] = useState(false);

  const uploadedUrlRef = useRef<string | null>(null);

  const { startUpload } = useUploadThing("imageUploader");

  const form = useForm<UpdateRecordForm>({
    resolver: zodResolver(updateRecordSchema),
    defaultValues: {
      subject: record?.subject || "",
      full_marks: record?.full_marks || 0,
      pass_marks: record?.pass_marks || 0,
      student_mark: record?.student_mark || 0,
    },
    mode: "onChange", // Validate on change for better UX
  });

  // Reset when record changes or dialog opens
  useEffect(() => {
    if (open && record) {
      form.reset({
        subject: record.subject || "",
        full_marks: record.full_marks,
        pass_marks: record.pass_marks,
        student_mark: record.student_mark,
      });
      setImagePreview(record.image_link || "");
      setImageFile(null);
      setImageChanged(false);
      setImageRemoved(false);
      setIsImageRequired(!record.image_link); // If no image exists, make it required
      uploadedUrlRef.current = null;
    }
  }, [open, record, form]);

  const sanitizeFile = (file: File): File => {
    const decodedType = decodeURIComponent(file.type);
    if (decodedType === file.type) return file;
    return new File([file], file.name, { type: decodedType, lastModified: file.lastModified });
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) return "Only image files are accepted.";
    if (file.size > MAX_FILE_BYTES) return `File too large — max ${MAX_FILE_LABEL}.`;
    return null;
  };

  const makePreview = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (file: File) => {
    const safe = sanitizeFile(file);
    const err = validateFile(safe);
    if (err) { toast.error(err); return; }

    // If we previously uploaded a new image in this session, delete it
    if (uploadedUrlRef.current) {
      await removeMultipleImages([uploadedUrlRef.current]);
      uploadedUrlRef.current = null;
    }

    setImageFile(safe);
    setImagePreview(await makePreview(safe));
    setImageChanged(true);
    setImageRemoved(false);
    setIsImageRequired(false); // Image is now provided
  };

  const handleFileRemove = async () => {
    // If we had a newly uploaded one, clean it up
    if (uploadedUrlRef.current) {
      await removeMultipleImages([uploadedUrlRef.current]);
      uploadedUrlRef.current = null;
    }
    setImageFile(null);
    setImagePreview("");
    setImageChanged(true);
    setImageRemoved(true);
    setIsImageRequired(true); // Image is now required since we removed it
  };

  const onSubmit = async (values: UpdateRecordForm) => {
    // Validate that we have an image
    const hasImage = imagePreview || imageFile || record.image_link;
    if (!hasImage && !imageChanged) {
      toast.error("Result image is required");
      setIsImageRequired(true);
      return;
    }

    if (imageChanged && !imageFile && !imagePreview && !record.image_link) {
      toast.error("Result image is required");
      setIsImageRequired(true);
      return;
    }

    setSubmitting(true);
    const freshlyUploaded: string[] = [];

    try {
      let imageLink: string | null = record.image_link ?? null;

      if (imageChanged) {
        if (imageRemoved) {
          // Delete original from server if it was a real URL
          if (record.image_link) await removeMultipleImages([record.image_link]);
          imageLink = null;
          throw new Error("Image is required. Please upload a new image.");
        } else if (imageFile) {
          // Upload new file
          const t = toast.loading("Uploading image...");
          const res = await startUpload([imageFile]);
          toast.dismiss(t);
          if (!res?.length) throw new Error("Image upload failed");
          const url = res[0].ufsUrl || res[0].url;
          if (!url) throw new Error("Missing URL after upload");
          freshlyUploaded.push(url);
          uploadedUrlRef.current = url;
          imageLink = url;
          // Delete the old image
          if (record.image_link) await removeMultipleImages([record.image_link]);
        }
      }

      // Final validation - imageLink must exist
      if (!imageLink) {
        throw new Error("Result image is required");
      }

      // Create payload matching the UpdateVacancyRecord type
      const payload: UpdateVacancyRecord = {
        id: record.id,
        subject: values.subject,
        full_marks: values.full_marks,
        pass_marks: values.pass_marks,
        student_mark: values.student_mark,
        image_link: imageLink,
      };

      const result = await updateTeacherVacancyRecordByAdmin(payload);
      if (!result.success) throw new Error(result.error || "Update failed");
      
      toast.success("Record updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Rollback any freshly uploaded images on error
      if (freshlyUploaded.length) await removeMultipleImages(freshlyUploaded);
      toast.error(getErrorMessage(error) || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if form is valid and image is provided
  const isFormValid = () => {
    const formIsValid = form.formState.isValid;
    const hasImage = imagePreview || imageFile || record.image_link;
    const imageValid = !imageChanged || (imageChanged && (imageFile || imagePreview));
    return formIsValid && hasImage && imageValid;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="pb-3 border-b border-border">
          <div className="flex items-center gap-2 sm:hidden">
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 -ml-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-base">Update Record</DialogTitle>
          </div>
          <div className="hidden sm:block">
            <DialogTitle>Update Vacancy Record</DialogTitle>
          </div>
          <DialogDescription className="text-xs mt-1">
            All fields are required. Edit the test record details below.
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Subject - Required */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g., Mathematics, Science, English"
              disabled={submitting}
              className={cn("h-10 rounded-lg text-sm", form.formState.errors.subject && "border-destructive")}
              {...form.register("subject")}
            />
            {form.formState.errors.subject && (
              <p className="text-[11px] text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Marks — 3 cols all required - No submitted_date field */}
          <div className="grid grid-cols-3 gap-3">
            {(["full_marks", "pass_marks", "student_mark"] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
                  {field === "full_marks" ? "Full Marks" : field === "pass_marks" ? "Pass Marks" : "Student Mark"}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  disabled={submitting}
                  placeholder={field === "full_marks" ? "100" : field === "pass_marks" ? "40" : "0"}
                  className={cn("h-10 rounded-lg text-sm", form.formState.errors[field] && "border-destructive")}
                  {...form.register(field, { valueAsNumber: true })}
                />
                {form.formState.errors[field] && (
                  <p className="text-[10px] text-destructive">{form.formState.errors[field]?.message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Image - Required */}
          <FileDropZone
            file={imageFile}
            preview={imagePreview}
            disabled={submitting}
            invalid={isImageRequired && (!imagePreview && !imageFile && !record.image_link)}
            error={isImageRequired && (!imagePreview && !imageFile && !record.image_link) ? "Result image is required" : undefined}
            onSelect={handleFileSelect}
            onRemove={handleFileRemove}
          />

          {/* Image requirement note */}
          {!imagePreview && !record.image_link && (
            <p className="text-[11px] text-destructive flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              An image is required. Please upload a result image.
            </p>
          )}

          {/* Existing image note */}
          {!imageChanged && record.image_link && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              Current image will be kept. You can replace or remove it.
            </p>
          )}

          {/* Form validation summary */}
          {form.formState.isSubmitted && !form.formState.isValid && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-[11px] text-destructive font-medium">
                Please fix the errors above before submitting.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="flex-1 sm:flex-none h-10 text-sm rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="flex-1 gap-2 h-10 text-sm rounded-xl"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}