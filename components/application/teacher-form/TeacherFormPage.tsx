"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  Phone,
  GraduationCap,
  X,
  Upload,
  Map,
  Check,
  VenusAndMars,
  AlertCircle,
  Mail,
  RotateCcw,
  Trash2,
  Info,
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
import { useRouter } from "next/navigation";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB hard limit
const MAX_FILE_LABEL = "4 MB";

// ─── Schema ──────────────────────────────────────────────────────────────────
const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select your gender",
  }),
  location: z.string().min(3, "Please enter a valid location"),
  location_hint: z.string().min(3, "Please add a location hint"),
  lat: z.number({ invalid_type_error: "Latitude is required" }).optional(),
  long: z.number({ invalid_type_error: "Longitude is required" }).optional(),
  cv_file: z
    .instanceof(File, { message: "CV image is required" })
    .refine((f) => f.size <= MAX_FILE_BYTES, `CV image must be under ${MAX_FILE_LABEL}`),
  transcript_file: z
    .instanceof(File, { message: "Class 12 transcript is required" })
    .refine((f) => f.size <= MAX_FILE_BYTES, `Transcript must be under ${MAX_FILE_LABEL}`),
  addition_file: z
    .union([
      z
        .instanceof(File)
        .refine((f) => f.size <= MAX_FILE_BYTES, `Additional document must be under ${MAX_FILE_LABEL}`),
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

// ─── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "teacher-form-draft";
const PREVIEWS_KEY = "teacher-form-previews";

// ─── Safe file validator ──────────────────────────────────────────────────────
function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files (JPG, PNG, WEBP) are accepted.";
  }
  if (file.size > MAX_FILE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `File is ${sizeMB} MB — please use an image under ${MAX_FILE_LABEL}.`;
  }
  return null;
}

// ─── File Drop Zone ───────────────────────────────────────────────────────────
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
    if (dropped) onSelect(dropped);
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50 mb-1.5">
        {label}
        {optional && (
          <span className="ml-2 normal-case tracking-normal font-normal text-[11px] text-muted-foreground">
            optional
          </span>
        )}
      </FieldLabel>

      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-200 group block",
          preview ? "h-36" : "h-24",
          disabled && "opacity-50 pointer-events-none",
          invalid
            ? "border-destructive bg-destructive/5"
            : file
            ? "border-blue-500/40 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-950/20"
            : "border-border/60 bg-muted/30 hover:border-blue-400/60 hover:bg-blue-50/20 dark:border-white/10 dark:hover:border-blue-500/40"
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
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-destructive transition-colors z-10 touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full gap-3 px-4">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              invalid ? "bg-destructive/10" : "bg-background dark:bg-white/5"
            )}>
              <FileImage className={cn("w-4 h-4", invalid ? "text-destructive" : "text-muted-foreground group-hover:text-blue-500 transition-colors")} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground dark:text-white">
                <span className="text-blue-600 dark:text-blue-400">Upload</span> or drag & drop
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

      {invalid && errors && errors.length > 0 && <FieldError errors={errors} />}
    </Field>
  );
}

// ─── Step Section ─────────────────────────────────────────────────────────────
function StepSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex gap-4 sm:gap-5">
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <div className="w-7 h-7 rounded-full bg-foreground dark:bg-white text-background dark:text-black text-[11px] font-black flex items-center justify-center tabular-nums select-none">
            {step}
          </div>
          <div className="w-px flex-1 bg-border/50 dark:bg-white/10 mt-1" />
        </div>
        <div className="flex-1 pb-6 min-w-0">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-foreground dark:text-white tracking-tight">{title}</h2>
            {description && (
              <p className="text-[11px] text-muted-foreground dark:text-white/40 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/60 dark:border-white/8 bg-card dark:bg-white/[0.03] p-4 sm:p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Input class ──────────────────────────────────────────────────────────────
const inputCls =
  "h-10 rounded-lg bg-background dark:bg-white/5 border-border/60 dark:border-white/10 text-foreground dark:text-white text-sm placeholder:text-muted-foreground/60 dark:placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:focus-visible:ring-blue-400 dark:focus-visible:border-blue-400 transition-colors";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherFormPage() {
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationPicking, setLocationPicking] = useState(false);
  const [locationOptions, setLocationOptions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const locationDebounceRef = useRef<number | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState("");
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [additionFile, setAdditionFile] = useState<File | null>(null);
  const [additionPreview, setAdditionPreview] = useState("");

  const uploadedUrlsRef = useRef<{ cv?: string; transcript?: string; addition?: string }>({});

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

  // ─── Load persisted text data on mount ──────────────────────────────────
  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const { name, email, phone, gender, location, location_hint, lat, long } = parsed;
        form.reset({ name, email, phone, gender, location, location_hint, lat, long });
      } catch (_) {}
    }
    const savedPreviews = sessionStorage.getItem(PREVIEWS_KEY);
    if (savedPreviews) {
      try {
        const { cv, transcript, addition } = JSON.parse(savedPreviews);
        if (cv) setCvPreview(cv);
        if (transcript) setTranscriptPreview(transcript);
        if (addition) setAdditionPreview(addition);
      } catch (_) {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Persist text fields on change ──────────────────────────────────────
  useEffect(() => {
    const subscription = form.watch((values) => {
      const { name, email, phone, gender, location, location_hint, lat, long } = values;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, email, phone, gender, location, location_hint, lat, long })
      );
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // ─── Persist previews ────────────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem(
      PREVIEWS_KEY,
      JSON.stringify({ cv: cvPreview, transcript: transcriptPreview, addition: additionPreview })
    );
  }, [cvPreview, transcriptPreview, additionPreview]);

  // ─── Before-unload warning ───────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  // ─── Close location dropdown on outside click ────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationOptions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Cleanup uploaded images ─────────────────────────────────────────────
  const cleanupUploadedImages = async (urls?: string[]) => {
    const toDelete =
      urls ?? (Object.values(uploadedUrlsRef.current).filter(Boolean) as string[]);
    if (toDelete.length) {
      await removeMultipleImages(toDelete);
      uploadedUrlsRef.current = {};
    }
  };

  // ─── Clear All — wipes everything including uploaded files on the server ──
  const handleClearAll = async () => {
    await cleanupUploadedImages();
    setCvFile(null); setCvPreview("");
    setTranscriptFile(null); setTranscriptPreview("");
    setAdditionFile(null); setAdditionPreview("");
    form.reset({
      name: "", email: "", phone: "", gender: undefined,
      location: "", location_hint: "", lat: undefined, long: undefined,
    });
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PREVIEWS_KEY);
    toast.success("All data cleared");
  };

  // ─── Reset — clears fields & uploaded file previews but keeps nothing ────
  const handleReset = () => {
    form.reset({
      name: "", email: "", phone: "", gender: undefined,
      location: "", location_hint: "", lat: undefined, long: undefined,
    });
    setCvFile(null); setCvPreview("");
    setTranscriptFile(null); setTranscriptPreview("");
    setAdditionFile(null); setAdditionPreview("");
    setShowMap(false);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PREVIEWS_KEY);
    toast.info("Form reset — please fill in your details again.");
  };

  // ─── File utils ──────────────────────────────────────────────────────────
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
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError, { duration: 4000 });
      return;
    }
    const prev = uploadedUrlsRef.current[urlKey];
    if (prev) {
      await removeMultipleImages([prev]);
      uploadedUrlsRef.current = { ...uploadedUrlsRef.current, [urlKey]: undefined };
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
    const prev = uploadedUrlsRef.current[urlKey];
    if (prev) {
      await removeMultipleImages([prev]);
      uploadedUrlsRef.current = { ...uploadedUrlsRef.current, [urlKey]: undefined };
    }
    setFile(null);
    setPreview("");
    form.setValue(field, undefined as unknown as File, { shouldValidate: true });
  };

  // ─── Location helpers ────────────────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
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
          toast.success("Location detected successfully!");
        } catch {
          form.setValue("location", `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          toast.error(
            "Location access was denied. On your phone, go to Settings → Browser → Location → Allow, then try again.",
            { duration: 7000 }
          );
        } else if (err.code === 2) {
          toast.error("Could not determine your location. Make sure your GPS / mobile data is on.", { duration: 5000 });
        } else {
          toast.error("Location request timed out. Please try again or type your area manually.", { duration: 5000 });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // ─── Location autocomplete ────────────────────────────────────────────────
  const locationVal = form.watch("location");
  useEffect(() => {
    const q = String(locationVal ?? "").trim();
    if (q.length < 3) { setLocationOptions([]); return; }
    if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = window.setTimeout(async () => {
      try {
        setLocationPicking(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const list = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
        setLocationOptions(
          list
            .map((x) => ({ label: String(x.display_name ?? "").trim(), lat: Number(x.lat), lon: Number(x.lon) }))
            .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lon))
            .slice(0, 6)
        );
      } catch { setLocationOptions([]); }
      finally { setLocationPicking(false); }
    }, 350);
    return () => { if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current); };
  }, [locationVal]);

  // ─── Submit ──────────────────────────────────────────────────────────────
  const onSubmit = async (values: TeacherFormValues) => {
    setSaving(true);
    let freshlyUploadedUrls: string[] = [];

    try {
      const filesWithMeta = [
        { file: values.cv_file, key: "cv" },
        { file: values.transcript_file, key: "transcript" },
        ...(values.addition_file ? [{ file: values.addition_file, key: "addition" }] : []),
      ];

      const uploadToast = toast.loading("Uploading documents…");
      const uploadResults = await startUpload(filesWithMeta.map((f) => f.file));
      toast.dismiss(uploadToast);

      if (!uploadResults || uploadResults.length === 0) throw new Error("No files were uploaded.");
      if (uploadResults.length !== filesWithMeta.length)
        throw new Error(`Only ${uploadResults.length} of ${filesWithMeta.length} files uploaded.`);

      const resultMap: Record<string, string> = {};
      uploadResults.forEach((res, i) => {
        const key = filesWithMeta[i].key;
        const url = res.ufsUrl || res.url;
        if (!url) throw new Error(`Missing URL for ${key}`);
        resultMap[key] = url;
        freshlyUploadedUrls.push(url);
      });

      uploadedUrlsRef.current = { cv: resultMap.cv, transcript: resultMap.transcript, addition: resultMap.addition };

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

      const result = await createTeacherFrom(payload);
      if (!result.success) throw new Error(result?.error || "Failed to create teacher");

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(PREVIEWS_KEY);
      form.reset();
      setCvFile(null); setCvPreview("");
      setTranscriptFile(null); setTranscriptPreview("");
      setAdditionFile(null); setAdditionPreview("");
      uploadedUrlsRef.current = {};
      setShowMap(false);
      toast.success("Registration submitted successfully!");
      router.replace("/");
    } catch (error) {
      if (freshlyUploadedUrls.length) {
        await removeMultipleImages(freshlyUploadedUrls);
        uploadedUrlsRef.current = {};
      }
      toast.error(getErrorMessage(error) || "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = form.watch("lat") !== undefined && form.watch("long") !== undefined;
  const isFileMissing = !cvFile || !transcriptFile;
  const showFileWarning = isFileMissing && (!!cvPreview || !!transcriptPreview);

  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0f1a] py-8 sm:py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Tutor Registration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-white leading-tight tracking-tight">
            Join as a tutor.
          </h1>
          <p className="text-sm text-muted-foreground dark:text-white/40 mt-2 leading-relaxed max-w-sm">
            Fill in your details and we'll match you with students in your area.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

          {/* ── Step 1: Personal ── */}
          <StepSection step={1} title="Personal Information">
            <FieldGroup className="gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Full Name</FieldLabel>
                    <Input {...field} placeholder="e.g. Aarav Sharma" disabled={saving} className={inputCls} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Email</FieldLabel>
                    <Input {...field} type="email" placeholder="you@example.com" disabled={saving} className={inputCls} />
                    <FieldDescription className="text-[11px]">We'll send updates here.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Phone</FieldLabel>
                    <Input {...field} placeholder="98XXXXXXXX" disabled={saving} className={inputCls} />
                    <FieldDescription className="text-[11px]">We'll contact you through this number.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Gender</FieldLabel>
                    <div className="relative z-10">
                      <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                        <SelectTrigger
                          className={cn(inputCls, "w-full touch-manipulation")}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-50">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </StepSection>

          {/* ── Step 2: Location ── */}
          <StepSection
            step={2}
            title="Location"
            description="Helps us match you with nearby tuition opportunities."
          >
            <FieldGroup className="gap-4">
              <Controller
                name="location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Your Area</FieldLabel>
                    <div className="flex gap-2" ref={locationDropdownRef}>
                      <div className="relative flex-1">
                        <Input
                          {...field}
                          placeholder="e.g. Kathmandu, Baneshwor"
                          disabled={saving}
                          className={inputCls}
                        />
                        {String(field.value ?? "").trim().length >= 3 &&
                          (locationPicking || locationOptions.length > 0) && (
                            <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-background dark:bg-[#0f1929] shadow-xl overflow-hidden">
                              {locationPicking && (
                                <div className="px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Searching…
                                </div>
                              )}
                              {!locationPicking && locationOptions.map((opt) => (
                                <button
                                  key={`${opt.lat}-${opt.lon}`}
                                  type="button"
                                  onClick={() => {
                                    form.setValue("location", opt.label, { shouldValidate: true });
                                    form.setValue("lat", opt.lat, { shouldValidate: true });
                                    form.setValue("long", opt.lon, { shouldValidate: true });
                                    setLocationOptions([]);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted dark:hover:bg-white/5 transition-colors border-b border-border/50 last:border-0 touch-manipulation"
                                >
                                  <div className="truncate font-medium text-foreground dark:text-white">{opt.label}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                    {opt.lat.toFixed(4)}, {opt.lon.toFixed(4)}
                                  </div>
                                </button>
                              ))}
                              {!locationPicking && locationOptions.length === 0 && (
                                <div className="px-3 py-2.5 text-xs text-muted-foreground">No matches found.</div>
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
                        className="h-10 px-3 rounded-lg text-xs gap-1.5 flex-shrink-0 border-border/60 dark:border-white/10 touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent", minWidth: "44px" }}
                        title="Use my location"
                      >
                        {locating
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Navigation className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline text-xs">My location</span>
                      </Button>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-500" />
                      <span>
                        For the most accurate pin, make sure your phone&apos;s{" "}
                        <strong>Location / GPS is turned on</strong> in Settings before tapping{" "}
                        <Navigation className="w-2.5 h-2.5 inline -mt-0.5" />.
                      </span>
                    </p>

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="location_hint"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Location Hint</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="e.g. Near Pragati Secondary School, blue gate house"
                      disabled={saving}
                      rows={2}
                      className="rounded-lg bg-background dark:bg-white/5 border-border/60 dark:border-white/10 text-foreground dark:text-white text-sm placeholder:text-muted-foreground/60 dark:placeholder:text-white/25 resize-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                    <FieldDescription className="text-[11px]">A nearby landmark so we can find you easily.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">
                  Pin on Map <span className="normal-case tracking-normal font-normal text-muted-foreground ml-1">optional</span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => setShowMap((v) => !v)}
                    className="h-11 sm:h-9 px-4 rounded-lg text-xs gap-1.5 border-border/60 dark:border-white/10 touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent", minWidth: "44px" }}
                  >
                    <Map className="w-3.5 h-3.5" />
                    {showMap ? "Close map" : "Select from map"}
                  </Button>
                  {hasCoords && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={clearLocation}
                      className="h-11 sm:h-9 px-4 rounded-lg text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 touch-manipulation"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <X className="w-3.5 h-3.5" /> Clear pin
                    </Button>
                  )}
                </div>
                {hasCoords && (
                  <p className="text-[11px] text-foreground mt-2 flex items-start gap-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg px-3 py-2">
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 mt-0.5" />
                    <span className="font-mono">
                      {form.watch("lat")?.toFixed(5)}, {form.watch("long")?.toFixed(5)}
                    </span>
                  </p>
                )}
                {showMap && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-border/60 dark:border-white/10">
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
                        <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Latitude</FieldLabel>
                        <Input
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
                        <FieldLabel className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50">Longitude</FieldLabel>
                        <Input
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
          </StepSection>

          {/* ── Step 3: Documents ── */}
          <StepSection
            step={3}
            title="Documents"
            description={`CV and transcript are required. Max ${MAX_FILE_LABEL} per file. If any upload error occurs, tap Reset below and fill the form again.`}
          >
            <FieldGroup className="gap-5">
              {showFileWarning && (
                <div className="flex items-start gap-2.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl text-xs border border-amber-200/60 dark:border-amber-800/40">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Page was refreshed — please re-upload your CV and transcript.</span>
                </div>
              )}

              <FileDropZone
                label="CV / Resume"
                hint={`JPG, PNG, WEBP · Max ${MAX_FILE_LABEL}`}
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
                hint={`JPG, PNG, WEBP · Max ${MAX_FILE_LABEL}`}
                file={transcriptFile}
                preview={transcriptPreview}
                disabled={saving}
                invalid={!!form.formState.errors.transcript_file}
                errors={form.formState.errors.transcript_file ? [form.formState.errors.transcript_file] : []}
                onSelect={(f) => handleFileSelect(f, "transcript_file", setTranscriptFile, setTranscriptPreview, "transcript")}
                onRemove={() => handleFileRemove("transcript_file", setTranscriptFile, setTranscriptPreview, "transcript")}
              />

              {/* ── Additional Document with note ── */}
              <FileDropZone
                label="Additional Document"
                hint={`JPG, PNG, WEBP · Max ${MAX_FILE_LABEL}`}
                file={additionFile}
                preview={additionPreview}
                disabled={saving}
                optional
                invalid={!!form.formState.errors.addition_file}
                errors={form.formState.errors.addition_file ? [form.formState.errors.addition_file] : []}
                onSelect={(f) => handleFileSelect(f, "addition_file", setAdditionFile, setAdditionPreview, "addition")}
                onRemove={() => handleFileRemove("addition_file", setAdditionFile, setAdditionPreview, "addition")}
              />

              {/* Bachelor's preferred note + error recovery hint */}
              <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/20 px-3 py-3 -mt-2 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
                  <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                    <strong>Bachelor&apos;s degree certificate is preferred</strong> as the additional document — it strengthens your profile and improves matching chances.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400 dark:text-blue-500" />
                  <p className="text-[11px] leading-relaxed text-blue-600 dark:text-blue-400">
                    If you get an upload error here, tap{" "}
                    <strong>Reset</strong> at the bottom and re-fill the form — it clears any stuck state and lets you try again cleanly.
                  </p>
                </div>
              </div>

            </FieldGroup>
          </StepSection>

          {/* ── Footer Buttons ── */}
          <div className="pt-2 pb-10">

            {/* Button legend — tells users what each button does */}
            <div className="mb-3 rounded-xl border border-border/50 dark:border-white/8 bg-muted/30 dark:bg-white/[0.02] px-3.5 py-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground dark:text-white/30 mb-2">
                Button guide
              </p>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground dark:text-white/40 leading-relaxed">
                  <strong className="text-foreground dark:text-white/70">Reset</strong> — clears all fields and uploaded file previews so you can start fresh. Use this if you encounter any errors.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Trash2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-destructive/70" />
                <p className="text-[11px] text-muted-foreground dark:text-white/40 leading-relaxed">
                  <strong className="text-foreground dark:text-white/70">Clear all</strong> — same as Reset, but also permanently deletes any files already uploaded to the server. Use this only if you want to start completely over.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleClearAll}
                  className="flex-1 sm:flex-none h-12 sm:h-10 rounded-xl text-sm px-4 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleReset}
                  className="flex-1 sm:flex-none h-12 sm:h-10 rounded-xl text-sm px-4 border-border/60 dark:border-white/10 gap-2 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </Button>
              </div>

              <Button
                type="submit"
                disabled={saving || isFileMissing}
                className="w-full sm:w-auto h-12 sm:h-10 rounded-xl text-sm font-semibold px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 gap-2 transition-all touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}