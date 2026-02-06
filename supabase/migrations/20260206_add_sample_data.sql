-- ============================================================================
-- Add Sample Data for Testing
-- This migration adds sample users, groups, children, and ride requests
-- ============================================================================

-- Add sample users
INSERT INTO users (email, password, name, phone, home_address, is_approved, is_admin)
VALUES
  ('sarah@email.com', 'pass123', 'Sarah Cohen', '201-555-0101', '45 Oak Ave, Haworth, NJ', true, false),
  ('michael@email.com', 'pass123', 'Michael Chen', '201-555-0102', '67 Maple Dr, Haworth, NJ', true, false),
  ('jessica@email.com', 'pass123', 'Jessica Williams', '201-555-0103', '89 Pine Ln, Haworth, NJ', true, false)
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for reference (we'll use them in subsequent inserts)
-- Note: Since we can't easily reference these in pure SQL without variables,
-- we'll just insert groups and then manually link them

-- Add sample groups
INSERT INTO groups (name, archived)
VALUES
  ('Israeli Scouts', false),
  ('Monday Night Tennis', false),
  ('School Carpool', false)
ON CONFLICT DO NOTHING;

-- We need to link users to groups, but since we can't use variables in this migration,
-- we'll create a more complex query using subqueries

-- Add group members (linking users to groups)
-- Group 1: Israeli Scouts - Sarah and Michael
INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id
FROM groups g
CROSS JOIN users u
WHERE g.name = 'Israeli Scouts'
  AND u.email IN ('sarah@email.com', 'michael@email.com')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Group 2: Monday Night Tennis - Sarah and Jessica
INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id
FROM groups g
CROSS JOIN users u
WHERE g.name = 'Monday Night Tennis'
  AND u.email IN ('sarah@email.com', 'jessica@email.com')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Group 3: School Carpool - Michael and Jessica
INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id
FROM groups g
CROSS JOIN users u
WHERE g.name = 'School Carpool'
  AND u.email IN ('michael@email.com', 'jessica@email.com')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Add sample children
INSERT INTO children (parent_id, name, phone)
SELECT u.id, 'Emma Cohen', '201-555-0201'
FROM users u WHERE u.email = 'sarah@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO children (parent_id, name, phone)
SELECT u.id, 'Noah Cohen', NULL
FROM users u WHERE u.email = 'sarah@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO children (parent_id, name, phone)
SELECT u.id, 'Olivia Chen', '201-555-0202'
FROM users u WHERE u.email = 'michael@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO children (parent_id, name, phone)
SELECT u.id, 'Liam Williams', '201-555-0203'
FROM users u WHERE u.email = 'jessica@email.com'
ON CONFLICT DO NOTHING;

-- Add additional POIs (matching the localStorage version)
INSERT INTO pois (name, address, archived)
VALUES
  ('Israeli Scouts Meeting Hall', '100 Scout Way, Haworth, NJ', false),
  ('Haworth Tennis Courts', '200 Tennis Rd, Haworth, NJ', false),
  ('Haworth School', '400 School Ave, Haworth, NJ', false)
ON CONFLICT DO NOTHING;

-- Add some sample ride requests
-- We'll add a few sample rides for today and tomorrow

-- Ride 1: Israeli Scouts group - Sarah requesting for Emma (child)
INSERT INTO ride_requests (group_id, requester_id, passenger_type, passenger_id, direction, poi_id, ride_date, status)
SELECT
  g.id,
  u.id,
  'child',
  c.id,
  'home_to_poi',
  p.id,
  CURRENT_DATE,
  'open'
FROM groups g
CROSS JOIN users u
CROSS JOIN children c
CROSS JOIN pois p
WHERE g.name = 'Israeli Scouts'
  AND u.email = 'sarah@email.com'
  AND c.name = 'Emma Cohen'
  AND p.name = 'Israeli Scouts Meeting Hall'
LIMIT 1;

-- Ride 2: Monday Night Tennis - Sarah as passenger (parent)
INSERT INTO ride_requests (group_id, requester_id, passenger_type, passenger_id, direction, poi_id, ride_date, status)
SELECT
  g.id,
  u.id,
  'parent',
  u.id,
  'home_to_poi',
  p.id,
  CURRENT_DATE,
  'open'
FROM groups g
CROSS JOIN users u
CROSS JOIN pois p
WHERE g.name = 'Monday Night Tennis'
  AND u.email = 'sarah@email.com'
  AND p.name = 'Haworth Tennis Courts'
LIMIT 1;

-- Ride 3: School Carpool - Michael requesting for Olivia (child)
INSERT INTO ride_requests (group_id, requester_id, passenger_type, passenger_id, direction, poi_id, ride_date, status)
SELECT
  g.id,
  u.id,
  'child',
  c.id,
  'home_to_poi',
  p.id,
  CURRENT_DATE,
  'open'
FROM groups g
CROSS JOIN users u
CROSS JOIN children c
CROSS JOIN pois p
WHERE g.name = 'School Carpool'
  AND u.email = 'michael@email.com'
  AND c.name = 'Olivia Chen'
  AND p.name = 'Haworth School'
LIMIT 1;

-- ============================================================================
-- VERIFICATION QUERIES (optional - comment out if not needed)
-- ============================================================================

-- Check what was created
-- SELECT 'Users:', COUNT(*) FROM users;
-- SELECT 'Groups:', COUNT(*) FROM groups;
-- SELECT 'Group Members:', COUNT(*) FROM group_members;
-- SELECT 'Children:', COUNT(*) FROM children;
-- SELECT 'POIs:', COUNT(*) FROM pois;
-- SELECT 'Ride Requests:', COUNT(*) FROM ride_requests;
