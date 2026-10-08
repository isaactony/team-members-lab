-- Members of a team workspace.
CREATE TABLE IF NOT EXISTS members (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at      TEXT NOT NULL,
  last_active_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_role ON members (role);
