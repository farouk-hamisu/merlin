import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase project configuration (hard-coded)
const SUPABASE_URL = 'https://edysfmrlvjewvnbcdwvv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeXNmbXJsdmpld3ZuYmNkd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNzM3NjIsImV4cCI6MjExMDY0OTc2Mn0.m99bxz6g_gYFaHyYafgMD_N_giWMJMnN4U_qBb4w5dg';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeXNmbXJsdmpld3ZuYmNkd3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTA3Mzc2MiwiZXhwIjoyMTEwNjQ5NzYyfQ.7xWawtghcICaExKP9Va4dfDwL_R9N1ZQ7duTIXb81lE';

// Standard client that respects RLS (for operations representing the user)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client that bypasses RLS (for background operations, admin tasks, key consumption)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
