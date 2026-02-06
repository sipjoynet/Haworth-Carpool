-- ============================================================================
-- Haworth Carpool Database Schema
-- Initial Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Note: In production, use proper auth (Supabase Auth)
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  home_address TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_approved ON users(is_approved);

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_groups_archived ON groups(archived);

-- ============================================================================
-- GROUP_MEMBERS TABLE (Junction table for users and groups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- ============================================================================
-- POIS TABLE (Points of Interest - destinations like schools, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pois (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pois_archived ON pois(archived);

-- ============================================================================
-- CHILDREN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_children_parent_id ON children(parent_id);

-- ============================================================================
-- RIDE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ride_requests (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passenger_type VARCHAR(20) NOT NULL CHECK (passenger_type IN ('parent', 'child')),
  passenger_id INTEGER NOT NULL, -- References either users.id or children.id
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('home_to_poi', 'poi_to_home')),
  poi_id INTEGER NOT NULL REFERENCES pois(id) ON DELETE RESTRICT,
  ride_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'completed', 'cancelled')),
  accepter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ride_requests_group_id ON ride_requests(group_id);
CREATE INDEX idx_ride_requests_requester_id ON ride_requests(requester_id);
CREATE INDEX idx_ride_requests_accepter_id ON ride_requests(accepter_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_ride_date ON ride_requests(ride_date);
CREATE INDEX idx_ride_requests_poi_id ON ride_requests(poi_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for pois
CREATE TRIGGER update_pois_updated_at
  BEFORE UPDATE ON pois
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for children
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ride_requests
CREATE TRIGGER update_ride_requests_updated_at
  BEFORE UPDATE ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Insert default admin user
INSERT INTO users (email, password, name, phone, home_address, is_approved, is_admin)
VALUES
  ('admin@haworth.com', 'admin123', 'Admin User', '201-555-0100', '123 Main St, Haworth, NJ', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert some sample POIs
INSERT INTO pois (name, address)
VALUES
  ('Northern Valley Regional High School', '100 Demarest Ave, Demarest, NJ 07627'),
  ('Haworth Public School', '205 Valley Rd, Haworth, NJ 07641'),
  ('Community Center', '300 Haworth Ave, Haworth, NJ 07641')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Users: Can read all approved users, update only their own profile
CREATE POLICY "Users can view approved users"
  ON users FOR SELECT
  USING (is_approved = true OR id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Anyone can insert new users (signup)"
  ON users FOR INSERT
  WITH CHECK (true);

-- Groups: Members can view their groups
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = current_setting('app.current_user_id')::INTEGER
    )
  );

-- Group Members: Can view members of their groups
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = current_setting('app.current_user_id')::INTEGER
    )
  );

-- POIs: Everyone can view non-archived POIs
CREATE POLICY "Users can view active POIs"
  ON pois FOR SELECT
  USING (archived = false OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('app.current_user_id')::INTEGER
    AND users.is_admin = true
  ));

-- Children: Parents can manage their own children
CREATE POLICY "Parents can view their children"
  ON children FOR SELECT
  USING (parent_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Parents can insert their children"
  ON children FOR INSERT
  WITH CHECK (parent_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Parents can update their children"
  ON children FOR UPDATE
  USING (parent_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Parents can delete their children"
  ON children FOR DELETE
  USING (parent_id = current_setting('app.current_user_id')::INTEGER);

-- Ride Requests: Group members can view rides in their groups
CREATE POLICY "Group members can view ride requests in their groups"
  ON ride_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = ride_requests.group_id
      AND group_members.user_id = current_setting('app.current_user_id')::INTEGER
    )
  );

CREATE POLICY "Group members can create ride requests"
  ON ride_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = ride_requests.group_id
      AND group_members.user_id = current_setting('app.current_user_id')::INTEGER
    )
    AND requester_id = current_setting('app.current_user_id')::INTEGER
  );

CREATE POLICY "Users can update their own ride requests"
  ON ride_requests FOR UPDATE
  USING (
    requester_id = current_setting('app.current_user_id')::INTEGER
    OR accepter_id = current_setting('app.current_user_id')::INTEGER
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts for the carpool application';
COMMENT ON TABLE groups IS 'Carpool groups (communities, neighborhoods, etc.)';
COMMENT ON TABLE group_members IS 'Junction table linking users to groups';
COMMENT ON TABLE pois IS 'Points of Interest - destinations like schools';
COMMENT ON TABLE children IS 'Children associated with parent users';
COMMENT ON TABLE ride_requests IS 'Ride requests created by group members';

COMMENT ON COLUMN ride_requests.passenger_type IS 'Either ''parent'' or ''child''';
COMMENT ON COLUMN ride_requests.direction IS 'Either ''home_to_poi'' or ''poi_to_home''';
COMMENT ON COLUMN ride_requests.status IS 'Ride status: open, accepted, completed, or cancelled';
