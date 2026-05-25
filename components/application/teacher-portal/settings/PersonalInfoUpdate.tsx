"use client";

/**
 * TeacherProfileEdit — responsive (mobile card stack + desktop sidebar layout)
 *
 * Changes in this version:
 *  1. DocRow: clicking the thumbnail opens the image in a new tab.
 *  2. File selection only creates a local preview – upload occurs on "Update profile".
 *  3. Desktop sidebar is more polished – wider, better spacing, completion ring.
 *  4. Desktop main area uses a two-column form grid for Personal fields.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/utils/uploadthing/uploadthing.client";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import { GenderType, SafeTokenTeacherData, TeacherStatus } from "@/utils/types/teacher.types";

interface UpdatePayload {
  name: string;
  email: string;
  phone: string;
  gender: GenderType;
  location: string;
  locationHint: string;
  lat: number | null;
  long: number | null;
  cvLink: string;
  transcriptLink: string;
  additionLink: string | null;
}

async function dummyUpdateTeacher(
  _id: string,
  _payload: UpdatePayload
): Promise<{ success: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 1200));
  return { success: true };
}

const MapPicker = dynamic(
  () => import("@/components/application/teacher-form/MapPicker"),
  { ssr: false }
);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILE_LABEL = "2 MB";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/"))
    return "Only image files (JPG, PNG, WEBP) are accepted.";
  if (file.size > MAX_FILE_BYTES)
    return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is ${MAX_FILE_LABEL}.`;
  return null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusConfig(status: TeacherStatus) {
  switch (status) {
    case "on_duty":
      return {
        label: "Active",
        dotCls: "bg-green-500",
        pillCls:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50",
      };
    case "vacant":
      return {
        label: "Pending review",
        dotCls: "bg-amber-400",
        pillCls:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
      };
    default:
      return {
        label: String(status),
        dotCls: "bg-muted-foreground",
        pillCls: "bg-muted text-muted-foreground border-border/50",
      };
  }
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ cls = "w-3.5 h-3.5" }: { cls?: string }) {
  return (
    <svg className={cn(cls, "animate-spin")} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 dark:border-white/8 bg-card dark:bg-white/[0.03] overflow-hidden">
      <p className="px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border/40 dark:border-white/8">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────

function FieldRow({
  icon, label, value, type = "text", onChange, options, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  type?: "text" | "email" | "tel" | "select" | "textarea";
  onChange: (v: string) => void;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  const activate = () => {
    if (disabled) return;
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => e.key === "Enter" && activate()}
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 transition-colors duration-150 select-none",
        editing
          ? "bg-muted/40 dark:bg-white/5 cursor-default"
          : disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-muted/30 dark:hover:bg-white/[0.03] cursor-pointer active:bg-muted/50"
      )}
      aria-label={`Edit ${label}`}
    >
      <span className="mt-0.5 flex-shrink-0 w-4 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground mb-0.5">{label}</p>
        {!editing ? (
          <p className={cn("text-sm text-foreground dark:text-white", !value && "text-muted-foreground italic")}>
            {type === "select"
              ? (options?.find((o) => o.value === value)?.label ?? value ?? "—")
              : value || "—"}
          </p>
        ) : type === "select" ? (
          <select ref={inputRef as React.Ref<HTMLSelectElement>} value={value}
            onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} disabled={disabled}
            className="w-full bg-transparent text-sm text-foreground dark:text-white border-none outline-none focus:ring-0 py-0 pl-0 pr-4 appearance-none cursor-pointer font-[inherit]">
            {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === "textarea" ? (
          <textarea ref={inputRef as React.Ref<HTMLTextAreaElement>} value={value}
            onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} disabled={disabled}
            rows={2} className="w-full bg-transparent text-sm text-foreground dark:text-white border-none outline-none focus:ring-0 resize-none p-0 font-[inherit]" />
        ) : (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type={type} value={value}
            onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} disabled={disabled}
            className="w-full bg-transparent text-sm text-foreground dark:text-white border-none outline-none focus:ring-0 p-0 font-[inherit]" />
        )}
      </div>
      {!editing && !disabled && (
        <svg className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}

// ─── DocRow ───────────────────────────────────────────────────────────────────
// Clicking the thumbnail → opens image in new tab.
// File selection only creates a local preview – no upload yet.

function DocRow({
  icon, label, badge, badgeVariant = "ok", currentUrl, onSelect, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  badge: string;
  badgeVariant?: "ok" | "pending" | "optional";
  currentUrl?: string | null;
  onSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0"
      aria-label={label}
    >
      {/* Thumbnail — opens in new tab if URL exists, otherwise placeholder */}
      {currentUrl ? (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "rounded-xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-150",
            "hover:ring-2 hover:ring-blue-400/50 hover:ring-offset-1 cursor-pointer"
          )}
          style={{ width: 52, height: 52 }}
          aria-label={`Preview ${label} in new tab`}
        >
          <img
            src={currentUrl}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </a>
      ) : (
        <button
          type="button"
          onClick={handleSelectClick}
          disabled={disabled}
          className={cn(
            "rounded-xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-150",
            disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/60 cursor-pointer"
          )}
          style={{ width: 52, height: 52 }}
          aria-label={`Upload ${label}`}
        >
          <span className="text-muted-foreground">{icon}</span>
        </button>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground dark:text-white truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {currentUrl ? "Click image to open in new tab" : "No file — click to upload"}
        </p>
      </div>

      {/* Badge */}
      <span className={cn(
        "text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 border",
        badgeVariant === "ok" && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50",
        badgeVariant === "pending" && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
        badgeVariant === "optional" && "bg-muted text-muted-foreground border-border/50 dark:bg-white/5 dark:border-white/10"
      )}>
        {badge}
      </span>

      {/* Replace / Upload button */}
      <button
        type="button"
        onClick={handleSelectClick}
        title={currentUrl ? "Replace document" : "Upload document"}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 dark:border-white/10 bg-background dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label={currentUrl ? `Replace ${label}` : `Upload ${label}`}
      >
        {currentUrl ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

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
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  teacher: SafeTokenTeacherData;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeacherProfileEdit({ teacher }: Props) {
  const [name, setName]                   = useState(teacher.name);
  const [email, setEmail]                 = useState(teacher.email);
  const [phone, setPhone]                 = useState(teacher.phone);
  const [gender, setGender]               = useState<string>(teacher.gender);
  const [location, setLocation]           = useState(teacher.location);
  const [locationHint, setLocationHint]   = useState(teacher.location_hint);
  const [lat, setLat]                     = useState<number | null>(teacher.lat ?? null);
  const [lon, setLon]                     = useState<number | null>(teacher.long ?? null);

  // Display URLs: original server URL or local blob (if a new file is selected but not saved)
  const [displayCvUrl, setDisplayCvUrl]                 = useState(teacher.cv_link);
  const [displayTranscriptUrl, setDisplayTranscriptUrl] = useState(teacher.transcript_link);
  const [displayAdditionUrl, setDisplayAdditionUrl]     = useState<string | null>(teacher.addition_link ?? null);

  // Pending files (selected but not yet uploaded)
  const pendingCvFile         = useRef<File | null>(null);
  const pendingTranscriptFile = useRef<File | null>(null);
  const pendingAdditionFile   = useRef<File | null>(null);

  // Store original server URLs to revert on discard and to delete old files after successful save
  const origCvUrl         = useRef(teacher.cv_link);
  const origTranscriptUrl = useRef(teacher.transcript_link);
  const origAdditionUrl   = useRef<string | null>(teacher.addition_link ?? null);

  // Local preview URLs (blob) – must be revoked when no longer needed
  const previewCvUrl         = useRef<string | null>(null);
  const previewTranscriptUrl = useRef<string | null>(null);
  const previewAdditionUrl   = useRef<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showMap, setShowMap]   = useState(false);
  const [locating, setLocating] = useState(false);
  const [isDirty, setIsDirty]   = useState(false);

  const markDirty = () => setIsDirty(true);
  const hasDocPending = !!(pendingCvFile.current || pendingTranscriptFile.current || pendingAdditionFile.current);
  const showBar = isDirty || hasDocPending;

  const { startUpload } = useUploadThing("imageUploader");

  // Helper: create a local blob URL and update display
  const createLocalPreview = (
    file: File,
    setDisplay: (url: string) => void,
    previewRef: React.MutableRefObject<string | null>
  ) => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    const blobUrl = URL.createObjectURL(file);
    previewRef.current = blobUrl;
    setDisplay(blobUrl);
  };

  // File selection handler – no upload, only local preview
  const handleDocSelect = (
    file: File,
    setDisplay: (url: string) => void,
    pendingRef: React.MutableRefObject<File | null>,
    previewRef: React.MutableRefObject<string | null>
  ) => {
    const err = validateImageFile(file);
    if (err) {
      toast.error(err, { duration: 4000 });
      return;
    }
    // Revoke previous local preview if any
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    // Create new preview
    const blobUrl = URL.createObjectURL(file);
    previewRef.current = blobUrl;
    setDisplay(blobUrl);
    pendingRef.current = file;
    markDirty();
  };

  // Upload all pending files and return the new URLs (or null if none)
  const uploadPendingDocs = async (): Promise<{
    cv?: string;
    transcript?: string;
    addition?: string;
  }> => {
    const results: { cv?: string; transcript?: string; addition?: string } = {};
    const uploadPromises: Promise<void>[] = [];

    if (pendingCvFile.current) {
      const promise = (async () => {
        const res = await startUpload([pendingCvFile.current!]);
        if (!res?.length) throw new Error("CV upload failed");
        const url = res[0].ufsUrl || res[0].url;
        if (!url) throw new Error("Missing URL in CV upload");
        results.cv = url;
      })();
      uploadPromises.push(promise);
    }
    if (pendingTranscriptFile.current) {
      const promise = (async () => {
        const res = await startUpload([pendingTranscriptFile.current!]);
        if (!res?.length) throw new Error("Transcript upload failed");
        const url = res[0].ufsUrl || res[0].url;
        if (!url) throw new Error("Missing URL in transcript upload");
        results.transcript = url;
      })();
      uploadPromises.push(promise);
    }
    if (pendingAdditionFile.current) {
      const promise = (async () => {
        const res = await startUpload([pendingAdditionFile.current!]);
        if (!res?.length) throw new Error("Additional doc upload failed");
        const url = res[0].ufsUrl || res[0].url;
        if (!url) throw new Error("Missing URL in addition upload");
        results.addition = url;
      })();
      uploadPromises.push(promise);
    }

    if (uploadPromises.length) {
      await Promise.all(uploadPromises);
    }
    return results;
  };

  // Cleanup local preview URLs
  const revokeAllPreviews = () => {
    if (previewCvUrl.current) URL.revokeObjectURL(previewCvUrl.current);
    if (previewTranscriptUrl.current) URL.revokeObjectURL(previewTranscriptUrl.current);
    if (previewAdditionUrl.current) URL.revokeObjectURL(previewAdditionUrl.current);
    previewCvUrl.current = null;
    previewTranscriptUrl.current = null;
    previewAdditionUrl.current = null;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    let newCvUrl: string | undefined;
    let newTranscriptUrl: string | undefined;
    let newAdditionUrl: string | null | undefined;

    try {
      // 1. Upload all pending files
      const uploaded = await uploadPendingDocs();
      newCvUrl = uploaded.cv;
      newTranscriptUrl = uploaded.transcript;
      newAdditionUrl = uploaded.addition;

      // 2. Build payload: use new URLs if uploaded, otherwise keep current display URL (which may be original or already saved)
      // But note: display URL could be a blob URL for pending files – we must not send that.
      // For fields without pending file, we use the original server URL (origCvUrl.current etc.)
      const finalCvLink = newCvUrl ?? (pendingCvFile.current ? undefined : origCvUrl.current);
      const finalTranscriptLink = newTranscriptUrl ?? (pendingTranscriptFile.current ? undefined : origTranscriptUrl.current);
      const finalAdditionLink = newAdditionUrl ?? (pendingAdditionFile.current ? undefined : origAdditionUrl.current);

      // Safety: if a pending file existed but upload failed, finalLink would be undefined -> we throw earlier
      if ((pendingCvFile.current && !finalCvLink) ||
          (pendingTranscriptFile.current && !finalTranscriptLink) ||
          (pendingAdditionFile.current && finalAdditionLink === undefined)) {
        throw new Error("Upload incomplete");
      }

      const payload: UpdatePayload = {
        name, email, phone, gender: gender as GenderType,
        location, locationHint, lat, long: lon,
        cvLink: finalCvLink!,
        transcriptLink: finalTranscriptLink!,
        additionLink: finalAdditionLink ?? null,
      };

      // 3. Call API
      const res = await dummyUpdateTeacher(teacher.id, payload);
      if (!res.success) {
        // If API fails, delete any newly uploaded images to avoid orphans
        const toDelete = [newCvUrl, newTranscriptUrl, newAdditionUrl].filter(Boolean) as string[];
        if (toDelete.length) await removeMultipleImages(toDelete);
        throw new Error(res.error || "Update failed");
      }

      // 4. Success: delete old images that were replaced
      const oldToDelete: string[] = [];
      if (newCvUrl && origCvUrl.current) oldToDelete.push(origCvUrl.current);
      if (newTranscriptUrl && origTranscriptUrl.current) oldToDelete.push(origTranscriptUrl.current);
      if (newAdditionUrl && origAdditionUrl.current) oldToDelete.push(origAdditionUrl.current);
      if (oldToDelete.length) await removeMultipleImages(oldToDelete);

      // 5. Update refs and state
      if (newCvUrl) {
        origCvUrl.current = newCvUrl;
        setDisplayCvUrl(newCvUrl);
        pendingCvFile.current = null;
      }
      if (newTranscriptUrl) {
        origTranscriptUrl.current = newTranscriptUrl;
        setDisplayTranscriptUrl(newTranscriptUrl);
        pendingTranscriptFile.current = null;
      }
      if (newAdditionUrl) {
        origAdditionUrl.current = newAdditionUrl;
        setDisplayAdditionUrl(newAdditionUrl);
        pendingAdditionFile.current = null;
      }

      // Revoke all local previews (they are no longer needed)
      revokeAllPreviews();
      setIsDirty(false);
      toast.success("Profile updated successfully!");
    } catch (e: unknown) {
      // If anything failed, revert display URLs to original (in case they were showing blob)
      setDisplayCvUrl(origCvUrl.current);
      setDisplayTranscriptUrl(origTranscriptUrl.current);
      setDisplayAdditionUrl(origAdditionUrl.current);
      // Also revoke previews and clear pending
      revokeAllPreviews();
      pendingCvFile.current = null;
      pendingTranscriptFile.current = null;
      pendingAdditionFile.current = null;
      toast.error(e instanceof Error ? e.message : "Update failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    // Revoke all local previews
    revokeAllPreviews();

    // Reset form fields
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setGender(teacher.gender);
    setLocation(teacher.location);
    setLocationHint(teacher.location_hint);
    setLat(teacher.lat ?? null);
    setLon(teacher.long ?? null);
    setDisplayCvUrl(origCvUrl.current);
    setDisplayTranscriptUrl(origTranscriptUrl.current);
    setDisplayAdditionUrl(origAdditionUrl.current);

    // Clear pending files
    pendingCvFile.current = null;
    pendingTranscriptFile.current = null;
    pendingAdditionFile.current = null;

    setShowMap(false);
    setIsDirty(false);
    toast.info("Changes discarded.");
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      revokeAllPreviews();
    };
  }, []);

  const handleGps = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude); setLon(coords.longitude); markDirty();
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
          const data = await res.json();
          if (data.display_name) { setLocation(data.display_name); markDirty(); }
          toast.success("Location detected!");
        } catch { /* ignore */ }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1 ? "Location access denied. Enable GPS in Settings." : "Could not detect location. Try again.", { duration: 6000 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapConfirm = useCallback((newLat: number, newLon: number, address: string) => {
    setLat(newLat); setLon(newLon); setLocation(address);
    setShowMap(false); markDirty(); toast.success("Location pinned!");
  }, []);

  const field = <T extends string>(setter: (v: T) => void) =>
    (v: T) => { setter(v); markDirty(); };

  const sc = statusConfig(teacher.status);

  // Completion percentage for sidebar ring (based on actually saved documents, not pending)
  const totalDocs = 3;
  const savedDocs = [origCvUrl.current, origTranscriptUrl.current, origAdditionUrl.current].filter(Boolean).length;
  const docPct = Math.round((savedDocs / totalDocs) * 100);

  const icons = {
    person: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    email:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    phone:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    gender: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    pin:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    info:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    cv:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    transcript: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    addition: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  const RING_R = 28;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C - (docPct / 100) * RING_C;

  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0f1a] pb-16">

      {/* Sticky unsaved-changes bar (mobile) */}
      <div
        className={cn(
          "sticky top-0 z-30 overflow-hidden transition-all duration-200 lg:hidden",
          showBar ? "max-h-20" : "max-h-0"
        )}
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800/50 px-4 py-2.5">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Unsaved changes
          </span>
          <div className="flex gap-2">
            <button onClick={handleDiscard} disabled={isSaving}
              className="text-xs px-3 py-1.5 rounded-lg border border-border/60 dark:border-white/10 bg-background dark:bg-white/5 text-foreground dark:text-white disabled:opacity-50 hover:bg-muted transition-colors">
              Discard
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {isSaving ? <><Spinner /> Saving…</> : <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update profile
              </>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">

          {/* LEFT SIDEBAR — desktop only */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-6">

            {/* Profile identity card */}
            <div className="rounded-2xl border border-border/50 dark:border-white/8 bg-card dark:bg-white/[0.03] overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-indigo-500/10 dark:from-blue-600/30 dark:via-blue-500/10 dark:to-indigo-600/20 relative">
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(99,102,241,0.3) 0%, transparent 60%)" }} />
              </div>

              <div className="px-5 pb-5 -mt-10">
                <div className="relative w-20 h-20 mb-3">
                  <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/60 border-4 border-card dark:border-[#0a0f1a] flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{getInitials(name)}</span>
                  </div>
                  <span className={cn("absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-card dark:border-[#0a0f1a]", sc.dotCls)} />
                </div>

                <h1 className="text-base font-bold text-foreground dark:text-white leading-tight mb-0.5">{name}</h1>
                <p className="text-xs text-muted-foreground mb-3 truncate">{email}</p>

                <span className={cn("inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium border", sc.pillCls)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dotCls)} />
                  {sc.label}
                </span>
              </div>

              <div className="border-t border-border/40 dark:border-white/8 px-5 py-4 space-y-2.5">
                {[
                  { icon: icons.phone, val: phone || "—", label: "Phone" },
                  { icon: icons.pin,   val: location ? location.split(",")[0] : "—", label: "Location" },
                  { icon: icons.gender, val: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "—", label: "Gender" },
                ].map(({ icon, val, label: lbl }) => (
                  <div key={lbl} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-muted/50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{lbl}</p>
                      <p className="text-xs font-medium text-foreground dark:text-white truncate">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/40 dark:border-white/8 px-5 py-3 flex gap-4">
                {[
                  { label: "Joined",   value: fmtDate(teacher.created_at) },
                  { label: "Updated",  value: fmtDate(teacher.updated_at) },
                ].map(({ label: lbl, value }) => (
                  <div key={lbl}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{lbl}</p>
                    <p className="text-xs text-foreground dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents status card */}
            <div className="rounded-2xl border border-border/50 dark:border-white/8 bg-card dark:bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                  Documents
                </p>
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6"
                      className="text-border/30 dark:text-white/10" />
                    <circle cx="36" cy="36" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6"
                      strokeDasharray={RING_C} strokeDashoffset={ringOffset}
                      strokeLinecap="round" transform="rotate(-90 36 36)"
                      className={docPct === 100 ? "text-green-500" : "text-blue-500"}
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-semibold text-foreground dark:text-white">{docPct}%</span>
                </div>
              </div>

              {[
                { url: displayCvUrl,         label: "CV / Resume",         required: true, pending: !!pendingCvFile.current },
                { url: displayTranscriptUrl, label: "Class 12 Transcript", required: true, pending: !!pendingTranscriptFile.current },
                { url: displayAdditionUrl,   label: "Additional doc",      required: false, pending: !!pendingAdditionFile.current },
              ].map(({ url, label: lbl, required, pending }) => (
                <div key={lbl} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400/50 flex-shrink-0"
                      style={{ width: 36, height: 36 }}
                      aria-label={`Preview ${lbl} in new tab`}
                    >
                      <img src={url} alt={lbl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </a>
                  ) : (
                    <div className="rounded-lg border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/5 flex items-center justify-center flex-shrink-0"
                         style={{ width: 36, height: 36 }}>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground dark:text-white truncate">{lbl}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pending ? "Pending upload" : url ? "Uploaded ✓" : required ? "Missing — required" : "Not uploaded"}
                    </p>
                  </div>
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                    pending ? "bg-amber-400" : url ? "bg-green-500" : required ? "bg-red-400" : "bg-muted-foreground/30"
                  )} />
                </div>
              ))}
            </div>

            {/* Save / Discard — desktop inline */}
            {showBar && (
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/40 p-4 flex flex-col gap-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  You have unsaved changes
                </p>
                <div className="flex gap-2">
                  <button onClick={handleDiscard} disabled={isSaving}
                    className="flex-1 text-sm py-2 rounded-xl border border-border/60 dark:border-white/10 bg-background dark:bg-white/5 text-foreground dark:text-white disabled:opacity-50 hover:bg-muted transition-colors">
                    Discard
                  </button>
                  <button onClick={handleSave} disabled={isSaving}
                    className="flex-1 text-sm py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                    {isSaving ? <><Spinner /> Saving…</> : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* MAIN CONTENT */}
          <main className="space-y-5">

            {/* Mobile profile header */}
            <div className="flex items-center gap-4 px-1 lg:hidden">
              <div className="relative w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">{getInitials(name)}</span>
                <span className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", sc.dotCls)} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground dark:text-white truncate">{name}</h1>
                <span className={cn("inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border mt-1", sc.pillCls)}>
                  {sc.label}
                </span>
              </div>
            </div>

            {/* Desktop page heading */}
            <div className="hidden lg:block px-1 pb-1 border-b border-border/30 dark:border-white/8">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Edit profile</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Update your personal info, location and documents</p>
            </div>

            {/* Section 1: Personal */}
            <div className="rounded-2xl border border-border/50 dark:border-white/8 bg-card dark:bg-white/[0.03] overflow-hidden">
              <p className="px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-b border-border/40 dark:border-white/8">
                Personal information
              </p>
              <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-border/40">
                <div>
                  <FieldRow icon={icons.person} label="Full name"  value={name}   onChange={field(setName)}   disabled={isSaving} />
                  <FieldRow icon={icons.email}  label="Email"      value={email}  onChange={field(setEmail)}  disabled={isSaving} type="email" />
                </div>
                <div>
                  <FieldRow icon={icons.phone}  label="Phone"      value={phone}  onChange={field(setPhone)}  disabled={isSaving} type="tel" />
                  <FieldRow icon={icons.gender} label="Gender"     value={gender} onChange={field(setGender)} disabled={isSaving} type="select"
                    options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <Section title="Location">
              <div
                role="button" tabIndex={0}
                onClick={() => setShowMap((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowMap((v) => !v)}
                className="relative h-36 bg-emerald-50 dark:bg-emerald-950/20 border-b border-border/40 overflow-hidden cursor-pointer group"
                aria-label="Open map picker"
              >
                <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" preserveAspectRatio="none" viewBox="0 0 400 144">
                  {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 24} x2="400" y2={i * 24} stroke="#059669" strokeWidth="1" />)}
                  {Array.from({ length: 15 }).map((_, i) => <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="144" stroke="#059669" strokeWidth="1" />)}
                </svg>
                <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-30" preserveAspectRatio="none" viewBox="0 0 400 144">
                  <polyline points="0,72 80,62 160,90 240,58 320,80 400,54" fill="none" stroke="#059669" strokeWidth="3" />
                  <polyline points="120,0 110,144" fill="none" stroke="#059669" strokeWidth="2" />
                  <polyline points="270,0 255,144" fill="none" stroke="#059669" strokeWidth="2" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-150">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {lat && lon ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : showMap ? "Close map" : "Tap to pin location"}
                  </span>
                </div>
              </div>

              {showMap && (
                <div className="border-b border-border/40">
                  <MapPicker initialLat={lat ?? undefined} initialLon={lon ?? undefined}
                    onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />
                </div>
              )}

              <div className="flex gap-2 px-4 py-3 border-b border-border/40">
                {[
                  { label: "Latitude",  val: lat, set: setLat, ph: "27.7172" },
                  { label: "Longitude", val: lon, set: setLon, ph: "85.3240" },
                ].map(({ label: lbl, val, set, ph }) => (
                  <div key={lbl} className="flex-1 bg-muted/40 dark:bg-white/5 rounded-xl border border-border/40 dark:border-white/8 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{lbl}</p>
                    <input type="number" step="any" value={val ?? ""}
                      onChange={(e) => { const v = parseFloat(e.target.value); set(isNaN(v) ? null : v); markDirty(); }}
                      placeholder={ph} disabled={isSaving}
                      className="w-full bg-transparent text-sm text-foreground dark:text-white border-none outline-none focus:ring-0 font-mono p-0 disabled:opacity-50" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 px-4 py-3 border-b border-border/40">
                <button type="button" disabled={isSaving || locating} onClick={handleGps}
                  className="flex-1 h-10 rounded-xl border border-border/50 dark:border-white/10 bg-background dark:bg-white/5 text-foreground dark:text-white flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-muted/50 dark:hover:bg-white/10 transition-colors text-xs">
                  {locating ? <Spinner /> : icons.pin}
                  {locating ? "Locating…" : "My location"}
                </button>
                <button type="button" disabled={isSaving} onClick={() => setShowMap((v) => !v)}
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {showMap ? "Close map" : "Pick on map"}
                </button>
              </div>

              <FieldRow icon={icons.pin}  label="Area / locality" value={location}     onChange={field(setLocation)}     disabled={isSaving} />
              <FieldRow icon={icons.info} label="Location hint"   value={locationHint} onChange={field(setLocationHint)} disabled={isSaving} type="textarea" />
            </Section>

            {/* Section 3: Documents */}
            <Section title="Documents — click image to open in new tab · click ↑ to replace">
              <DocRow
                icon={icons.cv}
                label="CV / Resume"
                badge={pendingCvFile.current ? "Pending" : "Required"}
                badgeVariant={pendingCvFile.current ? "pending" : "ok"}
                currentUrl={displayCvUrl}
                disabled={isSaving}
                onSelect={(f) => handleDocSelect(f, setDisplayCvUrl, pendingCvFile, previewCvUrl)}
              />
              <DocRow
                icon={icons.transcript}
                label="Class 12 Transcript"
                badge={pendingTranscriptFile.current ? "Pending" : "Required"}
                badgeVariant={pendingTranscriptFile.current ? "pending" : "ok"}
                currentUrl={displayTranscriptUrl}
                disabled={isSaving}
                onSelect={(f) => handleDocSelect(f, setDisplayTranscriptUrl, pendingTranscriptFile, previewTranscriptUrl)}
              />
              <DocRow
                icon={icons.addition}
                label="Additional document"
                badge={pendingAdditionFile.current ? "Pending" : "Optional"}
                badgeVariant={pendingAdditionFile.current ? "pending" : "optional"}
                currentUrl={displayAdditionUrl}
                disabled={isSaving}
                onSelect={(f) => handleDocSelect(f, setDisplayAdditionUrl, pendingAdditionFile, previewAdditionUrl)}
              />

              <div className="px-4 py-3 flex items-start gap-2 bg-blue-50/60 dark:bg-blue-950/20 border-t border-border/40">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Click the thumbnail to open the document in a new browser tab. Select a file to preview it immediately – the upload happens only when you click <strong>Update profile</strong>.
                  Old files are deleted only after a successful save.
                </p>
              </div>
            </Section>

            {/* Mobile-only metadata */}
            <div className="grid grid-cols-2 gap-3 pb-4 lg:hidden">
              {[
                { label: "Joined",       value: fmtDate(teacher.created_at) },
                { label: "Last updated", value: fmtDate(teacher.updated_at) },
              ].map(({ label: lbl, value }) => (
                <div key={lbl} className="bg-card dark:bg-white/[0.03] border border-border/50 dark:border-white/8 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{lbl}</p>
                  <p className="text-sm text-foreground dark:text-white">{value}</p>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}