"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  MapPin, Navigation, FileImage, Loader2, User, Mail, Phone,
  GraduationCap, X, Upload, Map, Check, VenusAndMars,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing/uploadthing.client";
import dynamic from "next/dynamic";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { GenderType, Teacher, UpdateTeacher } from "@/utils/types/teacher.types";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import { updateTeacherData } from "@/utils/action/teacher/teacher.put";
import { useQueryClient } from "@tanstack/react-query";

const MapPicker = dynamic(() => import("@/components/application/teacher-form/MapPicker"), { ssr: false });

// ─── Schema ──────────────────────────────────────────────────────────────────

const updateTeacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number — we will contact you through it")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number — we will contact you through it"),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select your gender" }),
  location: z.string().min(3, "Please enter a valid location so we can reach you when a tuition is near you"),
  location_hint: z.string().min(3, "Please add a location hint so we can reach you when a tuition is near you"),
  lat: z.number({ invalid_type_error: "Latitude is required" }).optional(),
  long: z.number({ invalid_type_error: "Longitude is required" }).optional(),
  cv_file: z.union([z.instanceof(File).refine((f) => f.size <= 5 * 1024 * 1024, "CV image must be under 5MB"), z.undefined()]).optional(),
  transcript_file: z.union([z.instanceof(File).refine((f) => f.size <= 5 * 1024 * 1024, "Transcript must be under 5MB"), z.undefined()]).optional(),
  addition_file: z.union([z.instanceof(File).refine((f) => f.size <= 5 * 1024 * 1024, "Additional document must be under 5MB"), z.undefined()]).optional(),
});

type UpdateTeacherFormValues = z.infer<typeof updateTeacherSchema>;

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
  existingUrl?: string | null;
}

function FileDropZone({ label, hint, file, preview, onSelect, onRemove, disabled, invalid, optional, errors, existingUrl }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displaySrc = preview || existingUrl || "";
  const hasImage = Boolean(displaySrc);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel>
        {label}
        {optional && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(optional)</span>}
      </FieldLabel>
      <div
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) onSelect(f); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200 group",
          hasImage ? "h-44" : "h-28",
          disabled && "opacity-50 pointer-events-none",
          invalid ? "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"
            : file ? "border-teal-400 bg-teal-50/40 dark:border-teal-700 dark:bg-teal-950/20"
            : existingUrl ? "border-blue-300 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/20"
            : "border-slate-200 bg-slate-50/80 hover:border-teal-300 hover:bg-teal-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-700"
        )}
      >
        {hasImage ? (
          <>
            <img src={displaySrc} alt={label} className="w-full h-full object-cover" />
            {existingUrl && !file && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-2 py-1 text-center">
                Current file — click to replace
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium tracking-wide">Replace file</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform z-10">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2.5 px-4 text-center">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              invalid ? "bg-rose-100 dark:bg-rose-900/40" : "bg-slate-100 group-hover:bg-teal-100 dark:bg-slate-700 dark:group-hover:bg-teal-900/40")}>
              <FileImage className={cn("w-5 h-5 transition-colors",
                invalid ? "text-rose-400" : "text-slate-400 group-hover:text-teal-500 dark:text-slate-400 dark:group-hover:text-teal-400")} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="text-teal-600 dark:text-teal-400">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={disabled}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ""; }} />
      </div>
      {invalid && errors && errors.length > 0 && <FieldError errors={errors} />}
    </Field>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ step, icon, title, description, accentClass, children }: {
  step: number; icon: React.ReactNode; title: string; description?: string; accentClass: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm bg-white dark:bg-slate-900/60 flex flex-col">
      <div className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accentClass)}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">Step {step}</span>
            </div>
            {description && <p className="text-[11px] mt-0.5 text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 pt-5 flex-1">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface UpdateTeacherDataProps {
  teacher: Teacher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UpdateTeacherData({ teacher, open, onOpenChange }: UpdateTeacherDataProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationPicking, setLocationPicking] = useState(false);
  const [locationOptions, setLocationOptions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const locationDebounceRef = useRef<number | null>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState("");
  const [cvCleared, setCvCleared] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [transcriptCleared, setTranscriptCleared] = useState(false);
  const [additionFile, setAdditionFile] = useState<File | null>(null);
  const [additionPreview, setAdditionPreview] = useState("");
  const [additionCleared, setAdditionCleared] = useState(false);

  const form = useForm<UpdateTeacherFormValues>({
    resolver: zodResolver(updateTeacherSchema),
    defaultValues: {
      name: teacher.name, email: teacher.email, phone: teacher.phone,
      gender: teacher.gender as GenderType, location: teacher.location,
      location_hint: teacher.location_hint ?? "",
      lat: teacher.lat ?? undefined, long: teacher.long ?? undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: teacher.name, email: teacher.email, phone: teacher.phone,
        gender: teacher.gender as GenderType, location: teacher.location,
        location_hint: teacher.location_hint ?? "",
        lat: teacher.lat ?? undefined, long: teacher.long ?? undefined,
      });
      setCvFile(null); setCvPreview(""); setCvCleared(false);
      setTranscriptFile(null); setTranscriptPreview(""); setTranscriptCleared(false);
      setAdditionFile(null); setAdditionPreview(""); setAdditionCleared(false);
      setShowMap(false);
    }
  }, [open, teacher]);

  const lat = form.watch("lat");
  const long = form.watch("long");
  const locationVal = form.watch("location");
  const hasCoords = lat !== undefined && long !== undefined;

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

  const makePreview = (file: File): Promise<string> =>
    new Promise((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target?.result as string); r.readAsDataURL(file); });

  const handleFileSelect = async (
    file: File, field: "cv_file" | "transcript_file" | "addition_file",
    setFile: (f: File | null) => void, setPreview: (p: string) => void, setCleared: (c: boolean) => void
  ) => { setFile(file); setCleared(false); form.setValue(field, file, { shouldValidate: true }); setPreview(await makePreview(file)); };

  const handleFileRemove = (
    field: "cv_file" | "transcript_file" | "addition_file",
    setFile: (f: File | null) => void, setPreview: (p: string) => void, setCleared: (c: boolean) => void
  ) => { setFile(null); setPreview(""); setCleared(true); form.setValue(field, undefined, { shouldValidate: false }); };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        form.setValue("lat", latitude, { shouldValidate: true });
        form.setValue("long", longitude, { shouldValidate: true });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          form.setValue("location", data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
          toast.success("Location detected");
        } catch {
          form.setValue("location", `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
        } finally { setLocating(false); }
      },
      (err) => { setLocating(false); toast.error("Could not get location: " + err.message); }
    );
  };

  const handleMapConfirm = useCallback((lat: number, long: number, address: string) => {
    form.setValue("lat", lat, { shouldValidate: true });
    form.setValue("long", long, { shouldValidate: true });
    // Always sync location text to selected address
    form.setValue("location", address, { shouldValidate: true });
    setShowMap(false);
    toast.success("Location pinned!");
  }, [form]);

  const { startUpload } = useUploadThing("imageUploader", {
    onUploadError: (error) => { toast.error(`Upload failed: ${error.message}`); },
  });

  const onSubmit = async (values: UpdateTeacherFormValues) => {
    const hasCv = cvFile || (!cvCleared && teacher.cv_link);
    const hasTranscript = transcriptFile || (!transcriptCleared && teacher.transcript_link);
    if (!hasCv) { toast.error("CV is required. Please upload a CV."); return; }
    if (!hasTranscript) { toast.error("Transcript is required. Please upload a transcript."); return; }

    setSaving(true);
    try {
      const urlsToDelete: string[] = [];
      if (cvFile && teacher.cv_link) urlsToDelete.push(teacher.cv_link);
      if (cvCleared && teacher.cv_link) urlsToDelete.push(teacher.cv_link);
      if (transcriptFile && teacher.transcript_link) urlsToDelete.push(teacher.transcript_link);
      if (transcriptCleared && teacher.transcript_link) urlsToDelete.push(teacher.transcript_link);
      if (additionFile && teacher.addition_link) urlsToDelete.push(teacher.addition_link);
      if (additionCleared && teacher.addition_link) urlsToDelete.push(teacher.addition_link);

      if (urlsToDelete.length > 0) {
        const deleteRes = await removeMultipleImages(urlsToDelete);
        if (!deleteRes.success) console.warn("Failed to delete old images:", deleteRes.error);
      }

      const newFilesToUpload: { file: File; key: "cv" | "transcript" | "addition" }[] = [];
      if (cvFile) newFilesToUpload.push({ file: cvFile, key: "cv" });
      if (transcriptFile) newFilesToUpload.push({ file: transcriptFile, key: "transcript" });
      if (additionFile) newFilesToUpload.push({ file: additionFile, key: "addition" });

      const resultMap: Record<string, string> = {};
      if (newFilesToUpload.length > 0) {
        toast.loading("Uploading documents…");
        const uploadResults = await startUpload(newFilesToUpload.map((f) => f.file));
        toast.dismiss();
        if (!uploadResults || uploadResults.length !== newFilesToUpload.length) throw new Error("Upload failed — some files were not uploaded.");
        uploadResults.forEach((res, idx) => {
          const key = newFilesToUpload[idx].key;
          const url = res.ufsUrl || res.url;
          if (!url) throw new Error(`Missing URL for ${key}`);
          resultMap[key] = url;
        });
      }

      const payload: UpdateTeacher = {
        id: teacher.id,
        name: values.name, email: values.email, phone: values.phone, gender: values.gender,
        cv_link: resultMap.cv ?? (cvCleared ? "" : teacher.cv_link),
        transcript_link: resultMap.transcript ?? (transcriptCleared ? "" : teacher.transcript_link),
        addition_link: additionCleared ? undefined : resultMap.addition ?? teacher.addition_link ?? undefined,
        location: values.location, location_hint: values.location_hint,
        lat: values.lat, long: values.long,
      };

      const res = await updateTeacherData(payload);
      if (!res.success) throw new Error(res?.error || "Failed to update teacher");
      queryClient.invalidateQueries({ queryKey: ["get-all-teachers"] });
      toast.success("Teacher updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-10 rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-teal-500 focus-visible:border-teal-400 placeholder:text-slate-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-5xl gives a wide desktop dialog */}
      <DialogContent className="w-[96vw] max-w-5xl sm:max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-0 gap-0">

        {/* ── Sticky Header ── */}
        <DialogHeader className="px-8 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500 shadow-md shadow-teal-200 dark:shadow-teal-900/40">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Edit Teacher</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update details for <span className="font-medium text-foreground">{teacher.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">

          {/* ── Row 1: Personal Info + Location side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Personal Info */}
            <SectionCard step={1} icon={<User className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />}
              title="Personal Information" accentClass="bg-violet-100 dark:bg-violet-900/40">
              <FieldGroup className="gap-4">
                <Controller name="name" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-name">Full Name</FieldLabel>
                    <Input {...field} id="edit-name" placeholder="e.g. Aarav Sharma" disabled={saving} className={inputCls} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />
                <Controller name="email" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-email"><Mail className="w-3 h-3 inline mr-1 opacity-60" />Email Address</FieldLabel>
                    <Input {...field} id="edit-email" type="email" placeholder="you@example.com" disabled={saving} className={inputCls} />
                    <FieldDescription>We'll send updates here.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />
                <Controller name="phone" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-phone"><Phone className="w-3 h-3 inline mr-1 opacity-60" />Phone Number</FieldLabel>
                    <Input {...field} id="edit-phone" placeholder="98XXXXXXXX" disabled={saving} className={inputCls} />
                    <FieldDescription>We will contact you through this number.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />
                <Controller name="gender" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-gender"><VenusAndMars className="w-3 h-3 inline mr-1 opacity-60" />Gender</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                      <SelectTrigger id="edit-gender" className={cn(inputCls, "w-full", fieldState.invalid && "border-rose-500 ring-rose-500")}>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />
              </FieldGroup>
            </SectionCard>

            {/* Location */}
            <SectionCard step={2} icon={<MapPin className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />}
              title="Location" description="Used to match you with nearby tuition opportunities."
              accentClass="bg-teal-100 dark:bg-teal-900/40">
              <FieldGroup className="gap-4">
                <Controller name="location" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-location">Location</FieldLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input {...field} id="edit-location" placeholder="e.g. Kathmandu, Baneshwor" disabled={saving} className={cn(inputCls, "w-full")} />

                        {String(field.value ?? "").trim().length >= 3 &&
                          (locationPicking || locationOptions.length > 0) && (
                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                              {locationPicking && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  Searching locations…
                                </div>
                              )}
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
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  No matches.
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                      <Button type="button" variant="outline" size="sm" disabled={saving || locating} onClick={handleUseMyLocation}
                        className="h-10 px-3 rounded-lg text-xs gap-1.5 whitespace-nowrap border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 hover:border-teal-300 dark:hover:bg-teal-950/30 dark:hover:border-teal-700 transition-colors">
                        {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                        My location
                      </Button>
                    </div>
                    <FieldDescription>Enter your area so we can reach you when a tuition is nearby.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />
                <Controller name="location_hint" control={form.control} render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-location-hint">Location Hint</FieldLabel>
                    <Textarea {...field} id="edit-location-hint" placeholder="e.g. Near Pragati Secondary School, blue gate house"
                      disabled={saving} rows={2}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-sm resize-none focus-visible:ring-teal-500 focus-visible:border-teal-400" />
                    <FieldDescription>Add a landmark or hint so we can find you easily.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )} />

                {/* Map pin */}
                <Field>
                  <FieldLabel>Pin on Map <span className="text-[11px] font-normal text-muted-foreground">(optional)</span></FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setShowMap((v) => !v)}
                      className="h-9 px-3 rounded-lg text-xs gap-1.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 hover:border-teal-300 dark:hover:bg-teal-950/30 dark:hover:border-teal-700 transition-colors">
                      <Map className="w-3.5 h-3.5" />{showMap ? "Close map" : "Select from map"}
                    </Button>
                    {hasCoords && (
                      <Button type="button" variant="outline" size="sm" disabled={saving}
                        onClick={() => { form.setValue("lat", undefined); form.setValue("long", undefined); }}
                        className="h-9 px-3 rounded-lg text-xs gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors">
                        <X className="w-3.5 h-3.5" />Clear pin
                      </Button>
                    )}
                  </div>
                  {hasCoords && (
                    <p className="text-xs text-teal-700 dark:text-teal-400 mt-2 flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{lat?.toFixed(5)}, {long?.toFixed(5)}{locationVal && ` — ${locationVal.slice(0, 50)}${locationVal.length > 50 ? "…" : ""}`}</span>
                    </p>
                  )}
                  {showMap && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <MapPicker initialLat={lat} initialLon={long} onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />
                    </div>
                  )}
                </Field>

                {(showMap || hasCoords) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Controller name="lat" control={form.control} render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-lat">Latitude</FieldLabel>
                        <Input id="edit-lat" type="number" step="any" placeholder="27.7172" disabled={saving}
                          value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} className={inputCls} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                    <Controller name="long" control={form.control} render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-long">Longitude</FieldLabel>
                        <Input id="edit-long" type="number" step="any" placeholder="85.3240" disabled={saving}
                          value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} className={inputCls} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                  </div>
                )}
              </FieldGroup>
            </SectionCard>
          </div>

          {/* ── Row 2: Documents — 3 cols ── */}
          <SectionCard step={3} icon={<Upload className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />}
            title="Documents" description="CV and transcript are required. Replace by clicking/dropping a new file. Additional certificate is optional."
            accentClass="bg-amber-100 dark:bg-amber-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FileDropZone label="CV / Resume" hint="JPG, PNG, WEBP · Max 5 MB"
                file={cvFile} preview={cvPreview} existingUrl={cvCleared ? null : teacher.cv_link}
                disabled={saving} invalid={cvCleared && !cvFile}
                errors={cvCleared && !cvFile ? [{ message: "CV is required" }] : []}
                onSelect={(f) => handleFileSelect(f, "cv_file", setCvFile, setCvPreview, setCvCleared)}
                onRemove={() => handleFileRemove("cv_file", setCvFile, setCvPreview, setCvCleared)} />
              <FileDropZone label="Class 12 Transcript" hint="JPG, PNG, WEBP · Max 5 MB"
                file={transcriptFile} preview={transcriptPreview} existingUrl={transcriptCleared ? null : teacher.transcript_link}
                disabled={saving} invalid={transcriptCleared && !transcriptFile}
                errors={transcriptCleared && !transcriptFile ? [{ message: "Transcript is required" }] : []}
                onSelect={(f) => handleFileSelect(f, "transcript_file", setTranscriptFile, setTranscriptPreview, setTranscriptCleared)}
                onRemove={() => handleFileRemove("transcript_file", setTranscriptFile, setTranscriptPreview, setTranscriptCleared)} />
              <FileDropZone label="Additional Document" hint="Any supporting certificate · JPG, PNG, WEBP · Max 5 MB"
                file={additionFile} preview={additionPreview} existingUrl={additionCleared ? null : teacher.addition_link ?? null}
                disabled={saving} optional
                onSelect={(f) => handleFileSelect(f, "addition_file", setAdditionFile, setAdditionPreview, setAdditionCleared)}
                onRemove={() => handleFileRemove("addition_file", setAdditionFile, setAdditionPreview, setAdditionCleared)} />
            </div>
          </SectionCard>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg text-sm px-5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="h-10 rounded-lg text-sm font-semibold px-7 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {saving
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span>
                : <span className="flex items-center gap-2"><Check className="w-4 h-4" />Save Changes</span>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateTeacherData;