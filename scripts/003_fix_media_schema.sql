-- Drop existing media table and recreate with correct schema
DROP TABLE IF EXISTS featured_media;
DROP TABLE IF EXISTS media;

-- Create the media table with correct column names
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  uploaded_by TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_uploaded_at ON media(uploaded_at DESC);

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

-- Allow anyone to delete (for admin functionality)
CREATE POLICY "Allow public delete" ON media
  FOR DELETE
  USING (true);

-- Featured photos table
CREATE TABLE featured_media (
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
