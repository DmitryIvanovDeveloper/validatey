/**
 * Port for auth provider (Supabase Auth). Used by auth routes only.
 */
export interface AuthUserDto {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthSessionResult {
  user: AuthUserDto;
  /** Present when user is signed in immediately (e.g. when email confirmation is disabled). */
  accessToken?: string;
}

export interface AuthProviderPort {
  getGoogleAuthUrl(redirectTo: string): Promise<string>;
  getUserFromAccessToken(accessToken: string): Promise<AuthUserDto | null>;
  /** Register with email/password. Returns session or throws. */
  signUpWithEmailPassword(email: string, password: string): Promise<AuthSessionResult>;
  /** Sign in with email/password. Returns session or throws. */
  signInWithEmailPassword(email: string, password: string): Promise<AuthSessionResult>;
}
