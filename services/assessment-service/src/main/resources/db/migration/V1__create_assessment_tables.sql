-- ============================================================
-- Assessment Schema — V1: quizzes, questions, choices, attempts, attempt_answers
-- ============================================================

-- 1. quizzes
CREATE TABLE assessment.quizzes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          UUID NOT NULL,  -- soft ref → course.courses
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    time_limit_minutes INTEGER,
    pass_score         DECIMAL(5,2) DEFAULT 50.00,
    max_attempts       INTEGER DEFAULT 1,
    is_published       BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. questions
CREATE TABLE assessment.questions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id    UUID NOT NULL REFERENCES assessment.quizzes(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    type       VARCHAR(20) DEFAULT 'SINGLE_CHOICE'
               CHECK (type IN ('SINGLE_CHOICE', 'TRUE_FALSE')),
    points     DECIMAL(5,2) DEFAULT 1.00,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. choices
CREATE TABLE assessment.choices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment.questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    is_correct  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0
);

-- 4. attempts
CREATE TABLE assessment.attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id      UUID NOT NULL REFERENCES assessment.quizzes(id),
    student_id   UUID NOT NULL,  -- soft ref → auth.users
    score        DECIMAL(5,2),
    max_score    DECIMAL(5,2),
    passed       BOOLEAN,
    started_at   TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- 5. attempt_answers
CREATE TABLE assessment.attempt_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES assessment.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment.questions(id),
    choice_id   UUID NOT NULL REFERENCES assessment.choices(id),
    is_correct  BOOLEAN,  -- snapshot at submit time
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- Indexes
CREATE INDEX idx_quizzes_course ON assessment.quizzes (course_id);
CREATE INDEX idx_questions_quiz ON assessment.questions (quiz_id);
CREATE INDEX idx_choices_question ON assessment.choices (question_id);
CREATE INDEX idx_attempts_quiz ON assessment.attempts (quiz_id);
CREATE INDEX idx_attempts_student ON assessment.attempts (student_id);
CREATE INDEX idx_answers_attempt ON assessment.attempt_answers (attempt_id);
CREATE INDEX idx_answers_question ON assessment.attempt_answers (question_id);
