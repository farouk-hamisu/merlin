import { createClient } from '@supabase/supabase-js';

// Supabase project configuration (hard-coded)
const SUPABASE_URL = 'https://edysfmrlvjewvnbcdwvv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9z3MdS9rGM1jZ_0rTMKYnw_aQUjeVtv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
