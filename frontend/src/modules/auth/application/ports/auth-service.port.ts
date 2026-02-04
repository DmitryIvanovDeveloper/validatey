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
  registerWithEmail(email: string, password: string): Promise<{ session: AuthSession | null; requiresEmailConfirmation?: boolean }>;
  signInWithEmail(email: string, password: string): Promise<AuthSession | null>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  /** Reassign projects from anonymous userId to current session user (call after login). */
  linkPreviousUser(previousUserId: string): Promise<{ linked: number }>;
}
