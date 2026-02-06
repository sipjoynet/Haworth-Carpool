-- ============================================================================
-- Fix RLS Policies for Development
-- This migration updates RLS policies to allow access with the anon key
-- without requiring custom configuration parameters
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view approved users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert new users (signup)" ON users;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view active POIs" ON pois;
DROP POLICY IF EXISTS "Parents can view their children" ON children;
DROP POLICY IF EXISTS "Parents can insert their children" ON children;
DROP POLICY IF EXISTS "Parents can update their children" ON children;
DROP POLICY IF EXISTS "Parents can delete their children" ON children;
DROP POLICY IF EXISTS "Group members can view ride requests in their groups" ON ride_requests;
DROP POLICY IF EXISTS "Group members can create ride requests" ON ride_requests;
DROP POLICY IF EXISTS "Users can update their own ride requests" ON ride_requests;

-- ============================================================================
-- NEW PERMISSIVE POLICIES FOR DEVELOPMENT
-- These allow full access for testing. In production, implement proper auth.
-- ============================================================================

-- Users: Allow all operations
CREATE POLICY "Allow all users access"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Groups: Allow all operations
CREATE POLICY "Allow all groups access"
  ON groups FOR ALL
  USING (true)
  WITH CHECK (true);

-- Group Members: Allow all operations
CREATE POLICY "Allow all group_members access"
  ON group_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- POIs: Allow all operations
CREATE POLICY "Allow all pois access"
  ON pois FOR ALL
  USING (true)
  WITH CHECK (true);

-- Children: Allow all operations
CREATE POLICY "Allow all children access"
  ON children FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ride Requests: Allow all operations
CREATE POLICY "Allow all ride_requests access"
  ON ride_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NOTES
-- ============================================================================
-- These policies are PERMISSIVE and should only be used for development!
-- For production, you should:
-- 1. Implement Supabase Auth (supabase.auth.signUp / signIn)
-- 2. Use auth.uid() in policies instead of custom parameters
-- 3. Implement proper row-level security based on your requirements
-- ============================================================================
