-- ============================================================
-- Challenge Schema - V1: challenges, questions, choices, attempts, answers
-- ============================================================

CREATE TABLE challenge.challenges (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE challenge.challenge_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenge.challenges(id) ON DELETE CASCADE,
    title        VARCHAR(255),
    prompt       TEXT NOT NULL,
    type         VARCHAR(20) NOT NULL DEFAULT 'MULTIPLE_CHOICE'
                 CHECK (type IN ('MULTIPLE_CHOICE', 'ESSAY')),
    media_type   VARCHAR(20) DEFAULT 'NONE'
                 CHECK (media_type IN ('NONE', 'IMAGE', 'VIDEO')),
    media_url    VARCHAR(1000),
    points       DECIMAL(5,2) DEFAULT 1.00,
    sort_order   INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge.challenge_choices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES challenge.challenge_questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    is_correct  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE challenge.challenge_attempts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id   UUID NOT NULL REFERENCES challenge.challenges(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL,
    score          DECIMAL(5,2),
    max_score      DECIMAL(5,2),
    passed         BOOLEAN,
    started_at     TIMESTAMPTZ DEFAULT NOW(),
    submitted_at   TIMESTAMPTZ
);

CREATE TABLE challenge.challenge_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES challenge.challenge_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES challenge.challenge_questions(id),
    choice_id   UUID REFERENCES challenge.challenge_choices(id),
    text_answer TEXT,
    file_name   VARCHAR(500),
    file_type   VARCHAR(200),
    file_size   BIGINT,
    file_url    VARCHAR(1000),
    is_correct  BOOLEAN,
    CONSTRAINT uq_challenge_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_challenges_instructor ON challenge.challenges (instructor_id);
CREATE INDEX idx_challenges_status ON challenge.challenges (status);
CREATE INDEX idx_challenge_questions_challenge ON challenge.challenge_questions (challenge_id);
CREATE INDEX idx_challenge_choices_question ON challenge.challenge_choices (question_id);
CREATE INDEX idx_challenge_attempts_challenge ON challenge.challenge_attempts (challenge_id);
CREATE INDEX idx_challenge_attempts_participant ON challenge.challenge_attempts (participant_id);
CREATE INDEX idx_challenge_answers_attempt ON challenge.challenge_answers (attempt_id);
