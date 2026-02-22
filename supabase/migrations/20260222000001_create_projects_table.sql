-- Migration: Create projects table for PROJ-2
-- Run this in: Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────
-- 1. TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Enforce allowed color values (the 8 predefined colors from the UI)
  CONSTRAINT projects_color_check CHECK (
    color IN (
      '#ef4444', -- Red
      '#f97316', -- Orange
      '#eab308', -- Yellow
      '#22c55e', -- Green
      '#06b6d4', -- Cyan
      '#3b82f6', -- Blue
      '#8b5cf6', -- Purple
      '#ec4899'  -- Pink
    )
  ),

  -- Enforce name length (trim is handled by the app, but DB enforces max)
  CONSTRAINT projects_name_length CHECK (char_length(name) BETWEEN 1 AND 50)
);

-- ─────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own projects
CREATE POLICY "users_select_own_projects"
  ON public.projects
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: users can only create projects for themselves
CREATE POLICY "users_insert_own_projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: users can only edit their own projects
CREATE POLICY "users_update_own_projects"
  ON public.projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: users can only delete their own projects
CREATE POLICY "users_delete_own_projects"
  ON public.projects
  FOR DELETE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────

-- Performance: queries are always filtered by user_id
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON public.projects (user_id);

-- Enforce case-insensitive unique project names per user at the database level.
-- This prevents duplicates even if the app-level ilike check is bypassed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_id_name_lower
  ON public.projects (user_id, LOWER(name));
