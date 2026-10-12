-- Invitations let owners and admins add teammates by email.
-- Only a hash of each invitation token is stored. The raw token lives in the email link.
CREATE TABLE IF NOT EXISTS invitations (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  token_hash   TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by   TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  last_sent_at TEXT NOT NULL,
  resent_count INTEGER NOT NULL DEFAULT 0,
  accepted_at  TEXT,
  accepted_by  TEXT REFERENCES members (id)
);

CREATE INDEX idx_invitations_email ON invitations (email);

-- At most one pending invitation per email address.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
  ON invitations (email)
  WHERE status = 'pending';
