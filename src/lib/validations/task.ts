import { z } from "zod";

export const taskSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, "Task name is required")
        .max(100, "Task name must be 100 characters or less")
    ),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .transform((val) => val.trim())
    .optional()
    .default(""),
});

export type TaskFormValues = z.input<typeof taskSchema>;

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_tracked_time: number;
}
