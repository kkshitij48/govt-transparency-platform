-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Adds image support to complaints
-- ============================================================

-- 1. Add image_url column to complaints
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create storage bucket for complaint images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-images',
  'complaint-images',
  true,
  5242880,   -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: anyone authenticated can upload to their own folder
CREATE POLICY "Citizens can upload complaint images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'complaint-images');

-- 4. Public read access (images are viewable by officials/admins too)
CREATE POLICY "Complaint images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'complaint-images');

-- 5. Only the uploader can delete their own image
CREATE POLICY "Users can delete own complaint images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'complaint-images' AND auth.uid()::text = (storage.foldername(name))[1]);
