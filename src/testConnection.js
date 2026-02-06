/**
 * Database Connection Test
 * Run this file to test your Supabase connection
 *
 * Usage: node src/testConnection.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

// Get environment variables (using process.env for Node.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
  process.exit(1);
}

// Create Supabase client for testing
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// Test connection function
async function testConnection() {
  try {
    console.log('   Connecting to:', supabaseUrl);
    console.log('   Using anon key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

    const { data, error, count, status, statusText } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('\nDetailed error information:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      console.error('   Full error:', JSON.stringify(error, null, 2));

      // Check for common issues
      if (error.code === '42P01') {
        console.error('\n⚠️  The "users" table does not exist!');
        console.error('   You need to run the database migration first.');
        console.error('   See DATABASE_SETUP.md for instructions.');
      } else if (error.code === 'PGRST301') {
        console.error('\n⚠️  Permission denied - Row Level Security might be blocking access.');
      }

      return { success: false, error: error.message || error.code || JSON.stringify(error) };
    }

    console.log('✅ Supabase connected successfully');
    return { success: true };
  } catch (error) {
    console.error('Supabase connection failed (exception):', error);
    return { success: false, error: error.message || String(error) };
  }
}

// Database helpers for testing
const db = {
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getGroups() {
    const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getPOIs() {
    const { data, error } = await supabase.from('pois').select('*').order('name');
    if (error) throw error;
    return data;
  },
};

async function runTests() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 0: Check API accessibility
  console.log('Test 0: API Accessibility');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('   API Response Status:', response.status, response.statusText);
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Supabase API is reachable\n');
    } else {
      const text = await response.text();
      console.error('❌ Unexpected response:', text);
      return;
    }
  } catch (error) {
    console.error('❌ Cannot reach Supabase API:', error.message);
    console.log('   This might be a network issue or the Supabase project is paused.\n');
    return;
  }

  // Test 1: Check if tables exist
  console.log('Test 1: Check if users table exists');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error('❌ Error querying users table:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message || '(empty)');
      console.error('   Details:', error.details || '(none)');

      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.error('\n⚠️  The "users" table does not exist!');
        console.error('   You need to run the database migration first.');
        console.error('   See DATABASE_SETUP.md Step 2 for instructions.\n');
        console.error('   Quick fix: Go to https://app.supabase.com, open SQL Editor,');
        console.error('   and run the migration file: supabase/migrations/20260206_initial_schema.sql');
      }
      return;
    }

    console.log('✅ Users table exists!\n');
  } catch (error) {
    console.error('❌ Exception:', error.message);
    return;
  }

  // Test 2: Query Users Table
  console.log('Test 2: Query Users Table');
  try {
    const users = await db.getUsers();
    console.log(`✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   Sample user:', users[0].email);
    }
  } catch (error) {
    console.error('❌ Failed to query users:', error.message);
  }
  console.log('');

  // Test 3: Query Groups
  console.log('Test 3: Query Groups Table');
  try {
    const groups = await db.getGroups();
    console.log(`✅ Found ${groups.length} groups`);
  } catch (error) {
    console.error('❌ Failed to query groups:', error.message);
  }
  console.log('');

  // Test 4: Query POIs
  console.log('Test 4: Query POIs Table');
  try {
    const pois = await db.getPOIs();
    console.log(`✅ Found ${pois.length} POIs`);
    if (pois.length > 0) {
      console.log('   Sample POI:', pois[0].name);
    }
  } catch (error) {
    console.error('❌ Failed to query POIs:', error.message);
  }
  console.log('');

  console.log('✅ All tests complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. If you see errors above, check your .env file');
  console.log('2. Make sure the migration has been run (see supabase/README.md)');
  console.log('3. Start integrating the database into your app (replace localStorage)');
}

runTests().catch(console.error);
