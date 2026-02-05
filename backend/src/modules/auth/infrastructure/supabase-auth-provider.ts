import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import type { AuthProviderPort, AuthUserDto, AuthSessionResult } from '../application/ports/auth-provider.port';

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
// Anon or service_role both work for auth (signInWithOAuth, getUser, signUp, signInWithPassword)
const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim() ?? '';

function getAuthClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function toAuthUserDto(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUserDto {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? user.email ?? null,
  };
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
    return toAuthUserDto(user);
  }

  async refreshSession(refreshToken: string): Promise<AuthSessionResult | null> {
    const { data, error } = await getAuthClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session?.access_token || !data?.user) return null;
    return {
      user: toAuthUserDto(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? undefined,
    };
  }

  async signUpWithEmailPassword(email: string, password: string): Promise<AuthSessionResult> {
    const { data, error } = await getAuthClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: undefined },
    });
    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      if (msg.includes('already registered')) {
        throw new Error('Email already registered');
      }
      if (msg.includes('rate limit') || msg.includes('ratelimit')) {
        throw new Error('RATE_LIMIT: Too many registration attempts. Please try again in a few minutes.');
      }
      throw new Error(error.message || 'Registration failed');
    }
    if (!data.user) {
      throw new Error('Registration failed');
    }
    // When "Confirm email" is enabled in Supabase, session is null until user confirms
    const accessToken = data.session?.access_token;
    return {
      user: toAuthUserDto(data.user),
      ...(accessToken && { accessToken }),
    };
  }

  async signInWithEmailPassword(email: string, password: string): Promise<AuthSessionResult> {
    const { data, error } = await getAuthClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('invalid login')) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.message || 'Sign in failed');
    }
    if (!data.session?.access_token || !data.user) {
      throw new Error('Sign in failed');
    }
    return {
      user: toAuthUserDto(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? undefined,
    };
  }
}
