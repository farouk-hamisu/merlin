import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is missing.');
}

// Standard client that respects RLS (for operations representing the user)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client that bypasses RLS (for background operations, admin tasks, key consumption)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
