-- Migration 022: Scope file_hash uniqueness to (event_id, guest_token, file_hash).
--
-- The global UNIQUE on media.file_hash (006) plus the global partial index
-- idx_media_file_hash_active (007) blocked ANY re-occurrence of a hash across
-- all guests, events, and orgs. Because file_hash held a 64-bit perceptual
-- hash, visually similar photos from different guests collided and failed
-- inserts with 23505 — surfacing to guests as an opaque "Upload failed".
--
-- Duplicate blocking is a per-guest, per-event concern: the same guest
-- re-uploading the same file to the same event. This migration narrows the
-- constraint accordingly. The application is switching file_hash content from
-- the perceptual hash to SHA-256 of the file bytes (same VARCHAR(64) width);
-- existing perceptual-hash rows remain valid and cannot collide with new
-- SHA-256 values under the scoped index.

BEGIN;

-- Drop the global unique constraint from 006 (default constraint name).
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_file_hash_key;

-- Drop the global partial unique index from 007.
DROP INDEX IF EXISTS idx_media_file_hash_active;

-- Same guest + same event + same file content (active rows only) = duplicate.
-- Rows with NULL guest_token or NULL file_hash never conflict (NULLs are
-- distinct in unique indexes), which preserves legacy rows and non-hashed uploads.
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_event_guest_hash_active
  ON media(event_id, guest_token, file_hash)
  WHERE deleted_at IS NULL AND file_hash IS NOT NULL;

COMMIT;
