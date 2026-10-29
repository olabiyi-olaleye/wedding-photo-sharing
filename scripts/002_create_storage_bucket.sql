-- Create storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to all files in the bucket
CREATE POLICY "Allow public read access to wedding photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'wedding-photos');

-- Allow anyone to upload files (for guest uploads without auth)
CREATE POLICY "Allow public upload to wedding photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wedding-photos');

-- Allow anyone to update their uploads
CREATE POLICY "Allow public update wedding photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'wedding-photos');
