ALTER TABLE auth.users
    ADD COLUMN instructor_approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED'
        CHECK (instructor_approval_status IN ('APPROVED', 'PENDING', 'REJECTED')),
    ADD COLUMN instructor_headline VARCHAR(255),
    ADD COLUMN instructor_bio VARCHAR(2000),
    ADD COLUMN instructor_expertise VARCHAR(500),
    ADD COLUMN instructor_website VARCHAR(500),
    ADD COLUMN instructor_years_experience INTEGER,
    ADD COLUMN instructor_application_note VARCHAR(2000),
    ADD COLUMN instructor_reviewed_at TIMESTAMPTZ;

CREATE INDEX idx_users_instructor_approval
    ON auth.users (role, instructor_approval_status);
