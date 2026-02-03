import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import type { AuthProviderPort, AuthUserDto } from '../application/ports/auth-provider.port';

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
// Anon or service_role both work for auth (signInWithOAuth, getUser)
const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim() ?? '';

function getAuthClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export class SupabaseAuthProvider implements AuthProviderPort {
  async getGoogleAuthUrl(redirectTo: string): Promise<string> {
    const { data } = await getAuthClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (!data?.url) throw new Error('Auth: no redirect URL');
    return data.url;
  }

  async getUserFromAccessToken(accessToken: string): Promise<AuthUserDto | null> {
    const { data: { user }, error } = await getAuthClient().auth.getUser(accessToken);
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null,
    };
  }
}
