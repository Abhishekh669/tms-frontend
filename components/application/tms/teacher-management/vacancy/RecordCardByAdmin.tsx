"use client";

// ─── Drop-in replacement for the RecordCard section in VacancyRecordsById.tsx

import { useState } from "react";
import {
  Award,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VacancyRecordType } from "@/utils/types/teacher.types";
import { toast } from "sonner";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {  deleteTeacherVacancyRecordsByIdByAdmin } from "@/utils/action/teacher/teacher.delete";
import UpdateVacancyRecordDialogByAdmin from "./UpdateVacancyRecordByAdmin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Record Card ──────────────────────────────────────────────────────────────

export function RecordCardByAdmin({
  record,
  onRefetch,
}: {
  record: VacancyRecordType;
  onRefetch: () => void;
}) {
  const markPct = record.full_marks > 0
    ? Math.round((record.student_mark / record.full_marks) * 100)
    : 0;

  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      // 1. Delete record from database first
      const res = await deleteTeacherVacancyRecordsByIdByAdmin(record.id);

      if (!res.success) {
        throw new Error(res.error || "Failed to delete record");
      }

      // 2. ONLY after successful DB deletion, delete image from storage
      if (record.image_link) {
        try {
          await removeMultipleImages([record.image_link]);
        } catch (imgErr) {
          console.error("Failed to delete image:", imgErr);
          // Don't throw here - record is already deleted
        }
      }

      toast.success("Record deleted successfully");

      // Close dialog AFTER successful deletion
      setDeleteOpen(false);

      // Refresh the list
      onRefetch();

    } catch (err: any) {
      toast.error(err?.message || "Failed to delete record");
      // Keep dialog open on error so user can try again
      // Do NOT close the dialog
    } finally {
      setDeleting(false);
    }
  };

  // Get grade letter based on percentage
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  };

  const grade = getGradeLetter(record.percentage);

  // Handle dialog close - only allow if not deleting
  const handleDialogClose = (open: boolean) => {
    if (!deleting) {
      setDeleteOpen(open);
    }
  };

  return (
    <>
      <UpdateVacancyRecordDialogByAdmin
        open={updateOpen}
        setOpen={setUpdateOpen}
        record={record}
        onSuccess={onRefetch}
      />

      <AlertDialog open={deleteOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent className="rounded-2xl w-[90vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              {deleting ? "Deleting..." : "Delete this record?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {deleting
                ? "Please wait while we delete the record and its image..."
                : "This will permanently delete the test record and its image. This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="rounded-xl h-9 text-sm"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              className="rounded-xl h-9 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Card with Grade */}
      <div className={cn(
        "group relative rounded-xl border bg-card shadow-sm transition-all overflow-hidden hover:shadow-md",
        record.is_passed ? "border-emerald-500/20" : "border-red-400/20"
      )}>
        <div className="flex items-start gap-3 p-3">
          {/* Right Side: Square Thumbnail */}
          {record.image_link ? (
            <a
              href={record.image_link}
              target="_blank"
              rel="noopener noreferrer"
              className="order-last flex-shrink-0"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted/30 ring-1 ring-border/50">
                <img
                  src={record.image_link}
                  alt="Result"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </div>
            </a>
          ) : (
            <div className="order-last flex-shrink-0 w-20 h-20 rounded-lg bg-muted/30 flex items-center justify-center ring-1 ring-border/50">
              <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
          )}

          {/* Left Side: Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Subject with Book Icon */}
                {record.subject && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[11px] font-semibold px-2 py-0.5">
                    <BookOpen className="w-3 h-3" />
                    {record.subject}
                  </span>
                )}

                {/* Grade Badge */}
                <div className={cn(
                  "inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-bold",
                  record.is_passed
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  {grade}
                </div>

                {/* Verified Badge */}
                {record.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 text-[10px] font-semibold px-1.5 py-0.5">
                    <Award className="w-2.5 h-2.5" />
                    Verified
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground -mt-1 -mr-1"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-32">
                  <DropdownMenuItem onClick={() => setUpdateOpen(true)} className="text-xs gap-2">
                    <Pencil className="w-3 h-3" /> Edit
                  </DropdownMenuItem>
                  {record.image_link && (
                    <DropdownMenuItem onClick={() => window.open(record.image_link, "_blank")} className="text-xs gap-2">
                      <ExternalLink className="w-3 h-3" /> View Image
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-xs gap-2 text-destructive">
                    <Trash2 className="w-3 h-3" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Score with larger font */}
            <div className="mb-2">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{record.student_mark}</span>
                  <span className="text-xs text-muted-foreground">/ {record.full_marks}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    record.is_passed ? "text-emerald-600" : "text-red-500"
                  )}>
                    {record.is_passed ? "✓ Passed" : "✗ Failed"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    record.is_passed ? "bg-emerald-500" : "bg-red-400"
                  )}
                  style={{ width: `${markPct}%` }}
                />
              </div>

              {/* Percentage and Pass Marks */}
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>📊 {record.percentage}%</span>
                <span>🎯 Pass: {record.pass_marks}</span>
              </div>
            </div>

            {/* Date Row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {fmt(record.submitted_date)}
              </span>
              <span>🕒 Added {fmt(record.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}