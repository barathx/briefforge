-- ============================================================
-- BriefForge — Database Migration 001
-- Run this in your Supabase SQL editor (project → SQL Editor)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM types ───────────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('admin', 'user');
CREATE TYPE brief_status   AS ENUM ('draft', 'processing', 'complete', 'error');
CREATE TYPE generation_type AS ENUM ('caption', 'ad_copy', 'hook', 'cta', 'concept');

-- ── users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── clients ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  industry   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── briefs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  raw_brief   TEXT NOT NULL,
  product     TEXT NOT NULL,
  audience    TEXT NOT NULL,
  goal        TEXT NOT NULL,
  key_message TEXT NOT NULL,
  tone        TEXT NOT NULL,
  platforms   JSONB NOT NULL DEFAULT '[]',
  deadline    DATE,
  brand_guidelines TEXT,
  status      brief_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── generations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id    UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  type        generation_type NOT NULL,
  platform    TEXT,                     -- NULL for global types (hooks, ctas, concepts)
  content     JSONB NOT NULL,           -- array of string variants
  model_used  TEXT,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_clients_user_id    ON clients(user_id);
CREATE INDEX idx_briefs_user_id     ON briefs(user_id);
CREATE INDEX idx_briefs_client_id   ON briefs(client_id);
CREATE INDEX idx_briefs_tone        ON briefs(tone);
CREATE INDEX idx_briefs_created_at  ON briefs(created_at DESC);
CREATE INDEX idx_generations_brief  ON generations(brief_id);

-- ── Row Level Security ────────────────────────────────────────────────────
-- NOTE: The Node.js backend uses the SERVICE ROLE key which bypasses RLS.
-- RLS is here as defence-in-depth if the anon key is ever used directly.

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- users: only the owner can see/edit their own row
CREATE POLICY users_self ON users
  USING (id = auth.uid());

-- clients: owner only
CREATE POLICY clients_owner ON clients
  USING (user_id = auth.uid());

-- briefs: owner only
CREATE POLICY briefs_owner ON briefs
  USING (user_id = auth.uid());

-- generations: owner via brief join
CREATE POLICY generations_owner ON generations
  USING (
    brief_id IN (
      SELECT id FROM briefs WHERE user_id = auth.uid()
    )
  );
