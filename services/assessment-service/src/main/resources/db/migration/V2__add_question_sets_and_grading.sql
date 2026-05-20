CREATE TABLE assessment.assessment_question_sets (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id      UUID NOT NULL REFERENCES assessment.assessments(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    time_limit_minutes INTEGER,
    sort_order         INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assessment.assessment_questions
    ADD COLUMN question_set_id UUID;

ALTER TABLE assessment.assessment_questions
    ALTER COLUMN question_set_id SET NOT NULL,
    ADD CONSTRAINT fk_assessment_questions_question_set
        FOREIGN KEY (question_set_id)
        REFERENCES assessment.assessment_question_sets(id)
        ON DELETE CASCADE;

ALTER TABLE assessment.assessment_attempts
    ADD COLUMN question_set_id UUID,
    ADD COLUMN participant_email VARCHAR(255),
    ADD COLUMN grading_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (grading_status IN ('IN_PROGRESS', 'PENDING_REVIEW', 'GRADED')),
    ADD COLUMN graded_at TIMESTAMPTZ,
    ADD COLUMN graded_by UUID,
    ADD COLUMN used_seconds BIGINT;

ALTER TABLE assessment.assessment_attempts
    ALTER COLUMN question_set_id SET NOT NULL,
    ADD CONSTRAINT fk_assessment_attempts_question_set
        FOREIGN KEY (question_set_id)
        REFERENCES assessment.assessment_question_sets(id)
        ON DELETE CASCADE;

CREATE INDEX idx_assessment_question_sets_assessment ON assessment.assessment_question_sets (assessment_id);
CREATE INDEX idx_assessment_questions_question_set ON assessment.assessment_questions (question_set_id);
CREATE INDEX idx_assessment_attempts_question_set ON assessment.assessment_attempts (question_set_id);
CREATE INDEX idx_assessment_attempts_status ON assessment.assessment_attempts (grading_status);
