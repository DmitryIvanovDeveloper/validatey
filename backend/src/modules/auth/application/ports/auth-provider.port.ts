/**
 * Port for auth provider (Supabase Auth). Used by auth routes only.
 */
export interface AuthUserDTO {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthSessionResult {
  user: AuthUserDTO;
  /** Present when user is signed in immediately (e.g. when email confirmation is disabled). */
  accessToken?: string;
  /** Required for refreshing access token after it expires (e.g. 1h). */
  refreshToken?: string;
}

export interface AuthProviderPort {
  getGoogleAuthUrl(redirectTo: string): Promise<string>;
  getUserFromAccessToken(accessToken: string): Promise<AuthUserDTO | null>;
  /**
   * Exchange refresh token for new access (and optionally refresh) token.
   * Returns null if refresh token is invalid or expired.
   */
  refreshSession(refreshToken: string): Promise<AuthSessionResult | null>;
  /** Register with email/password. Returns session or throws. */
  signUpWithEmailPassword(email: string, password: string): Promise<AuthSessionResult>;
  /** Sign in with email/password. Returns session or throws. */
  signInWithEmailPassword(email: string, password: string): Promise<AuthSessionResult>;
  /** Sign out from Supabase, invalidating the session. */
  signOut(): Promise<void>;
}
