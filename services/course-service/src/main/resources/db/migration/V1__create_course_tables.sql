-- ============================================================
-- Course Schema — V1: courses + enrollments
-- ============================================================

-- 1. courses
CREATE TABLE course.courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    thumbnail_url   VARCHAR(500),
    instructor_id   UUID NOT NULL,  -- soft ref → auth.users (no FK cross-schema)
    status          VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    category        VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. enrollments
CREATE TABLE course.enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES course.courses(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL,  -- soft ref → auth.users (no FK cross-schema)
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status      VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),
    CONSTRAINT uq_enrollment UNIQUE (course_id, student_id)
);

-- Indexes
CREATE INDEX idx_courses_instructor ON course.courses (instructor_id);
CREATE INDEX idx_courses_status ON course.courses (status);
CREATE INDEX idx_enrollments_student ON course.enrollments (student_id);
CREATE INDEX idx_enrollments_course ON course.enrollments (course_id);