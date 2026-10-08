-- An append-only record of who changed what in the workspace.
CREATE TABLE IF NOT EXISTS audit_events (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES members (id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('member', 'invitation')),
  target_id   TEXT NOT NULL,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_target ON audit_events (target_type, target_id);
