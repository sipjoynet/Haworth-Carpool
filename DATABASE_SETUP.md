# Haworth Carpool - Database Setup Guide

Complete guide to set up and connect your Haworth Carpool app to Supabase PostgreSQL.

## 📋 What's Been Set Up

✅ Supabase JavaScript client installed
✅ Database connection module created (`src/lib/supabase.js`)
✅ Complete database schema designed
✅ SQL migration file ready (`supabase/migrations/20260206_initial_schema.sql`)
✅ Helper functions for all database operations
✅ Environment variables configuration (`.env`)
✅ Test connection script

## 🚀 Quick Start

### Step 1: Get Your Supabase Anon Key

**IMPORTANT**: You must add your Supabase anon key before the database will work.

1. Go to https://app.supabase.com
2. Select your project (project ref: `hvrciaqjaqjewyskyrbg`)
3. Navigate to **Settings** → **API**
4. Copy the **anon** **public** key (the long string that starts with `eyJ...`)
5. Open the `.env` file in your project root
6. Replace `your-anon-key-here` with your actual anon key:

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Note**: Never use the `service_role` key in your frontend app!

### Step 2: Run the Database Migration

Choose one of these methods:

#### Option A: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `supabase/migrations/20260206_initial_schema.sql` from your project
5. Copy the entire file contents
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for "Success. No rows returned" message

#### Option B: PostgreSQL Command Line

If you have `psql` installed:

```bash
PGPASSWORD='!#/8CurD&%z6iPJ' psql \
  -h db.hvrciaqjaqjewyskyrbg.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f supabase/migrations/20260206_initial_schema.sql
```

### Step 3: Test the Connection

Run the test script:

```bash
npm run test:db
```

You should see:
```
🔍 Testing Supabase Connection...

Test 1: Basic Connection
✅ Supabase connected successfully
✅ Connection successful!

Test 2: Query Users Table
✅ Found 1 users
   Sample user: admin@haworth.com

Test 3: Query Groups Table
✅ Found 0 groups

Test 4: Query POIs Table
✅ Found 3 POIs
   Sample POI: Northern Valley Regional High School

✅ All tests complete!
```

If you see errors, check:
- ✓ Your `.env` file has the correct anon key
- ✓ The migration has been run successfully
- ✓ Your Supabase project is not paused

## 📊 Database Schema

Your database has 6 main tables:

1. **users** - User accounts (email, password, name, phone, address, admin status)
2. **groups** - Carpool groups/communities
3. **group_members** - Links users to groups
4. **pois** - Points of Interest (schools, destinations)
5. **children** - Child profiles linked to parents
6. **ride_requests** - Ride requests with status tracking

All tables have:
- Auto-incrementing IDs
- Timestamps (created_at, updated_at)
- Row Level Security (RLS) policies
- Proper indexes for performance

## 💻 Using the Database in Your App

### Import the Client

```javascript
import { supabase, db } from './lib/supabase';
```

### Example Operations

```javascript
// Get all users
const users = await db.getUsers();

// Find user by email
const user = await db.getUserByEmail('admin@haworth.com');

// Create a new user
const newUser = await db.createUser({
  email: 'test@example.com',
  password: 'password123', // Note: Use Supabase Auth in production!
  name: 'Test User',
  phone: '201-555-1234',
  home_address: '123 Main St, Haworth, NJ',
  is_approved: false,
  is_admin: false
});

// Update a user
const updated = await db.updateUser(newUser.id, {
  is_approved: true
});

// Get ride requests for a group
const rides = await db.getRideRequests({
  group_id: 1,
  status: 'open'
});

// Create a ride request
const ride = await db.createRideRequest({
  group_id: 1,
  requester_id: 2,
  passenger_type: 'parent',
  passenger_id: 2,
  direction: 'home_to_poi',
  poi_id: 1,
  ride_date: '2026-02-07',
  status: 'open'
});

// Update ride status
const acceptedRide = await db.updateRideRequest(ride.id, {
  status: 'accepted',
  accepter_id: 3,
  accepted_at: new Date().toISOString()
});
```

### Available Helper Functions

All in `db` object from `src/lib/supabase.js`:

**Users:**
- `getUsers()` - Get all users
- `getUserByEmail(email)` - Find user by email
- `createUser(userData)` - Create new user
- `updateUser(id, updates)` - Update user

**Groups:**
- `getGroups()` - Get all groups
- `createGroup(groupData)` - Create new group
- `updateGroup(id, updates)` - Update group

**Group Members:**
- `getGroupMembers(groupId)` - Get members of a group
- `addGroupMember(groupId, userId)` - Add user to group

**POIs:**
- `getPOIs()` - Get all POIs
- `createPOI(poiData)` - Create new POI
- `updatePOI(id, updates)` - Update POI

**Children:**
- `getChildrenByParent(parentId)` - Get children of a parent
- `createChild(childData)` - Create child
- `updateChild(id, updates)` - Update child
- `deleteChild(id)` - Delete child

**Ride Requests:**
- `getRideRequests(filters)` - Get rides with optional filters
- `createRideRequest(rideData)` - Create ride request
- `updateRideRequest(id, updates)` - Update ride request

## 🔄 Migrating from localStorage

Your app currently uses localStorage. Here's the migration strategy:

### Phase 1: Dual Mode (Recommended)

Create a database adapter that tries Supabase first, falls back to localStorage:

```javascript
const DatabaseAdapter = {
  async getUsers() {
    try {
      // Try Supabase first
      return await db.getUsers();
    } catch (error) {
      console.warn('Supabase failed, using localStorage:', error);
      // Fallback to localStorage
      const localDB = JSON.parse(localStorage.getItem('carpool_db') || '{}');
      return Object.values(localDB.users || {});
    }
  },
  // ... repeat for other operations
};
```

### Phase 2: Data Migration

Export localStorage data and import to Supabase:

```javascript
async function migrateData() {
  const localDB = JSON.parse(localStorage.getItem('carpool_db') || '{}');

  // Migrate users
  for (const user of Object.values(localDB.users || {})) {
    try {
      await db.createUser(user);
      console.log(`✅ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`Failed: ${user.email}`, error);
    }
  }

  // Migrate groups, POIs, children, rides...
}
```

### Phase 3: Full Supabase

Once all data is migrated and tested, remove localStorage code entirely.

## 🔒 Security Best Practices

### Current Setup
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Secure policies for data access
- ✅ Environment variables for credentials
- ✅ `.env` file excluded from git

### For Production
- ⚠️ **Replace password-based auth** with Supabase Auth:
  ```javascript
  const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'secure-password'
  });
  ```
- ⚠️ **Remove passwords from users table** after implementing Supabase Auth
- ⚠️ **Use service role key only in backend/server** code, never in frontend
- ✅ **Keep using anon key** in frontend (it respects RLS)

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

- Check `.env` file exists in project root
- Verify `VITE_SUPABASE_ANON_KEY` is set correctly
- Restart the dev server after changing `.env`

### "Supabase connection error"

- Verify your Supabase project is active (not paused)
- Check the project URL is correct
- Ensure anon key matches your project

### "Permission denied" errors

- RLS policies might be blocking access
- Temporarily disable RLS for testing in Supabase dashboard
- Check you're setting user context correctly

### Tables don't exist

- Run the migration SQL in Supabase dashboard
- Check for errors in the SQL Editor
- Verify you're connected to the right database

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Dashboard](https://app.supabase.com)

## ✅ Next Steps

1. [ ] Add your Supabase anon key to `.env`
2. [ ] Run the database migration
3. [ ] Test the connection with `npm run test:db`
4. [ ] Start using `db` helpers in your app
5. [ ] Gradually replace localStorage with Supabase
6. [ ] Implement Supabase Auth for production

---

**Questions?** Check `supabase/README.md` for detailed documentation on the schema and migration process.
