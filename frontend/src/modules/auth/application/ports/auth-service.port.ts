import type { AuthUser } from '../../domain/entities/auth-user.entity';

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

/**
 * Port for authentication (Supabase Auth or other provider).
 * Implemented in infrastructure.
 */
export interface AuthServicePort {
  signInWithGoogle(redirectTo?: string): Promise<{ redirectUrl: string }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}
