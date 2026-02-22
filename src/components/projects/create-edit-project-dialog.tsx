"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ColorPicker } from "@/components/projects/color-picker";
import {
  projectSchema,
  PROJECT_COLORS,
  type Project,
  type ProjectFormValues,
} from "@/lib/validations/project";

interface CreateEditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSubmit: (values: ProjectFormValues) => Promise<{ success: boolean; error?: string }>;
}

export function CreateEditProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: CreateEditProjectDialogProps) {
  const isEditing = !!project;
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      color: PROJECT_COLORS[0].value,
    },
  });

  // Reset form when dialog opens/closes or when project changes
  useEffect(() => {
    if (open) {
      setServerError(null);
      if (project) {
        form.reset({
          name: project.name,
          color: project.color,
        });
      } else {
        form.reset({
          name: "",
          color: PROJECT_COLORS[0].value,
        });
      }
    }
  }, [open, project, form]);

  async function handleSubmit(values: ProjectFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit(values);
      if (result.success) {
        onOpenChange(false);
      } else if (result.error === "A project with this name already exists.") {
        // BUG-4: Show duplicate name error inline under the field, not as a banner
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
          <DialogTitle>{isEditing ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your project details below."
              : "Add a new project to start tracking time."}
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
                  <FormLabel>Project name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Side Project"
                      maxLength={50}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
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
                {isEditing ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
