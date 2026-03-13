-- ============================================================
-- Content Schema — V2: Add instructor_id to lessons for ownership tracking
-- ============================================================

-- Add instructor_id column to track who created the lesson
ALTER TABLE content.lessons
ADD COLUMN IF NOT EXISTS instructor_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_instructor ON content.lessons (instructor_id);
