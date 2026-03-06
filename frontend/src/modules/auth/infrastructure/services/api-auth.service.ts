import { injectable } from 'inversify';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { AuthServicePort, AuthSession } from '../../application/ports/auth-service.port';
import type { AuthUser } from '../../domain/entities/auth-user.entity';

const BASE = API_CONFIG.BASE_URL;

function toAuthSession(dto: {
  user: { id: string; email: string | null; displayName: string | null };
  role?: 'admin' | 'user';
}): AuthSession {
  return {
    user: dto.user as AuthUser,
    accessToken: '',
    expiresAt: 0,
    role: dto.role === 'admin' ? 'admin' : 'user',
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

  async registerWithEmail(email: string, password: string): Promise<{ session: AuthSession | null; requiresEmailConfirmation?: boolean }> {
    const res = await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Registration failed');
    }
    const data = await res.json().catch(() => null);
    if (!data?.user) return { session: null };
    const session = toAuthSession(data);
    if (!data.requiresEmailConfirmation) {
      this._onChange?.(session);
    }
    return { session, requiresEmailConfirmation: data.requiresEmailConfirmation };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthSession | null> {
    const res = await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Sign in failed');
    }
    const data = await res.json().catch(() => null);
    if (!data?.user) return null;
    const session = toAuthSession(data);
    this._onChange?.(session);
    return session;
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

  async linkPreviousUser(previousUserId: string): Promise<{ linked: number }> {
    const res = await fetch(`${BASE}${API_CONFIG.ENDPOINTS.AUTH_LINK_PREVIOUS_USER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ previousUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? `Link previous user: ${res.status}`);
    }
    const data = await res.json().catch(() => ({ linked: 0 }));
    return { linked: typeof data?.linked === 'number' ? data.linked : 0 };
  }
}
