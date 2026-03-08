-- ============================================================
-- Progress Schema — V1: lesson_progress
-- ============================================================

-- 1. lesson_progress
CREATE TABLE progress.lesson_progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,    -- soft ref → auth.users
    lesson_id    UUID NOT NULL,    -- soft ref → content.lessons
    course_id    UUID NOT NULL,    -- soft ref → course.courses (denormalized)
    status       VARCHAR(20) DEFAULT 'NOT_STARTED'
                 CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_progress UNIQUE (user_id, lesson_id)
);

-- Indexes
CREATE INDEX idx_progress_user_course ON progress.lesson_progress (user_id, course_id);
CREATE INDEX idx_progress_course ON progress.lesson_progress (course_id);
CREATE INDEX idx_progress_lesson ON progress.lesson_progress (lesson_id);
