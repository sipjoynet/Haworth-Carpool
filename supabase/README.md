# Haworth Carpool - Supabase Database Setup

This directory contains the database schema and migration files for the Haworth Carpool application.

## Prerequisites

- Supabase project created (you already have one)
- PostgreSQL client installed (psql)
- Node.js and npm installed

## Environment Setup

### 1. Get Your Supabase Anon Key

You need to add your Supabase anon key to the `.env` file:

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the **anon** **public** key (NOT the service_role key)
4. Update the `.env` file in the project root:

```env
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 2. Verify Database Connection

Your database connection details are already in the `.env` file:

```env
DATABASE_URL=postgresql://postgres:!#/8CurD&%z6iPJ@db.hvrciaqjaqjewyskyrbg.supabase.co:5432/postgres
```

## Running the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `migrations/20260206_initial_schema.sql`
5. Click **Run** or press `Ctrl/Cmd + Enter`

### Option 2: Using psql Command Line

If you have psql installed and the connection is working:

```bash
# From the project root directory
PGPASSWORD='!#/8CurD&%z6iPJ' psql -h db.hvrciaqjaqjewyskyrbg.supabase.co -U postgres -d postgres -p 5432 -f supabase/migrations/20260206_initial_schema.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref hvrciaqjaqjewyskyrbg

# Push migration
supabase db push
```

## Database Schema Overview

### Tables

1. **users** - User accounts with authentication and profile information
   - email, password, name, phone, home_address
   - is_approved, is_admin flags
   - Auto-updating timestamps

2. **groups** - Carpool groups/communities
   - name, archived status
   - Auto-updating timestamps

3. **group_members** - Junction table for user-group relationships
   - Links users to groups
   - Tracks when members joined

4. **pois** (Points of Interest) - Destinations like schools
   - name, address
   - archived status for soft deletes

5. **children** - Child profiles linked to parent users
   - parent_id (references users)
   - name, phone

6. **ride_requests** - Carpool ride requests
   - group_id, requester_id, passenger info
   - direction (home_to_poi or poi_to_home)
   - status (open, accepted, completed, cancelled)
   - accepter_id when someone accepts the ride
   - Timestamps for all status changes

### Key Features

- **Row Level Security (RLS)**: Enabled on all tables with appropriate policies
- **Automatic Timestamps**: created_at and updated_at managed by triggers
- **Foreign Key Constraints**: Maintain data integrity
- **Indexes**: Optimized for common queries
- **Soft Deletes**: archived flags instead of hard deletes for groups and POIs

## Using the Database in Your App

### Import the Supabase Client

```javascript
import { supabase, db, testConnection } from './lib/supabase';
```

### Test the Connection

```javascript
// Test if the database is accessible
const result = await testConnection();
if (result.success) {
  console.log('✅ Connected to Supabase!');
} else {
  console.error('❌ Connection failed:', result.error);
}
```

### Using the Database Helpers

```javascript
// Get all users
const users = await db.getUsers();

// Get user by email
const user = await db.getUserByEmail('admin@haworth.com');

// Create a new user
const newUser = await db.createUser({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '201-555-0000',
  home_address: '123 Main St'
});

// Get ride requests for a group
const rides = await db.getRideRequests({ group_id: 1 });

// Create a ride request
const ride = await db.createRideRequest({
  group_id: 1,
  requester_id: 2,
  passenger_type: 'parent',
  passenger_id: 2,
  direction: 'home_to_poi',
  poi_id: 1,
  ride_date: '2026-02-07'
});
```

### Direct Supabase Queries

For more complex queries, use the Supabase client directly:

```javascript
const { data, error } = await supabase
  .from('ride_requests')
  .select(`
    *,
    requester:users!ride_requests_requester_id_fkey(name, email),
    poi:pois(name, address)
  `)
  .eq('group_id', 1)
  .eq('status', 'open')
  .gte('ride_date', new Date().toISOString().split('T')[0]);

if (error) {
  console.error('Query error:', error);
} else {
  console.log('Rides:', data);
}
```

## Migrating from localStorage

Your app currently uses localStorage. Here's how to migrate:

1. **Keep localStorage as Fallback**: Update your DB object in App.jsx to try Supabase first, fallback to localStorage
2. **Gradual Migration**: Test each table migration independently
3. **Data Export**: Export existing localStorage data and import into Supabase

Example migration helper:

```javascript
async function migrateLocalStorageToSupabase() {
  const localDB = JSON.parse(localStorage.getItem('carpool_db') || '{}');

  // Migrate users
  for (const user of Object.values(localDB.users || {})) {
    try {
      await db.createUser(user);
      console.log(`✅ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error);
    }
  }

  // Repeat for other tables...
}
```

## Security Notes

- ⚠️ **Never commit** `.env` file to git (it's already in `.gitignore`)
- ⚠️ The current schema stores passwords in plain text - for production, use **Supabase Auth** instead
- ✅ Row Level Security (RLS) is enabled to protect data
- ✅ Use the **anon key** in your frontend (it respects RLS policies)

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Check if your Supabase project is active (not paused)
2. Verify the connection string in `.env`
3. Ensure you have the correct anon key
4. Check Supabase project status at https://status.supabase.com

### Migration Errors

If the migration fails:

1. Check the SQL Editor error messages
2. Ensure you're running as the `postgres` user
3. Try running the SQL in smaller sections
4. Check for existing tables that might conflict

### RLS Policy Issues

If you get permission errors:

1. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
2. Check the RLS policies in the Supabase dashboard
3. Ensure you're setting the `app.current_user_id` correctly

## Next Steps

1. ✅ Run the initial migration
2. ✅ Add your Supabase anon key to `.env`
3. ✅ Test the connection with `testConnection()`
4. ✅ Start using the `db` helpers in your app
5. ⏭️ Gradually replace localStorage with Supabase queries
6. ⏭️ Implement Supabase Auth for production-ready authentication

## Support

For issues or questions:
- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
