import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseClient;
}


