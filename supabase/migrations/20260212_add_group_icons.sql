-- Add icon_url column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Create storage bucket for group icons if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-icons', 'group-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for group icons bucket
CREATE POLICY "Anyone can view group icons" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'group-icons');

CREATE POLICY "Admins can upload group icons" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'group-icons' AND
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update group icons" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'group-icons' AND
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete group icons" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'group-icons' AND
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE is_admin = true
    )
  );
