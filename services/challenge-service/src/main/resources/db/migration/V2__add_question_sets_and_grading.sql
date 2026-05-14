-- ============================================================
-- Challenge Schema - V2: question sets and manual grading
-- ============================================================

CREATE TABLE challenge.challenge_question_sets (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id       UUID NOT NULL REFERENCES challenge.challenges(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    time_limit_minutes INTEGER,
    sort_order         INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO challenge.challenge_question_sets (challenge_id, title, time_limit_minutes, sort_order, created_at, updated_at)
SELECT c.id, 'Tap cau hoi mac dinh', c.time_limit_minutes, 0, NOW(), NOW()
FROM challenge.challenges c
WHERE NOT EXISTS (
    SELECT 1 FROM challenge.challenge_question_sets qs WHERE qs.challenge_id = c.id
);

ALTER TABLE challenge.challenge_questions
    ADD COLUMN question_set_id UUID;

UPDATE challenge.challenge_questions q
SET question_set_id = qs.id
FROM challenge.challenge_question_sets qs
WHERE qs.challenge_id = q.challenge_id
  AND qs.sort_order = 0;

ALTER TABLE challenge.challenge_questions
    ALTER COLUMN question_set_id SET NOT NULL,
    ADD CONSTRAINT fk_challenge_questions_question_set
        FOREIGN KEY (question_set_id)
        REFERENCES challenge.challenge_question_sets(id)
        ON DELETE CASCADE;

ALTER TABLE challenge.challenge_attempts
    ADD COLUMN question_set_id UUID,
    ADD COLUMN participant_email VARCHAR(255),
    ADD COLUMN grading_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (grading_status IN ('IN_PROGRESS', 'PENDING_REVIEW', 'GRADED')),
    ADD COLUMN graded_at TIMESTAMPTZ,
    ADD COLUMN graded_by UUID;

UPDATE challenge.challenge_attempts a
SET question_set_id = qs.id,
    grading_status = CASE WHEN a.submitted_at IS NULL THEN 'IN_PROGRESS' ELSE 'GRADED' END
FROM challenge.challenge_question_sets qs
WHERE qs.challenge_id = a.challenge_id
  AND qs.sort_order = 0;

ALTER TABLE challenge.challenge_attempts
    ALTER COLUMN question_set_id SET NOT NULL,
    ADD CONSTRAINT fk_challenge_attempts_question_set
        FOREIGN KEY (question_set_id)
        REFERENCES challenge.challenge_question_sets(id)
        ON DELETE CASCADE;

CREATE INDEX idx_challenge_question_sets_challenge ON challenge.challenge_question_sets (challenge_id);
CREATE INDEX idx_challenge_questions_question_set ON challenge.challenge_questions (question_set_id);
CREATE INDEX idx_challenge_attempts_question_set ON challenge.challenge_attempts (question_set_id);
CREATE INDEX idx_challenge_attempts_status ON challenge.challenge_attempts (grading_status);
