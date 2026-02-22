"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { projectSchema } from "@/lib/validations/project";
import type { Project, ProjectFormValues } from "@/lib/validations/project";

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (values: ProjectFormValues) => Promise<{ success: boolean; error?: string }>;
  updateProject: (id: string, values: ProjectFormValues) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

// Escape special LIKE/ILIKE pattern characters so user input is treated literally
function escapeLike(str: string): string {
  return str.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function useProjects(): UseProjectsReturn {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) {
        setError("Failed to load projects. Please try again.");
        return;
      }

      // Map projects with placeholder total_tracked_time (will be from time_entries in PROJ-4)
      setProjects(
        (data ?? []).map((p) => ({
          ...p,
          total_tracked_time: 0,
        }))
      );
    } catch {
      setError("An unexpected error occurred while loading projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (
    values: ProjectFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();

      // BUG-6: Server-side Zod validation (defense in depth beyond form validation)
      const parsed = projectSchema.safeParse(values);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to create a project." };
      }

      // BUG-2: Case-insensitive duplicate check with escaped LIKE wildcards
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", escapeLike(parsed.data.name))
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "A project with this name already exists." };
      }

      // BUG-3: True optimistic update – add temp entry immediately, revert on failure
      const tempId = `temp-${Date.now()}`;
      const tempProject: Project = {
        id: tempId,
        user_id: user.id,
        name: parsed.data.name,
        color: parsed.data.color,
        created_at: new Date().toISOString(),
        total_tracked_time: 0,
      };
      setProjects((prev) => [tempProject, ...prev]);

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: parsed.data.name,
          color: parsed.data.color,
        })
        .select()
        .single();

      if (insertError) {
        // Revert optimistic update
        setProjects((prev) => prev.filter((p) => p.id !== tempId));
        return { success: false, error: "Failed to create project. Please try again." };
      }

      // Replace temp entry with the real data from the server
      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? { ...data, total_tracked_time: 0 } : p))
      );
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  const updateProject = async (
    id: string,
    values: ProjectFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();

      // BUG-6: Server-side Zod validation (defense in depth beyond form validation)
      const parsed = projectSchema.safeParse(values);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to edit a project." };
      }

      // BUG-2: Case-insensitive duplicate check excluding the current project, with escaped wildcards
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", escapeLike(parsed.data.name))
        .neq("id", id)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "A project with this name already exists." };
      }

      // BUG-3: True optimistic update – snapshot state for rollback, update immediately
      const prevProjects = [...projects];
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name: parsed.data.name, color: parsed.data.color } : p
        )
      );

      const { data, error: updateError } = await supabase
        .from("projects")
        .update({
          name: parsed.data.name,
          color: parsed.data.color,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        // Revert optimistic update
        setProjects(prevProjects);
        return { success: false, error: "Failed to update project. Please try again." };
      }

      // Confirm with real server data
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...data, total_tracked_time: p.total_tracked_time } : p))
      );
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  const deleteProject = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();

      // BUG-5: Verify authentication before attempting delete
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to delete a project." };
      }

      const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);

      if (deleteError) {
        return { success: false, error: "Failed to delete project. Please try again." };
      }

      // Remove from local state immediately
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
