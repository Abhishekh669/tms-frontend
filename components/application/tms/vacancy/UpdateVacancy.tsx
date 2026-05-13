"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Briefcase, Users, Clock, DollarSign, Phone, Percent, BookOpen, Info } from "lucide-react";
import { VacancyStatus, VacancyTypeById, VACANCY_STATUSES } from "@/utils/types/vacancy.types";

const MapPicker = dynamic(
  () => import("@/components/application/teacher-form/MapPicker"),
  { ssr: false }
);

export const editVacancySchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  location_hint: z.string().optional(),
  lat: z.coerce.number().min(-90, "Must be between -90 and 90").max(90),
  lon: z.coerce.number().min(-180, "Must be between -180 and 180").max(180),
  grade: z.string().min(1, "Grade is required"),
  time: z.string().min(1, "Time is required"),
  no_of_students: z.coerce.number().int().positive("Must be a positive number"),
  subject: z.string().optional(),
  salary: z.coerce.number().positive("Salary must be positive"),
  salary_note: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  status: z.enum(["open", "assigned", "ongoing", "completed", "cancelled"]),
  contact_number: z.string().min(1, "Contact number is required"),
  commission_charge: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
});

type EditVacancyFormValues = z.infer<typeof editVacancySchema>;

interface EditVacancyDialogProps {
  vacancy: VacancyTypeById;
  onUpdate: (data: EditVacancyFormValues) => Promise<void> | void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A small section divider with a label */
function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function EditVacancyDialog({
  vacancy,
  onUpdate,
  open,
  onOpenChange,
}: EditVacancyDialogProps) {
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditVacancyFormValues>({
    resolver: zodResolver(editVacancySchema),
    defaultValues: {
      title: vacancy.title,
      location: vacancy.location,
      location_hint: vacancy.location_hint || "",
      lat: vacancy.lat,
      lon: vacancy.lon,
      grade: vacancy.grade,
      time: vacancy.time,
      no_of_students: vacancy.no_of_students,
      subject: vacancy.subject || "",
      salary: vacancy.salary,
      salary_note: vacancy.salary_note || "",
      gender: vacancy.gender as "male" | "female" | "other",
      status: vacancy.status as VacancyStatus,
      contact_number: vacancy.contact_number,
      commission_charge: vacancy.commission_charge,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: vacancy.title,
        location: vacancy.location,
        location_hint: vacancy.location_hint || "",
        lat: vacancy.lat,
        lon: vacancy.lon,
        grade: vacancy.grade,
        time: vacancy.time,
        no_of_students: vacancy.no_of_students,
        subject: vacancy.subject || "",
        salary: vacancy.salary,
        salary_note: vacancy.salary_note || "",
        gender: vacancy.gender as "male" | "female" | "other",
        status: vacancy.status as VacancyStatus,
        contact_number: vacancy.contact_number,
        commission_charge: vacancy.commission_charge,
      });
    }
  }, [open, vacancy, form]);

  const handleMapConfirm = React.useCallback(
    (lat: number, lon: number, address: string) => {
      form.setValue("lat", lat);
      form.setValue("lon", lon);
      form.setValue("location", address);
      setShowMapPicker(false);
      toast.success("Location updated");
    },
    [form]
  );

  const onSubmit = async (data: EditVacancyFormValues) => {
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      onOpenChange(false);
    } catch {
      // onUpdate handles its own error toasts
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        — Width: clamps between 56rem and 90vw so it's wide on desktop
          but still fits on smaller screens.
        — max-h + overflow-y-auto so it scrolls inside on short viewports.
      */}
      <DialogContent className="!w-[min(80rem,calc(100vw-2rem))] !max-w-[95vw] max-h-[92vh] overflow-y-auto p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-8 pt-7 pb-5 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Edit Vacancy
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update the details below and save when you're done.
          </p>
        </DialogHeader>

        {/* ── Body ── */}
        <form
          id="edit-vacancy-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="px-8 py-6"
        >
          <FieldGroup className="space-y-6">

            {/* ── Basic Info ── */}
            <SectionHeading icon={Briefcase} label="Basic Information" />

            {/* Title — full width */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="edit-title"
                    placeholder="e.g., Home tuition needed"
                    className="h-10"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Grade · Subject · Time · Students — 4-col on lg, 2-col on md */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Controller
                name="grade"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-grade">Class / Grade</FieldLabel>
                    <Input {...field} id="edit-grade" placeholder="e.g., 10" className="h-10" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="subject"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-subject">Subject</FieldLabel>
                    <Input {...field} id="edit-subject" placeholder="e.g., Mathematics" className="h-10" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="time"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-time">Time</FieldLabel>
                    <Input {...field} id="edit-time" placeholder="e.g., 5–7 PM" className="h-10" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="no_of_students"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-students">No. of Students</FieldLabel>
                    <Input
                      {...field}
                      id="edit-students"
                      type="number"
                      placeholder="1"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* ── Location ── */}
            <SectionHeading icon={MapPin} label="Location" />

            {/* Location name · Location hint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-location">Location name</FieldLabel>
                    <Input
                      {...field}
                      id="edit-location"
                      placeholder="e.g., Kathmandu, Lakeside"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="location_hint"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-location-hint">
                      Location hint{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-location-hint"
                      placeholder="e.g., near City Centre"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Lat · Lon · Map picker — inline row */}
            <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <Controller
                name="lat"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-lat">Latitude</FieldLabel>
                    <Input
                      {...field}
                      id="edit-lat"
                      type="number"
                      step="any"
                      placeholder="27.7172"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="lon"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-lon">Longitude</FieldLabel>
                    <Input
                      {...field}
                      id="edit-lon"
                      type="number"
                      step="any"
                      placeholder="85.3240"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              {/* Map button sits in the third column aligned to the bottom */}
              <div className="pb-0.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 whitespace-nowrap"
                  onClick={() => setShowMapPicker(true)}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Pick on map
                </Button>
              </div>
            </div>

            {showMapPicker && (
              <MapPicker
                initialLat={form.getValues("lat")}
                initialLon={form.getValues("lon")}
                onConfirm={handleMapConfirm}
                onClose={() => setShowMapPicker(false)}
              />
            )}

            {/* ── Salary ── */}
            <SectionHeading icon={DollarSign} label="Salary" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="salary"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-salary">Salary (NPR)</FieldLabel>
                    <Input
                      {...field}
                      id="edit-salary"
                      type="number"
                      placeholder="15000"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="salary_note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-salary-note">
                      Salary note{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-salary-note"
                      placeholder="e.g., negotiable"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* ── Preferences & Status ── */}
            <SectionHeading icon={Info} label="Preferences & Status" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gender preference */}
              <Controller
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Teacher gender</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {/* Vacancy status */}
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Vacancy status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {VACANCY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {/* Contact number */}
              <Controller
                name="contact_number"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-contact">Contact number</FieldLabel>
                    <Input
                      {...field}
                      id="edit-contact"
                      placeholder="9812345678"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Commission */}
              <Controller
                name="commission_charge"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-commission">Commission (%)</FieldLabel>
                    <Input
                      {...field}
                      id="edit-commission"
                      type="number"
                      step="0.5"
                      placeholder="10"
                      className="h-10"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

          </FieldGroup>
        </form>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-background border-t px-8 py-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-vacancy-form"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}