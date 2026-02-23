"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
import type { Task } from "@/lib/validations/task";

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onConfirm: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
}: DeleteTaskDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    try {
      const result = await onConfirm(task.id);
      if (result.success) {
        onOpenChange(false);
      }
      // On error, keep the dialog open so the user can retry
    } catch {
      // On unexpected error, keep the dialog open so the user can retry
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {task?.name ?? "this task"}
            </span>
            ? This will permanently remove the task and all associated time entries.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
