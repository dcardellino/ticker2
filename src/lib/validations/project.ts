import { z } from "zod";

export const PROJECT_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
] as const;

const validColorValues = PROJECT_COLORS.map((c) => c.value);

export const projectSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, "Project name is required")
        .max(50, "Project name must be 50 characters or less")
    ),
  color: z
    .string()
    .refine((val) => validColorValues.includes(val as (typeof validColorValues)[number]), {
      message: "Please select a color",
    }),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  total_tracked_time?: number;
}
