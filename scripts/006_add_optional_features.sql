-- Optional: Add file_hash column for duplicate detection
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64) UNIQUE;

-- Optional: Create guests table for RSVP tracking
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  rsvp_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Allow public read (for admin to see guest list)
CREATE POLICY "Allow public read guests" ON guests
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete guests (admin operations)
CREATE POLICY "Deny guests insert" ON guests
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny guests update" ON guests
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny guests delete" ON guests
  FOR DELETE
  USING (false);

-- Create index on file_hash for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_media_file_hash ON media(file_hash);

-- Create index on guests name for search
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(name);
