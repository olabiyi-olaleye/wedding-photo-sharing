-- Admin audit log: records every destructive or privileged admin action.
-- Non-fatal: the app writes here opportunistically; missing table = silent skip.

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action     TEXT NOT NULL,              -- e.g. 'admin_delete', 'add_featured', 'remove_featured'
  media_id   UUID,                       -- nullable — not all actions target a media row
  metadata   JSONB,                      -- arbitrary action details (uploaded_by, file_url, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read or write audit logs
CREATE POLICY "Deny public read audit_logs"   ON audit_logs FOR SELECT USING (false);
CREATE POLICY "Deny public insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public delete audit_logs" ON audit_logs FOR DELETE USING (false);
