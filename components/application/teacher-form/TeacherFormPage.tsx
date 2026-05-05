"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  FileImage,
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  X,
  Upload,
  Map,
  Check,
  VenusAndMars,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing/uploadthing.client";
import dynamic from "next/dynamic";
import { createTeacherFrom } from "@/utils/action/teacher/teacher.post";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { GenderType } from "@/utils/types/teacher.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

// ─── Schema ──────────────────────────────────────────────────────────────────
const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number — we will contact you through it")
    .regex(
      /^[0-9+\-\s()]+$/,
      "Please enter a valid phone number — we will contact you through it"
    ),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select your gender",
  }),
  location: z
    .string()
    .min(3, "Please enter a valid location so we can reach you when a tuition is near you"),
  location_hint: z
    .string()
    .min(3, "Please add a location hint so we can reach you when a tuition is near you"),
  lat: z.number({ invalid_type_error: "Latitude is required" }).optional(),
  long: z.number({ invalid_type_error: "Longitude is required" }).optional(),
  cv_file: z
    .instanceof(File, { message: "CV image is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "CV image must be under 5MB"),
  transcript_file: z
    .instanceof(File, { message: "Class 12 transcript is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "Transcript must be under 5MB"),
  addition_file: z
    .union([
      z
        .instanceof(File)
        .refine((f) => f.size <= 5 * 1024 * 1024, "Additional document must be under 5MB"),
      z.undefined(),
    ])
    .optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export interface TeacherPayload {
  name: string;
  email: string;
  phone: string;
  gender: GenderType;
  cv_link: string;
  transcript_link: string;
  addition_link?: string;
  location: string;
  location_hint: string;
  lat?: number;
  long?: number;
}

// ─── File Drop Zone (unchanged but included for completeness) ────────────────
interface FileDropZoneProps {
  label: string;
  hint: string;
  file: File | null;
  preview: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  invalid?: boolean;
  optional?: boolean;
  errors?: { message?: string }[];
}

function FileDropZone({
  label,
  hint,
  file,
  preview,
  onSelect,
  onRemove,
  disabled,
  invalid,
  optional,
  errors,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith("image/")) onSelect(dropped);
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel className="text-xs font-medium text-foreground dark:text-white">
        {label}
        {optional && (
          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground dark:text-gray-400">
            (optional)
          </span>
        )}
      </FieldLabel>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200 group",
          preview ? "h-40" : "h-28",
          disabled && "opacity-50 pointer-events-none",
          invalid
            ? "border-destructive bg-destructive/5 dark:border-destructive dark:bg-destructive/10"
            : file
            ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/20"
            : "border-border bg-background hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium tracking-wide">Replace file</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-destructive rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2.5 px-4 text-center">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                invalid
                  ? "bg-destructive/10 dark:bg-destructive/20"
                  : "bg-muted group-hover:bg-blue-100 dark:bg-gray-800 dark:group-hover:bg-blue-900/30"
              )}
            >
              <FileImage
                className={cn(
                  "w-5 h-5 transition-colors",
                  invalid
                    ? "text-destructive"
                    : "text-muted-foreground group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400"
                )}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground dark:text-gray-200">
                <span className="text-blue-600 dark:text-blue-400">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-[10px] text-muted-foreground dark:text-gray-500 mt-0.5">{hint}</p>
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
            if (f) onSelect(f);
          }}
        />
      </div>
      {invalid && errors && errors.length > 0 && <FieldError errors={errors} />}
    </Field>
  );
}

// ─── Section Card (unchanged) ────────────────────────────────────────────────
function SectionCard({
  step,
  icon,
  title,
  description,
  accentClass,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description?: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border shadow-sm bg-card dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="pb-4 pt-5 px-5 sm:px-6 border-b border-border dark:border-gray-800 bg-muted/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", accentClass)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold text-foreground dark:text-white">
                {title}
              </CardTitle>
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                Step {step}
              </span>
            </div>
            {description && (
              <CardDescription className="text-[11px] mt-0.5 text-muted-foreground dark:text-gray-400">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 sm:px-6 pb-6 pt-5">{children}</CardContent>
    </Card>
  );
}

// ─── Main Page with Persistence & Cleanup ────────────────────────────────────
const STORAGE_KEY = "teacher-form-draft";
const PREVIEWS_KEY = "teacher-form-previews";

export default function TeacherFormPage() {
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationPicking, setLocationPicking] = useState(false);
  const [locationOptions, setLocationOptions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const locationDebounceRef = useRef<number | null>(null);

  // File state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState("");
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [additionFile, setAdditionFile] = useState<File | null>(null);
  const [additionPreview, setAdditionPreview] = useState("");

  // Track uploaded URLs to clean up on error
  const [uploadedUrls, setUploadedUrls] = useState<{
    cv?: string;
    transcript?: string;
    addition?: string;
  }>({});

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gender: undefined,
      location: "",
      location_hint: "",
      lat: undefined,
      long: undefined,
    },
  });

  // ─── Load persisted data on mount ─────────────────────────────────────────
  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        form.reset(parsed);
      } catch (e) {}
    }
    const savedPreviews = sessionStorage.getItem(PREVIEWS_KEY);
    if (savedPreviews) {
      try {
        const { cv, transcript, addition } = JSON.parse(savedPreviews);
        setCvPreview(cv || "");
        setTranscriptPreview(transcript || "");
        setAdditionPreview(addition || "");
      } catch (e) {}
    }
  }, [form]);

  // ─── Persist form values and previews on change ──────────────────────────
  useEffect(() => {
    const subscription = form.watch((values) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    sessionStorage.setItem(
      PREVIEWS_KEY,
      JSON.stringify({
        cv: cvPreview,
        transcript: transcriptPreview,
        addition: additionPreview,
      })
    );
  }, [cvPreview, transcriptPreview, additionPreview]);

  // ─── Before-unload warning ───────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  // ─── Cleanup uploaded files from server ──────────────────────────────────
  const cleanupUploadedImages = async () => {
    const urlsToDelete = Object.values(uploadedUrls).filter(Boolean) as string[];
    if (urlsToDelete.length) {
      await removeMultipleImages(urlsToDelete);
      setUploadedUrls({});
    }
  };

  // ─── Clear all data (reset form and storage) ────────────────────────────
  const handleClearAll = async () => {
    // Delete any uploaded files from server first
    await cleanupUploadedImages();
    // Reset local file states
    setCvFile(null);
    setCvPreview("");
    setTranscriptFile(null);
    setTranscriptPreview("");
    setAdditionFile(null);
    setAdditionPreview("");
    // Reset form
    form.reset({
      name: "",
      email: "",
      phone: "",
      gender: undefined,
      location: "",
      location_hint: "",
      lat: undefined,
      long: undefined,
    });
    // Clear storage
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PREVIEWS_KEY);
    toast.success("All data cleared");
  };

  // ─── File handlers with orphan cleanup ───────────────────────────────────
  const makePreview = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target?.result as string);
      r.readAsDataURL(file);
    });

  const handleFileSelect = async (
    file: File,
    field: "cv_file" | "transcript_file" | "addition_file",
    setFile: (f: File | null) => void,
    setPreview: (p: string) => void,
    urlKey: "cv" | "transcript" | "addition"
  ) => {
    // If there was a previously uploaded URL for this field, delete it (orphan prevention)
    if (uploadedUrls[urlKey]) {
      await removeMultipleImages([uploadedUrls[urlKey]!]);
      setUploadedUrls((prev) => ({ ...prev, [urlKey]: undefined }));
    }
    setFile(file);
    form.setValue(field, file, { shouldValidate: true });
    setPreview(await makePreview(file));
  };

  const handleFileRemove = async (
    field: "cv_file" | "transcript_file" | "addition_file",
    setFile: (f: File | null) => void,
    setPreview: (p: string) => void,
    urlKey: "cv" | "transcript" | "addition"
  ) => {
    if (uploadedUrls[urlKey]) {
      await removeMultipleImages([uploadedUrls[urlKey]!]);
      setUploadedUrls((prev) => ({ ...prev, [urlKey]: undefined }));
    }
    setFile(null);
    setPreview("");
    form.setValue(field, undefined as unknown as File, { shouldValidate: true });
  };

  // ─── Location helpers ────────────────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        form.setValue("lat", latitude, { shouldValidate: true });
        form.setValue("long", longitude, { shouldValidate: true });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          form.setValue(
            "location",
            data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            { shouldValidate: true }
          );
          toast.success("Location detected");
        } catch {
          form.setValue("location", `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, {
            shouldValidate: true,
          });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast.error("Could not get location: " + err.message);
      }
    );
  };

  const handleMapConfirm = useCallback(
    (lat: number, long: number, address: string) => {
      form.setValue("lat", lat, { shouldValidate: true });
      form.setValue("long", long, { shouldValidate: true });
      form.setValue("location", address, { shouldValidate: true });
      setShowMap(false);
      toast.success("Location pinned!");
    },
    [form]
  );

  const clearLocation = () => {
    form.setValue("lat", undefined);
    form.setValue("long", undefined);
  };

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload successful:", res);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // ─── Form submission with cleanup on failure ────────────────────────────
  const onSubmit = async (values: TeacherFormValues) => {
    setSaving(true);
    let uploadedUrlsToCleanup: string[] = [];

    try {
      // Prepare files for upload
      const filesWithMeta = [
        { file: values.cv_file, key: "cv" },
        { file: values.transcript_file, key: "transcript" },
        ...(values.addition_file ? [{ file: values.addition_file, key: "addition" }] : []),
      ];

      toast.loading("Uploading your documents...");
      const uploadResults = await startUpload(filesWithMeta.map((f) => f.file));
      toast.dismiss();

      if (!uploadResults || uploadResults.length === 0) {
        throw new Error("No files were uploaded.");
      }
      if (uploadResults.length !== filesWithMeta.length) {
        throw new Error(`Only ${uploadResults.length} out of ${filesWithMeta.length} files uploaded.`);
      }

      // Build result map and track uploaded URLs for cleanup
      const resultMap: Record<string, string> = {};
      uploadResults.forEach((res, index) => {
        const key = filesWithMeta[index].key;
        const url = res.ufsUrl || res.url;
        if (!url) throw new Error(`Missing URL for ${key}`);
        resultMap[key] = url;
        uploadedUrlsToCleanup.push(url);
      });

      // Store URLs in case we need to clean up later
      setUploadedUrls({
        cv: resultMap.cv,
        transcript: resultMap.transcript,
        addition: resultMap.addition,
      });

      const payload: TeacherPayload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        gender: values.gender,
        cv_link: resultMap.cv,
        transcript_link: resultMap.transcript,
        addition_link: resultMap.addition,
        location: values.location,
        location_hint: values.location_hint,
        lat: values.lat,
        long: values.long,
      };

      const res = await createTeacherFrom(payload);
      if (!res.success) {
        throw new Error(res?.error || "Failed to create teacher");
      }

      // Success: clear storage and form
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(PREVIEWS_KEY);
      form.reset();
      setCvFile(null);
      setCvPreview("");
      setTranscriptFile(null);
      setTranscriptPreview("");
      setAdditionFile(null);
      setAdditionPreview("");
      setUploadedUrls({});
      setShowMap(false);
      toast.success("Registration submitted successfully!");
    } catch (error) {
      // On failure, delete any uploaded files from the server
      if (uploadedUrlsToCleanup.length) {
        await removeMultipleImages(uploadedUrlsToCleanup);
        setUploadedUrls({});
      }
      toast.error(getErrorMessage(error) || "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Check if files are missing after restore (refresh case) ────────────
  const isFileMissing = !cvFile || !transcriptFile;
  const showFileWarning = isFileMissing && (cvPreview || transcriptPreview);

  // ─── Input style helper ──────────────────────────────────────────────────
  const inputCls =
    "h-10 rounded-lg bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white text-sm placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus-visible:ring-blue-400 focus-visible:border-blue-400 dark:focus-visible:ring-blue-500 dark:focus-visible:border-blue-500";

  // ─── Autocomplete effect ─────────────────────────────────────────────────
  const locationVal = form.watch("location");
  useEffect(() => {
    const q = String(locationVal ?? "").trim();
    if (q.length < 3) {
      setLocationOptions([]);
      return;
    }
    if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = window.setTimeout(async () => {
      try {
        setLocationPicking(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const list = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        const options = list
          .map((x) => ({
            label: String(x.display_name ?? "").trim(),
            lat: Number(x.lat),
            lon: Number(x.lon),
          }))
          .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lon))
          .slice(0, 6);
        setLocationOptions(options);
      } catch {
        setLocationOptions([]);
      } finally {
        setLocationPicking(false);
      }
    }, 350);
    return () => {
      if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current);
    };
  }, [locationVal]);

  const hasCoords = form.watch("lat") !== undefined && form.watch("long") !== undefined;

  return (
    <div className="min-h-screen bg-background dark:bg-[#0b1120] py-6 sm:py-10 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 shadow-lg shadow-blue-200/60 dark:shadow-blue-900/30 mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white tracking-tight">
            Tutor Registration
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1.5 max-w-sm mx-auto">
            Join our platform and connect with students seeking your expertise.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Information */}
          <SectionCard
            step={1}
            icon={<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            title="Personal Information"
            accentClass="bg-blue-50 dark:bg-blue-900/30"
          >
            <FieldGroup className="gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input {...field} id="name" placeholder="e.g. Aarav Sharma" disabled={saving} className={inputCls} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel><Mail className="w-3 h-3 inline mr-1 opacity-50" /> Email Address</FieldLabel>
                    <Input {...field} id="email" type="email" placeholder="you@example.com" disabled={saving} className={inputCls} />
                    <FieldDescription>We&apos;ll send updates here.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel><Phone className="w-3 h-3 inline mr-1 opacity-50" /> Phone Number</FieldLabel>
                    <Input {...field} id="phone" placeholder="98XXXXXXXX" disabled={saving} className={inputCls} />
                    <FieldDescription>We will contact you through this number.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel><VenusAndMars className="w-3 h-3 inline mr-1 opacity-50" /> Gender</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                      <SelectTrigger className={cn(inputCls, "w-full", fieldState.invalid && "border-destructive")}>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>This helps us personalize our communication.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </SectionCard>

          {/* Location */}
          <SectionCard
            step={2}
            icon={<MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            title="Location"
            description="Used to match you with nearby tuition opportunities."
            accentClass="bg-blue-50 dark:bg-blue-900/30"
          >
            <FieldGroup className="gap-4">
              <Controller
                name="location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Location</FieldLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input {...field} id="location" placeholder="e.g. Kathmandu, Baneshwor" disabled={saving} className={inputCls} />
                        {String(field.value ?? "").trim().length >= 3 &&
                          (locationPicking || locationOptions.length > 0) && (
                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                              {locationPicking && <div className="px-3 py-2 text-xs text-muted-foreground">Searching locations…</div>}
                              {!locationPicking &&
                                locationOptions.map((opt) => (
                                  <button
                                    key={`${opt.lat}-${opt.lon}-${opt.label}`}
                                    type="button"
                                    onClick={() => {
                                      form.setValue("location", opt.label, { shouldValidate: true });
                                      form.setValue("lat", opt.lat, { shouldValidate: true });
                                      form.setValue("long", opt.lon, { shouldValidate: true });
                                      setLocationOptions([]);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                                  >
                                    <div className="truncate">{opt.label}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                      {opt.lat.toFixed(5)}, {opt.lon.toFixed(5)}
                                    </div>
                                  </button>
                                ))}
                              {!locationPicking && locationOptions.length === 0 && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">No matches.</div>
                              )}
                            </div>
                          )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving || locating}
                        onClick={handleUseMyLocation}
                        className="h-10 px-3 rounded-lg text-xs gap-1.5 whitespace-nowrap border-border bg-card text-foreground hover:border-blue-500 hover:text-blue-600"
                      >
                        {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">My location</span>
                        <span className="sm:hidden">Locate</span>
                      </Button>
                    </div>
                    <FieldDescription>Enter your area so we can reach you when a tuition is nearby.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="location_hint"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Location Hint</FieldLabel>
                    <Textarea
                      {...field}
                      id="location_hint"
                      placeholder="e.g. Near Pragati Secondary School, blue gate house"
                      disabled={saving}
                      rows={2}
                      className="rounded-lg bg-background border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus-visible:ring-blue-400"
                    />
                    <FieldDescription>Add a landmark or hint so we can find you easily.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Field>
                <FieldLabel>Pin on Map <span className="text-[11px] font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setShowMap((v) => !v)} className="h-9 px-3 rounded-lg text-xs gap-1.5">
                    <Map className="w-3.5 h-3.5" />
                    {showMap ? "Close map" : "Select from map"}
                  </Button>
                  {hasCoords && (
                    <Button type="button" variant="outline" size="sm" disabled={saving} onClick={clearLocation} className="h-9 px-3 rounded-lg text-xs gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10">
                      <X className="w-3.5 h-3.5" />
                      Clear pin
                    </Button>
                  )}
                </div>
                {hasCoords && (
                  <p className="text-xs text-foreground mt-2 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-2">
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                    <span>
                      {form.watch("lat")?.toFixed(5)}, {form.watch("long")?.toFixed(5)}
                      {locationVal && ` — ${locationVal.slice(0, 60)}${locationVal.length > 60 ? "…" : ""}`}
                    </span>
                  </p>
                )}
                {showMap && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-border shadow-sm">
                    <MapPicker
                      initialLat={form.watch("lat")}
                      initialLon={form.watch("long")}
                      onConfirm={handleMapConfirm}
                      onClose={() => setShowMap(false)}
                    />
                  </div>
                )}
              </Field>
              {(showMap || hasCoords) && (
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name="lat"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Latitude</FieldLabel>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          placeholder="27.7172"
                          disabled={saving}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          className={inputCls}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="long"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Longitude</FieldLabel>
                        <Input
                          id="long"
                          type="number"
                          step="any"
                          placeholder="85.3240"
                          disabled={saving}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          className={inputCls}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              )}
            </FieldGroup>
          </SectionCard>

          {/* Documents */}
          <SectionCard
            step={3}
            icon={<Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            title="Documents"
            description="CV and transcript are required. Additional certificate is optional."
            accentClass="bg-blue-50 dark:bg-blue-900/30"
          >
            <FieldGroup className="gap-5">
              {showFileWarning && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-xs border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>You refreshed the page – please re-upload your CV and transcript.</span>
                </div>
              )}
              <FileDropZone
                label="CV / Resume"
                hint="JPG, PNG, WEBP · Max 5 MB"
                file={cvFile}
                preview={cvPreview}
                disabled={saving}
                invalid={!!form.formState.errors.cv_file}
                errors={form.formState.errors.cv_file ? [form.formState.errors.cv_file] : []}
                onSelect={(f) => handleFileSelect(f, "cv_file", setCvFile, setCvPreview, "cv")}
                onRemove={() => handleFileRemove("cv_file", setCvFile, setCvPreview, "cv")}
              />
              <FileDropZone
                label="Class 12 Transcript"
                hint="JPG, PNG, WEBP · Max 5 MB"
                file={transcriptFile}
                preview={transcriptPreview}
                disabled={saving}
                invalid={!!form.formState.errors.transcript_file}
                errors={form.formState.errors.transcript_file ? [form.formState.errors.transcript_file] : []}
                onSelect={(f) => handleFileSelect(f, "transcript_file", setTranscriptFile, setTranscriptPreview, "transcript")}
                onRemove={() => handleFileRemove("transcript_file", setTranscriptFile, setTranscriptPreview, "transcript")}
              />
              <FileDropZone
                label="Additional Document"
                hint="Any supporting certificate · JPG, PNG, WEBP · Max 5 MB"
                file={additionFile}
                preview={additionPreview}
                disabled={saving}
                optional
                invalid={!!form.formState.errors.addition_file}
                errors={form.formState.errors.addition_file ? [form.formState.errors.addition_file] : []}
                onSelect={(f) => handleFileSelect(f, "addition_file", setAdditionFile, setAdditionPreview, "addition")}
                onRemove={() => handleFileRemove("addition_file", setAdditionFile, setAdditionPreview, "addition")}
              />
            </FieldGroup>
          </SectionCard>

          {/* Footer Buttons */}
          <div className="flex justify-between gap-3 pt-1 pb-8">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleClearAll}
              className="h-10 rounded-lg text-sm px-5 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Clear all data
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  form.reset();
                  setCvFile(null);
                  setCvPreview("");
                  setTranscriptFile(null);
                  setTranscriptPreview("");
                  setAdditionFile(null);
                  setAdditionPreview("");
                  setShowMap(false);
                  sessionStorage.removeItem(STORAGE_KEY);
                  sessionStorage.removeItem(PREVIEWS_KEY);
                  toast.info("Form reset");
                }}
                className="h-10 rounded-lg text-sm px-5"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={saving || isFileMissing}
                className="h-10 rounded-lg text-sm font-semibold px-7 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Submit Registration
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}