import { injectable } from 'inversify';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { AuthServicePort, AuthSession } from '../../application/ports/auth-service.port';
import type { AuthUser } from '../../domain/entities/auth-user.entity';

const BASE = API_CONFIG.BASE_URL;

function toAuthSession(dto: { user: { id: string; email: string | null; displayName: string | null } }): AuthSession {
  return {
    user: dto.user as AuthUser,
    accessToken: '',
    expiresAt: 0,
  };
}

@injectable()
export class ApiAuthService implements AuthServicePort {
  private _onChange: ((session: AuthSession | null) => void) | null = null;

  async signInWithGoogle(redirectTo?: string): Promise<{ redirectUrl: string }> {
    const redirect = redirectTo ?? `${window.location.origin}/auth/callback`;
    const res = await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_GOOGLE_URL}?redirect_to=${encodeURIComponent(redirect)}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? `Auth: ${res.status}`);
    }
    const { url } = await res.json();
    if (!url) throw new Error('Auth: no redirect URL');
    return { redirectUrl: url };
  }

  async signOut(): Promise<void> {
    await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_SIGN_OUT}`, {
      method: 'POST',
      credentials: 'include',
    });
    this._onChange?.(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const res = await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_SESSION}`, { credentials: 'include' });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data?.user) return null;
    const session = toAuthSession(data);
    return session;
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    this._onChange = callback;
    return () => {
      this._onChange = null;
    };
  }
}
