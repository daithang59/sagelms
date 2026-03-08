-- ============================================================
-- Content Schema — V1: lessons
-- ============================================================

-- 1. lessons
CREATE TABLE content.lessons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL,  -- soft ref → course.courses (no FK cross-schema)
    title            VARCHAR(255) NOT NULL,
    type             VARCHAR(20) NOT NULL CHECK (type IN ('VIDEO', 'TEXT', 'PDF', 'LINK')),
    content_url      VARCHAR(500),
    text_content     TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    is_published     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_lesson_order UNIQUE (course_id, sort_order)
);

-- Indexes
CREATE INDEX idx_lessons_course ON content.lessons (course_id);
CREATE INDEX idx_lessons_published ON content.lessons (course_id, is_published, sort_order);
