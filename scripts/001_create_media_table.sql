-- Create the media table for storing photo metadata
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE, -- For preventing duplicate uploads
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  guest_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_tag TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_media_guest_id ON media(guest_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_client_id ON media(client_id);

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read media (public gallery)
CREATE POLICY "Allow public read access" ON media
  FOR SELECT
  USING (true);

-- Allow anyone to insert media (guest uploads without auth)
CREATE POLICY "Allow public insert" ON media
  FOR INSERT
  WITH CHECK (true);

-- Create admin settings table for protected features
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Featured photos table
CREATE TABLE IF NOT EXISTS featured_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  featured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(media_id)
);

-- Enable RLS on featured_media
ALTER TABLE featured_media ENABLE ROW LEVEL SECURITY;

-- Allow public read for featured media
CREATE POLICY "Allow public read featured" ON featured_media
  FOR SELECT
  USING (true);
