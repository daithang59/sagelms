CREATE SCHEMA IF NOT EXISTS assessment;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE assessment.assessments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          UUID NOT NULL,
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    thumbnail_url      VARCHAR(1000),
    category           VARCHAR(120),
    status             VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    instructor_id      UUID NOT NULL,
    time_limit_minutes INTEGER,
    pass_score         DECIMAL(5,2) DEFAULT 50.00,
    max_attempts       INTEGER DEFAULT 1,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment.assessment_questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessment.assessments(id) ON DELETE CASCADE,
    title         VARCHAR(255),
    prompt        TEXT NOT NULL,
    type          VARCHAR(20) NOT NULL DEFAULT 'MULTIPLE_CHOICE'
                  CHECK (type IN ('MULTIPLE_CHOICE', 'ESSAY')),
    media_type    VARCHAR(20) DEFAULT 'NONE'
                  CHECK (media_type IN ('NONE', 'IMAGE', 'VIDEO')),
    media_url     VARCHAR(1000),
    points        DECIMAL(5,2) DEFAULT 1.00,
    sort_order    INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment.assessment_choices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment.assessment_questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    is_correct  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE assessment.assessment_attempts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id  UUID NOT NULL REFERENCES assessment.assessments(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL,
    score          DECIMAL(5,2),
    max_score      DECIMAL(5,2),
    passed         BOOLEAN,
    started_at     TIMESTAMPTZ DEFAULT NOW(),
    submitted_at   TIMESTAMPTZ
);

CREATE TABLE assessment.assessment_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES assessment.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment.assessment_questions(id),
    choice_id   UUID REFERENCES assessment.assessment_choices(id),
    text_answer TEXT,
    file_name   VARCHAR(500),
    file_type   VARCHAR(200),
    file_size   BIGINT,
    file_url    VARCHAR(1000),
    is_correct  BOOLEAN,
    CONSTRAINT uq_assessment_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_assessments_course ON assessment.assessments (course_id);
CREATE INDEX idx_assessments_instructor ON assessment.assessments (instructor_id);
CREATE INDEX idx_assessments_status ON assessment.assessments (status);
CREATE INDEX idx_assessment_questions_assessment ON assessment.assessment_questions (assessment_id);
CREATE INDEX idx_assessment_choices_question ON assessment.assessment_choices (question_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment.assessment_attempts (assessment_id);
CREATE INDEX idx_assessment_attempts_participant ON assessment.assessment_attempts (participant_id);
CREATE INDEX idx_assessment_answers_attempt ON assessment.assessment_answers (attempt_id);
