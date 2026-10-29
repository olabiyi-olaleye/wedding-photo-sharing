-- Fix RLS policies for media table
-- Remove the insecure public delete policy and add proper admin-only policy

-- Drop the insecure "Allow public delete" policy
DROP POLICY IF EXISTS "Allow public delete" ON media;

-- Create a policy that only allows deletion via service role (admin API)
-- Regular users cannot delete at all through the anon client
CREATE POLICY "Deny all delete" ON media
  FOR DELETE
  USING (false);

-- Update featured_media table policies for consistency
DROP POLICY IF EXISTS "Allow public read featured" ON featured_media;

CREATE POLICY "Allow public read featured" ON featured_media
  FOR SELECT
  USING (true);

-- Only service role can insert/delete featured media (admin operations)
CREATE POLICY "Deny featured insert" ON featured_media
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny featured delete" ON featured_media
  FOR DELETE
  USING (false);
