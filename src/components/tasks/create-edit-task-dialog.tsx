"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  taskSchema,
  type Task,
  type TaskFormValues,
} from "@/lib/validations/task";

interface CreateEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (values: TaskFormValues) => Promise<{ success: boolean; error?: string }>;
}

export function CreateEditTaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
}: CreateEditTaskDialogProps) {
  const isEditing = !!task;
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when dialog opens/closes or when task changes
  useEffect(() => {
    if (open) {
      setServerError(null);
      if (task) {
        form.reset({
          name: task.name,
          description: task.description ?? "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
        });
      }
    }
  }, [open, task, form]);

  async function handleSubmit(values: TaskFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit(values);
      if (result.success) {
        onOpenChange(false);
      } else if (result.error === "A task with this name already exists in this project.") {
        // Show duplicate name error inline under the field
        form.setError("name", { message: result.error });
      } else {
        setServerError(result.error ?? "An error occurred.");
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your task details below."
              : "Create a new task for this project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Implement login page"
                      maxLength={100}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this task..."
                      maxLength={500}
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save changes" : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
