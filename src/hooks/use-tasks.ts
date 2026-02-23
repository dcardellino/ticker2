"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { taskSchema } from "@/lib/validations/task";
import type { Task, TaskFormValues } from "@/lib/validations/task";

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (values: TaskFormValues) => Promise<{ success: boolean; error?: string }>;
  updateTask: (id: string, values: TaskFormValues) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

// Escape special LIKE/ILIKE pattern characters so user input is treated literally
function escapeLike(str: string): string {
  return str.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// Client-side rate limiter: max 10 mutations per 60 seconds (sliding window)
// Note: true server-side rate limiting requires Supabase or middleware configuration
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function createRateLimiter() {
  const timestamps: number[] = [];
  return function isAllowed(): boolean {
    const now = Date.now();
    // Remove timestamps outside the sliding window
    while (timestamps.length > 0 && timestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
      timestamps.shift();
    }
    if (timestamps.length >= RATE_LIMIT_MAX) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
}

export function useTasks(projectId: string): UseTasksReturn {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const rateLimiterRef = useRef(createRateLimiter());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) {
        setError("Failed to load tasks. Please try again.");
        return;
      }

      // Fetch total tracked time for each task from time_entries
      const taskIds = (data ?? []).map((t) => t.id);
      let trackedTimeMap: Record<string, number> = {};

      if (taskIds.length > 0) {
        const { data: timeData } = await supabase
          .from("time_entries")
          .select("task_id, duration_seconds")
          .in("task_id", taskIds)
          .not("duration_seconds", "is", null)
          .limit(2000);

        if (timeData) {
          trackedTimeMap = timeData.reduce<Record<string, number>>(
            (acc, entry) => {
              acc[entry.task_id] = (acc[entry.task_id] ?? 0) + (entry.duration_seconds ?? 0);
              return acc;
            },
            {}
          );
        }
      }

      setTasks(
        (data ?? []).map((t) => ({
          ...t,
          total_tracked_time: trackedTimeMap[t.id] ?? 0,
        }))
      );
    } catch {
      setError("An unexpected error occurred while loading tasks.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (
    values: TaskFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    if (!rateLimiterRef.current()) {
      return { success: false, error: "Too many requests. Please wait a moment before trying again." };
    }
    try {
      const supabase = getSupabase();

      // Server-side Zod validation (defense in depth beyond form validation)
      const parsed = taskSchema.safeParse(values);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to create a task." };
      }

      // Case-insensitive duplicate check within the same project
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId)
        .ilike("name", escapeLike(parsed.data.name))
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "A task with this name already exists in this project." };
      }

      // Optimistic update - add temp entry immediately, revert on failure
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        project_id: projectId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tracked_time: 0,
      };
      setTasks((prev) => [tempTask, ...prev]);

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          name: parsed.data.name,
          description: parsed.data.description || null,
        })
        .select()
        .single();

      if (insertError) {
        // Revert optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        return { success: false, error: "Failed to create task. Please try again." };
      }

      // Replace temp entry with the real data from the server
      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...data, total_tracked_time: 0 } : t))
      );
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  const updateTask = async (
    id: string,
    values: TaskFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    if (!rateLimiterRef.current()) {
      return { success: false, error: "Too many requests. Please wait a moment before trying again." };
    }
    try {
      const supabase = getSupabase();

      // Server-side Zod validation
      const parsed = taskSchema.safeParse(values);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to edit a task." };
      }

      // Case-insensitive duplicate check excluding the current task
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId)
        .ilike("name", escapeLike(parsed.data.name))
        .neq("id", id)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "A task with this name already exists in this project." };
      }

      // Optimistic update - capture snapshot inside setter to avoid stale closure
      let prevTasks: Task[] = [];
      setTasks((prev) => {
        prevTasks = prev;
        return prev.map((t) =>
          t.id === id
            ? { ...t, name: parsed.data.name, description: parsed.data.description || null }
            : t
        );
      });

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update({
          name: parsed.data.name,
          description: parsed.data.description || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        // Revert optimistic update using the snapshot captured during the update
        setTasks(prevTasks);
        return { success: false, error: "Failed to update task. Please try again." };
      }

      // Confirm with real server data
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...data, total_tracked_time: t.total_tracked_time } : t
        )
      );
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  const deleteTask = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!rateLimiterRef.current()) {
      return { success: false, error: "Too many requests. Please wait a moment before trying again." };
    }
    try {
      const supabase = getSupabase();

      // Verify authentication before attempting delete
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to delete a task." };
      }

      const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);

      if (deleteError) {
        return { success: false, error: "Failed to delete task. Please try again." };
      }

      // Remove from local state immediately
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
