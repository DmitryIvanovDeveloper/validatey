import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  // Always prefer SERVICE_ROLE_KEY to bypass RLS for backend operations
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required. Set them in .env.');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  WARNING: Using SUPABASE_ANON_KEY. RLS policies may block access. Use SUPABASE_SERVICE_ROLE_KEY for backend operations.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });

  return supabaseClient;
}



