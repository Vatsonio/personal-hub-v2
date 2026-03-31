-- ─────────────────────────────────────────────
--  Personal Hub — initial schema
-- ─────────────────────────────────────────────

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT        UNIQUE NOT NULL,
  password_hash       TEXT,
  name                TEXT,
  avatar_url          TEXT,
  timezone            TEXT        NOT NULL DEFAULT 'UTC',
  role                TEXT        NOT NULL DEFAULT 'user',    -- 'user' | 'admin'
  status              TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'banned'
  storage_used_bytes  BIGINT      NOT NULL DEFAULT 0,
  storage_limit_bytes BIGINT      NOT NULL DEFAULT 1073741824, -- 1 GB
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved items
CREATE TABLE IF NOT EXISTS saved_items (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type     TEXT        NOT NULL DEFAULT 'text', -- 'text' | 'link' | 'file' | 'image' | 'voice'
  content          TEXT,
  title            TEXT,
  source_url       TEXT,
  file_size_bytes  BIGINT,
  tags             TEXT[]      NOT NULL DEFAULT '{}',
  reply_to         UUID        REFERENCES saved_items(id) ON DELETE SET NULL,
  is_pinned        BOOLEAN     NOT NULL DEFAULT false,
  is_favorite      BOOLEAN     NOT NULL DEFAULT false,
  metadata         JSONB       NOT NULL DEFAULT '{}',
  reminder_at      TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action         TEXT        NOT NULL,
  -- 'approve_user' | 'reject_user' | 'ban_user' | 'unban_user'
  -- 'change_role' | 'set_storage_limit' | 'create_invite' | 'delete_user'
  target_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  details        JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);

-- Rate limiting (DB-based, per IP)
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT        NOT NULL,
  attempts     INT         NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key)
);

-- ─── Indexes ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id   ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_deleted_at ON saved_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_status   ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id   ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- ─── Idempotent column additions (safe to re-run) ─────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS dismissed_announcement_ids UUID[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
