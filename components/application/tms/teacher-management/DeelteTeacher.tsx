"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  BriefcaseBusiness,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { deleteTeacherById } from "@/utils/action/teacher/teacher.delete";
import { Teacher } from "@/utils/types/teacher.types";
import UpdateTeacherData from "./UpdateTeacherData";
import { updateTeacherStatus } from "@/utils/action/teacher/teacher.put";
import { useQueryClient } from "@tanstack/react-query";
import { removeMultipleImages } from "@/utils/action/uploadthing/delete.image";
import { useRouter } from "next/navigation";

// ─── Actions Dropdown ─────────────────────────────────────────────────────────
export function ActionsDropdown({ teacher }: { teacher: Teacher }) {
  if (!teacher) return null;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<
    null | "vacant" | "on_duty"
  >(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setDeleting(true);

    try {
      if (teacher.addition_link) {
        await removeMultipleImages([
          teacher.cv_link,
          teacher.addition_link,
          teacher.transcript_link,
        ]);
      } else {
        await removeMultipleImages([
          teacher.cv_link,
          teacher.transcript_link,
        ]);
      }

      const res = await deleteTeacherById(teacher.id);

      if (!res.success) {
        throw new Error("Failed to delete teacher");
      }

      toast.success(res.message ?? "Teacher deleted successfully");

      setDeleteOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ["get-all-teachers"],
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (
    status: "vacant" | "on_duty"
  ) => {
    if (teacher.status === status) return;

    setStatusUpdating(status);

    try {
      const res = await updateTeacherStatus({
        id: teacher.id,
        status,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to update status");
      }

      toast.success(res.message ?? "Status updated");

      await queryClient.invalidateQueries({
        queryKey: ["get-all-teachers"],
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <>
      {/* ── Edit Dialog ── */}
      <UpdateTeacherData
        teacher={teacher}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* ── Delete Alert Dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border border-border max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Delete Teacher
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {teacher.name}
              </span>
              ? This action cannot be undone and will permanently remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="rounded-xl h-9 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Teacher
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dropdown ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem
            className="gap-2 text-xs cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Teacher
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 text-xs cursor-pointer"
            onClick={() =>
              router.push(
                `/teacher-management/vacancies?teacherId=${teacher.id}`
              )
            }
          >
            <BriefcaseBusiness className="w-3.5 h-3.5" />
            Vacancies
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {teacher.status === "vacant" ? (
            <DropdownMenuItem
              className="gap-2 text-xs cursor-pointer"
              disabled={statusUpdating !== null}
              onClick={() => handleStatusChange("on_duty")}
            >
              {statusUpdating === "on_duty" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}

              Set On Duty
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="gap-2 text-xs cursor-pointer"
              disabled={statusUpdating !== null}
              onClick={() => handleStatusChange("vacant")}
            >
              {statusUpdating === "vacant" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}

              Set Vacant
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Teacher
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}