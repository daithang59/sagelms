ALTER TABLE content.lessons
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE content.lessons
DROP CONSTRAINT IF EXISTS uq_lesson_order;

CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_order_active
ON content.lessons (course_id, sort_order)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_lessons_course_active
ON content.lessons (course_id, is_deleted, sort_order);
