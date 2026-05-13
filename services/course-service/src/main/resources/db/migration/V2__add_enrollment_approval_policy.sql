ALTER TABLE course.courses
    ADD COLUMN IF NOT EXISTS enrollment_policy VARCHAR(30) NOT NULL DEFAULT 'OPEN';

ALTER TABLE course.courses
    DROP CONSTRAINT IF EXISTS courses_enrollment_policy_check;

ALTER TABLE course.courses
    ADD CONSTRAINT courses_enrollment_policy_check
        CHECK (enrollment_policy IN ('OPEN', 'APPROVAL_REQUIRED'));

ALTER TABLE course.enrollments
    DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE course.enrollments
    ADD CONSTRAINT enrollments_status_check
        CHECK (status IN ('PENDING', 'ACTIVE', 'DROPPED', 'COMPLETED', 'REJECTED'));

ALTER TABLE course.enrollments
    ADD COLUMN IF NOT EXISTS review_note VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID;

CREATE INDEX IF NOT EXISTS idx_courses_enrollment_policy
    ON course.courses (enrollment_policy);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
    ON course.enrollments (course_id, status);
