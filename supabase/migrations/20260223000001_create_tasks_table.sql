-- Migration: Create tasks table for PROJ-3
-- Run this in: Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────
-- 1. TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Enforce name length (trim is handled by the app, but DB enforces bounds)
  CONSTRAINT tasks_name_length CHECK (char_length(name) BETWEEN 1 AND 100),

  -- Enforce description length when present
  CONSTRAINT tasks_description_length CHECK (
    description IS NULL OR char_length(description) <= 500
  )
);

-- ─────────────────────────────────────────────
-- 2. AUTO-UPDATE updated_at ON CHANGE
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read tasks belonging to their own projects
CREATE POLICY "users_select_own_tasks"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = tasks.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- INSERT: users can only create tasks in their own projects
CREATE POLICY "users_insert_own_tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = tasks.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- UPDATE: users can only edit tasks in their own projects
CREATE POLICY "users_update_own_tasks"
  ON public.tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = tasks.project_id
        AND public.projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = tasks.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- DELETE: users can only delete tasks in their own projects
CREATE POLICY "users_delete_own_tasks"
  ON public.tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = tasks.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────

-- Performance: all task queries are filtered by project_id
CREATE INDEX IF NOT EXISTS idx_tasks_project_id
  ON public.tasks (project_id);

-- Performance: default sort is created_at DESC per project
CREATE INDEX IF NOT EXISTS idx_tasks_project_id_created_at
  ON public.tasks (project_id, created_at DESC);

-- Enforce case-insensitive unique task names per project at the database level.
-- This prevents duplicates even if the app-level ilike check is bypassed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_project_id_name_lower
  ON public.tasks (project_id, LOWER(name));
