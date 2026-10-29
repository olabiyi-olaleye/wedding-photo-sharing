-- Add guest_tag column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS guest_tag text;

-- Create index for guest_tag
CREATE INDEX IF NOT EXISTS idx_media_guest_tag ON media(guest_tag);
