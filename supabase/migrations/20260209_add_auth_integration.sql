-- Add auth_user_id column to users table for Supabase Auth integration
-- This links user profiles to Supabase Auth users

-- Add auth_user_id column (nullable at first for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Make password nullable (OAuth users don't need passwords)
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;

-- Add unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key
ON users(auth_user_id);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx
ON users(email);

-- Optional: Add a check to ensure either password or auth_user_id is present
-- (Uncomment if you want to enforce this constraint)
-- ALTER TABLE users
-- ADD CONSTRAINT users_auth_check
-- CHECK (password IS NOT NULL OR auth_user_id IS NOT NULL);

-- Update RLS policies to work with auth_user_id
-- Allow users to read their own profile using auth_user_id
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (auth_user_id = auth.uid() OR email = auth.email());

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
