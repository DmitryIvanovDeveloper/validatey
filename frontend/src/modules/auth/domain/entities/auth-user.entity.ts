/**
 * Domain entity for an authenticated user (from Supabase Auth or other provider).
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
}
