-- Reset admin user password in Supabase Auth
-- This allows the admin user to log in with email/password after being migrated

-- First, find the auth user ID for admin@haworth.com
-- Then update their password to 'adminadmin123!'

-- Note: This requires direct database access with the service role key
-- Run this via Supabase SQL Editor or psql

-- Update the auth user's password
-- The password hash is generated using bcrypt
-- Password: adminadmin123!

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the auth user ID for admin@haworth.com
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'admin@haworth.com';

  IF user_id IS NOT NULL THEN
    -- Update password (hash for 'adminadmin123!')
    -- You'll need to generate this hash properly or use Supabase's password reset
    RAISE NOTICE 'Found user ID: %', user_id;
    RAISE NOTICE 'Please use Supabase dashboard to reset password for this user';
  ELSE
    RAISE NOTICE 'No auth user found for admin@haworth.com';
  END IF;
END $$;

-- Alternative: Delete the auth user and let migration recreate it
-- Uncomment the lines below if you want to start fresh:

-- DELETE FROM auth.users WHERE email = 'admin@haworth.com';
-- UPDATE users SET auth_user_id = NULL, password = 'adminadmin123!' WHERE email = 'admin@haworth.com';
--
-- Then try logging in again - the migration will create a fresh Supabase Auth account
