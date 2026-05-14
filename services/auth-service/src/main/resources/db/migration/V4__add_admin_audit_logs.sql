CREATE TABLE IF NOT EXISTS auth.admin_audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action         VARCHAR(40) NOT NULL,
    reason         VARCHAR(1000),
    details        VARCHAR(2000),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON auth.admin_audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON auth.admin_audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON auth.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON auth.admin_audit_logs (created_at DESC);
