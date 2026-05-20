ALTER TABLE challenge.challenge_question_sets
    ADD COLUMN IF NOT EXISTS max_attempts INTEGER;
