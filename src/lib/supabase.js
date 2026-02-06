import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'haworth-carpool',
    },
  },
});

// Helper function to check connection
export async function testConnection() {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connected successfully');
    return { success: true };
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return { success: false, error: error.message };
  }
}

// Database helper functions
export const db = {
  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Groups
  async getGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createGroup(groupData) {
    const { data, error } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGroup(id, updates) {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Group Members
  async getGroupMembers(groupId) {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    return data;
  },

  async addGroupMember(groupId, userId) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Points of Interest (POIs)
  async getPOIs() {
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async createPOI(poiData) {
    const { data, error } = await supabase
      .from('pois')
      .insert(poiData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePOI(id, updates) {
    const { data, error } = await supabase
      .from('pois')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Children
  async getChildrenByParent(parentId) {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async createChild(childData) {
    const { data, error } = await supabase
      .from('children')
      .insert(childData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateChild(id, updates) {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChild(id) {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Ride Requests
  async getRideRequests(filters = {}) {
    let query = supabase
      .from('ride_requests')
      .select(`
        *,
        requester:users!ride_requests_requester_id_fkey(*),
        accepter:users!ride_requests_accepter_id_fkey(*),
        poi:pois(*)
      `)
      .order('ride_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (filters.group_id) {
      query = query.eq('group_id', filters.group_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.requester_id) {
      query = query.eq('requester_id', filters.requester_id);
    }

    if (filters.accepter_id) {
      query = query.eq('accepter_id', filters.accepter_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async createRideRequest(rideData) {
    const { data, error } = await supabase
      .from('ride_requests')
      .insert(rideData)
      .select(`
        *,
        requester:users!ride_requests_requester_id_fkey(*),
        poi:pois(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateRideRequest(id, updates) {
    const { data, error } = await supabase
      .from('ride_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        requester:users!ride_requests_requester_id_fkey(*),
        accepter:users!ride_requests_accepter_id_fkey(*),
        poi:pois(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },
};

export default supabase;
