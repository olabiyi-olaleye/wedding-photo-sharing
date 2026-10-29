-- Migration 007: Soft-delete support + security hardening
-- Safe to re-run: every step checks what exists before acting.

-- ─────────────────────────────────────────────────────────────
-- 1. Add deleted_at column to media table (no-op if already exists)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_media_not_deleted
  ON media(uploaded_at DESC)
  WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Fix the file_hash index — only if the column exists
--    (file_hash is optional; not all projects ran migration 006)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'media'
      AND column_name  = 'file_hash'
  ) THEN
    DROP INDEX IF EXISTS idx_media_file_hash;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename  = 'media'
        AND indexname  = 'idx_media_file_hash_active'
    ) THEN
      EXECUTE $idx$
        CREATE UNIQUE INDEX idx_media_file_hash_active
          ON media(file_hash)
          WHERE deleted_at IS NULL AND file_hash IS NOT NULL
      $idx$;
    END IF;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. One-time data fix: rename 'photo' → 'image' in media_type
-- ─────────────────────────────────────────────────────────────
UPDATE media SET media_type = 'image' WHERE media_type = 'photo';

-- ─────────────────────────────────────────────────────────────
-- 4. Fix broken admin_settings RLS — only if that table exists
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_settings'
  ) THEN
    DROP POLICY IF EXISTS "Prevent public access to admin_settings" ON admin_settings;
    DROP POLICY IF EXISTS "Allow authenticated admin access"        ON admin_settings;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename  = 'admin_settings'
        AND policyname = 'Deny all access to admin_settings'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Deny all access to admin_settings"
          ON admin_settings FOR ALL USING (false) WITH CHECK (false)
      $p$;
    END IF;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Lock down guest table read access — only if table exists
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guests'
  ) THEN
    DROP POLICY IF EXISTS "Allow public read guests" ON guests;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename  = 'guests'
        AND policyname = 'Deny public read guests'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Deny public read guests"
          ON guests FOR SELECT USING (false)
      $p$;
    END IF;
  END IF;
END $$;
