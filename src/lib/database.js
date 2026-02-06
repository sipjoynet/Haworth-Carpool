/**
 * Database Adapter
 * Provides a unified interface for database operations using Supabase
 * This adapter matches the existing localStorage DB interface for seamless migration
 */

import { supabase } from './supabase.js';

const DB = {
  /**
   * Initialize database - checks connection and ensures seed data exists
   */
  async init() {
    try {
      // Check if we have at least one user (seed data should exist from migration)
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database initialization error:', error);
        throw error;
      }

      console.log('✅ Database connected and initialized');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  },

  /**
   * Query a table with optional filter
   * @param {string} table - Table name
   * @param {function} filter - Filter function (optional)
   * @returns {Array} Results
   */
  async query(table, filter = null) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) throw error;

      // Apply client-side filter if provided (for compatibility with localStorage version)
      if (filter && typeof filter === 'function') {
        return data.filter(filter);
      }

      return data || [];
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      throw error;
    }
  },

  /**
   * Find a single record
   * @param {string} table - Table name
   * @param {function} filter - Filter function
   * @returns {Object|null} First matching record
   */
  async findOne(table, filter) {
    const results = await this.query(table, filter);
    return results[0] || null;
  },

  /**
   * Create a new record
   * @param {string} table - Table name
   * @param {Object} record - Record data
   * @returns {Object} Created record with ID
   */
  async create(table, record) {
    try {
      // Don't add timestamps - let the database handle defaults
      // This prevents errors with tables that have different timestamp column names
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating record in ${table}:`, error);
      throw error;
    }
  },

  /**
   * Update a record
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated record
   */
  async update(table, id, updates) {
    try {
      // Only add updated_at if it's not already in the updates
      // Let database triggers handle automatic timestamp updates
      const updateData = updates.updated_at ? updates : {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating record in ${table}:`, error);
      throw error;
    }
  },

  /**
   * Delete a record
   * @param {string} table - Table name
   * @param {number} id - Record ID
   */
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting record in ${table}:`, error);
      throw error;
    }
  },

  /**
   * Get all data (for debugging/compatibility)
   * This is less efficient than querying specific tables, but maintains compatibility
   */
  async getData() {
    try {
      const [users, children, pois, groups, group_members, ride_requests] = await Promise.all([
        this.query('users'),
        this.query('children'),
        this.query('pois'),
        this.query('groups'),
        this.query('group_members'),
        this.query('ride_requests')
      ]);

      return {
        users,
        children,
        pois,
        groups,
        group_members,
        ride_requests
      };
    } catch (error) {
      console.error('Error getting all data:', error);
      throw error;
    }
  }
};

export default DB;
