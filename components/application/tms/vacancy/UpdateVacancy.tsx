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
import { MapPin } from "lucide-react";
import { VacancyTypeById } from "@/utils/types/vacancy.types";

const MapPicker = dynamic(
  () => import("@/components/application/teacher-form/MapPicker"),
  { ssr: false }
);

// Zod schema matching all updatable fields
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
  contact_number: z.string().min(1, "Contact number is required"),
  commission_charge: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
});

type EditVacancyFormValues = z.infer<typeof editVacancySchema>;

interface EditVacancyDialogProps {
  vacancy: VacancyTypeById;
  /** Called with form values. Can be async — dialog closes after it resolves. */
  onUpdate: (data: EditVacancyFormValues) => Promise<void> | void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      contact_number: vacancy.contact_number,
      commission_charge: vacancy.commission_charge,
    },
  });

  // Reset form when vacancy changes (e.g. after a successful update)
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
      // Dialog closes only after onUpdate resolves successfully
      onOpenChange(false);
    } catch {
      // onUpdate should handle its own error toasts; we just don't close
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vacancy Details</DialogTitle>
        </DialogHeader>

        <form id="edit-vacancy-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-4">
            {/* Title */}
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
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Location (text) */}
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
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Location hint */}
            <Controller
              name="location_hint"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-location-hint">
                    Location hint (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-location-hint"
                    placeholder="e.g., near City Centre"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Latitude and Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Map picker button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMapPicker(true)}
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Pick on map
            </Button>

            {showMapPicker && (
              <MapPicker
                initialLat={form.getValues("lat")}
                initialLon={form.getValues("lon")}
                onConfirm={handleMapConfirm}
                onClose={() => setShowMapPicker(false)}
              />
            )}

            {/* Grade */}
            <Controller
              name="grade"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-grade">Class / Grade</FieldLabel>
                  <Input {...field} id="edit-grade" placeholder="e.g., 10" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Time */}
            <Controller
              name="time"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-time">Time</FieldLabel>
                  <Input {...field} id="edit-time" placeholder="e.g., 5-7 PM" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Number of students */}
            <Controller
              name="no_of_students"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-students">Number of students</FieldLabel>
                  <Input
                    {...field}
                    id="edit-students"
                    type="number"
                    placeholder="1"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Subject */}
            <Controller
              name="subject"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-subject">Subject</FieldLabel>
                  <Input
                    {...field}
                    id="edit-subject"
                    placeholder="e.g., Mathematics"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Salary */}
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
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Salary note */}
            <Controller
              name="salary_note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-salary-note">
                    Salary note (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-salary-note"
                    placeholder="negotiable"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Gender preference */}
            <Controller
              name="gender"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Teacher gender preference</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-vacancy-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}