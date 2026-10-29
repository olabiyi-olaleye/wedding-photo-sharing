-- SaaS scaffold: add an events table to scope all data per wedding.
-- Today this table has one row. When multi-tenancy is needed, add rows and
-- wire event_id FK references into all queries and RLS policies.

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                       -- e.g. "Ada & Tunde's Wedding"
  slug        TEXT NOT NULL UNIQUE,                -- e.g. "demo-wedding"
  couple_names TEXT,
  wedding_date DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can read event metadata (name, date shown on gallery pages)
CREATE POLICY "Allow public read events" ON events
  FOR SELECT USING (true);

-- Only service role can mutate events
CREATE POLICY "Deny events insert" ON events FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny events update" ON events FOR UPDATE USING (false);
CREATE POLICY "Deny events delete" ON events FOR DELETE USING (false);

-- Add event_id to media (nullable so existing rows stay valid)
ALTER TABLE media ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_media_event_id ON media(event_id);

-- Add event_id to guests
ALTER TABLE guests ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);

-- Seed the single current event. Replace these values with real details.
-- Run ONCE after applying this migration; subsequent runs are safe (ON CONFLICT DO NOTHING).
INSERT INTO events (name, slug, couple_names, wedding_date)
VALUES ('Ada & Tunde''s Wedding', 'demo-wedding', 'Ada & Tunde', '2026-06-14')
ON CONFLICT (slug) DO NOTHING;

-- Backfill existing media and guests to the seeded event
-- (safe to run multiple times — only updates NULL rows)
UPDATE media
SET event_id = (SELECT id FROM events WHERE slug = 'demo-wedding' LIMIT 1)
WHERE event_id IS NULL;

UPDATE guests
SET event_id = (SELECT id FROM events WHERE slug = 'demo-wedding' LIMIT 1)
WHERE event_id IS NULL;
