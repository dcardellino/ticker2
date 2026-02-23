import { z } from "zod";

export const startTimerSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
});

export const stopTimerSchema = z.object({
  entry_id: z.string().uuid("Invalid time entry ID"),
});

export const timeEntriesQuerySchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
});

export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ActiveTimerEntry {
  id: string;
  task_id: string;
  started_at: string;
  task_name: string;
  project_name: string;
  project_id: string;
}
