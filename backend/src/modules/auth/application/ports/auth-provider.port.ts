/**
 * Port for auth provider (Supabase Auth). Used by auth routes only.
 */
export interface AuthUserDto {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthProviderPort {
  getGoogleAuthUrl(redirectTo: string): Promise<string>;
  getUserFromAccessToken(accessToken: string): Promise<AuthUserDto | null>;
}
