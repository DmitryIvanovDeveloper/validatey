-- Create storage bucket for workspace icons (images).
-- The "responses" bucket is restricted to audio; workspace icons use this bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-icons', 'workspace-icons', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Allow authenticated users to upload workspace icons
DROP POLICY IF EXISTS "Workspace icons: allow authenticated upload" ON storage.objects;
CREATE POLICY "Workspace icons: allow authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'workspace-icons');

-- Public read for icons (bucket is public)
DROP POLICY IF EXISTS "Workspace icons: public read" ON storage.objects;
CREATE POLICY "Workspace icons: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'workspace-icons');
