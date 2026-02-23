-- Create time_entries table for PROJ-4: Timer & Time Tracking
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ended_at must be after started_at
  CONSTRAINT time_entries_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at),
  -- duration must be non-negative
  CONSTRAINT time_entries_duration_non_negative CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  -- ended_at and duration_seconds must both be null (running) or both be set (completed)
  CONSTRAINT time_entries_consistency CHECK (
    (ended_at IS NULL AND duration_seconds IS NULL) OR
    (ended_at IS NOT NULL AND duration_seconds IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own time entries
CREATE POLICY "Users can view their own time entries"
  ON time_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries"
  ON time_entries FOR DELETE
  USING (user_id = auth.uid());

-- Indexes for query performance
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
-- Partial index for fast active timer lookup (ended_at IS NULL means timer is running)
CREATE INDEX idx_time_entries_user_id_active ON time_entries(user_id) WHERE ended_at IS NULL;
-- For sorted history display
CREATE INDEX idx_time_entries_task_id_started_at ON time_entries(task_id, started_at DESC);
-- For aggregation queries (summing duration per task)
CREATE INDEX idx_time_entries_task_id_duration ON time_entries(task_id) WHERE duration_seconds IS NOT NULL;
