CREATE TABLE IF NOT EXISTS auth.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(40) NOT NULL CHECK (type IN (
        'ENROLLMENT_REQUESTED',
        'ENROLLMENT_APPROVED',
        'ENROLLMENT_REJECTED',
        'COURSE_ENROLLED',
        'SYSTEM'
    )),
    title       VARCHAR(255) NOT NULL,
    message     VARCHAR(1000),
    target_url  VARCHAR(500),
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON auth.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON auth.notifications (user_id)
    WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS auth.notification_preferences (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE,
    in_app_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    enrollment_requests  BOOLEAN NOT NULL DEFAULT TRUE,
    enrollment_results   BOOLEAN NOT NULL DEFAULT TRUE,
    course_updates       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);
