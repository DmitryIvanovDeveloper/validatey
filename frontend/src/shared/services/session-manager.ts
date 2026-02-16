import type { AuthSession } from '../../modules/auth/application/ports/auth-service.port';
import type { AuthUser } from '../../modules/auth/domain/entities/auth-user.entity';

/**
 * Centralized session management service
 * Single source of truth for authentication state
 */
class SessionManager {
  private static readonly USER_ID_KEY = 'validatey_user_id';
  private static readonly SESSION_DATA_KEY = 'validatey_session_data';
  private static readonly SESSION_READY_KEY = 'validatey_session_ready';

  private session: AuthSession | null = null;
  private sessionReady = false;
  private listeners: Set<(session: AuthSession | null) => void> = new Set();
  private initializationPromise: Promise<void> | null = null;

  // Cookie helpers
  private setCookie(name: string, value: string, days: number = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  constructor() {
    console.log('🔐 SESSION: SessionManager constructor called, current session:', this.session?.user?.id || null);
  }

  /**
   * Initialize session on app startup
   * Should be called once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    console.log('🔐 SESSION: Starting initialization');

    try {
      // Check if we have stored session data
      const storedSessionData = this.getStoredSessionData();
      console.log('🔐 SESSION: Stored session data found:', !!storedSessionData);
      if (storedSessionData) {
        console.log('🔐 SESSION: Stored userId:', storedSessionData.userId);
        console.log('🔐 SESSION: Stored email:', storedSessionData.email);
        console.log('🔐 SESSION: Stored role:', storedSessionData.role);
      }

      if (storedSessionData) {
        // Try to validate and restore the session
        console.log('🔐 SESSION: Attempting to validate stored session...');
        const session = await this.validateStoredSession(storedSessionData.userId);

        if (session) {
          console.log('🔐 SESSION: Backend validation successful, restoring session');
          this.setSession(session);
          this.markSessionReady();
          return;
        } else {
          console.log('🔐 SESSION: Backend validation failed, creating temp session from localStorage');
          // Create a temporary session from stored data (without access token)
          // This allows UI to show user info even if backend validation fails
          const tempSession: AuthSession = {
            user: {
              id: storedSessionData.userId,
              email: storedSessionData.email ?? null,
              displayName: storedSessionData.displayName ?? null
            },
            accessToken: '',
            expiresAt: 0,
            role: (storedSessionData.role as 'user' | 'admin') || 'user'
          };
          console.log('🔐 SESSION: Setting temp session:', tempSession.user.id);
          this.setSession(tempSession);
          this.markSessionReady();
          return;
        }
      }

      // No stored session data
      console.log('🔐 SESSION: No stored session data, setting session to null');
      this.setSession(null);
      this.markSessionReady();

    } catch (error) {
      console.error('🔐 SESSION: Initialization failed with error:', error);
      // On error, still try to use stored data if available
      const storedSessionData = this.getStoredSessionData();
      if (storedSessionData) {
        console.log('🔐 SESSION: Using stored data despite error');
        const tempSession: AuthSession = {
          user: {
            id: storedSessionData.userId,
            email: storedSessionData.email ?? null,
            displayName: storedSessionData.displayName ?? null
          },
          accessToken: '',
          expiresAt: 0,
          role: (storedSessionData.role as 'user' | 'admin') || 'user'
        };
        this.setSession(tempSession);
      } else {
        this.setSession(null);
      }
      this.markSessionReady();
    }
  }

  /**
   * Validate stored session by checking with backend
   */
  private async validateStoredSession(userId: string): Promise<AuthSession | null> {
    try {
      console.log('🔐 SESSION: Validating stored session with backend for userId:', userId);

      // Check if API is available (timeout after 3 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'x-user-id': userId
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('🔐 SESSION: Response status:', response.status, 'ok:', response.ok);

      if (response.status === 200) {
        try {
          const data = await response.json();
          console.log('🔐 SESSION: Response data:', data);
          if (data?.user?.id === userId) {
            console.log('🔐 SESSION: Session validated successfully');
            return {
              user: data.user as AuthUser,
              accessToken: '',
              expiresAt: 0,
              role: data.role || 'user'
            };
          } else {
            console.log('🔐 SESSION: User ID mismatch:', data?.user?.id, 'vs', userId);
          }
        } catch (error) {
          console.error('🔐 SESSION: Failed to parse response JSON:', error);
        }
      } else if (response.status === 401) {
        console.log('🔐 SESSION: Session is not valid (401) - user not authenticated');
      } else if (response.status === 304) {
        console.log('🔐 SESSION: Session not modified (304)');
      } else {
        console.log('🔐 SESSION: Unexpected response status:', response.status);
      }

      return null;

      console.log('🔐 SESSION: Backend validation failed');
      return null;

    } catch (error) {
      console.error('🔐 SESSION: Backend validation error:', error);
      return null;
    }
  }

  /**
   * Set current session and notify listeners
   */
  setSession(session: AuthSession | null): void {
    console.log('🔐 SESSION: Setting session:', session?.user?.id || null);

    const previousUserId = this.session?.user?.id;
    this.session = session;

    // Store/clear session data in cookies (cross-port access)
    if (session?.user) {
      // Store minimal user data (without sensitive info)
      const sessionData = {
        userId: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.role
      };
      this.setCookie(SessionManager.USER_ID_KEY, JSON.stringify(sessionData));
    } else {
      this.deleteCookie(SessionManager.USER_ID_KEY);
    }

    // Notify listeners if user changed
    if (previousUserId !== session?.user?.id) {
      console.log('🔐 SESSION: User changed, notifying listeners');
      this.listeners.forEach(listener => {
        try {
          listener(session);
        } catch (error) {
          console.error('🔐 SESSION: Error in session listener:', error);
        }
      });
    }
  }

  /**
   * Clear session (logout)
   */
  clearSession(): void {
    console.log('🔐 SESSION: Clearing session');
    this.setSession(null);
  }

  /**
   * Subscribe to session changes
   */
  subscribe(callback: (session: AuthSession | null) => void): () => void {
    console.log('🔐 SESSION: Adding session listener');
    this.listeners.add(callback);

    // Immediately call with current session
    if (this.sessionReady) {
      try {
        callback(this.session);
      } catch (error) {
        console.error('🔐 SESSION: Error in initial session callback:', error);
      }
    }

    // Return unsubscribe function
    return () => {
      console.log('🔐 SESSION: Removing session listener');
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current session
   */
  get currentSession(): AuthSession | null {
    return this.session;
  }

  /**
   * Get current user ID
   */
  get currentUserId(): string | null {
    return this.session?.user?.id || null;
  }

  /**
   * Get current user
   */
  get currentUser(): AuthUser | null {
    return this.session?.user || null;
  }

  /**
   * Check if session is ready (initialized)
   */
  get isSessionReady(): boolean {
    return this.sessionReady;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.session !== null && this.session.user !== null;
  }

  /**
   * Get stored session data from localStorage
   */
  private getStoredSessionData(): { userId: string; email?: string; displayName?: string; role?: string } | null {
    if (typeof window === 'undefined') return null;

    const stored = this.getCookie(SessionManager.USER_ID_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data && data.userId && this.isValidUUID(data.userId)) {
          return data;
        }
      } catch (error) {
        console.warn('🔐 SESSION: Failed to parse stored session data:', error);
        this.deleteCookie(SessionManager.USER_ID_KEY);
      }
    }

    return null;
  }

  /**
   * Clear stored session data
   */
  private clearStoredSession(): void {
    if (typeof window !== 'undefined') {
      this.deleteCookie(SessionManager.USER_ID_KEY);
      this.deleteCookie(SessionManager.SESSION_READY_KEY);
    }
  }

  /**
   * Mark session as ready
   */
  private markSessionReady(): void {
    this.sessionReady = true;

    if (typeof window !== 'undefined') {
      this.setCookie(SessionManager.SESSION_READY_KEY, 'true');

      // Dispatch custom event for components that need to know session is ready
      window.dispatchEvent(new CustomEvent('validatey-session-ready'));
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Force refresh session from backend
   */
  async refreshSession(): Promise<void> {
    console.log('🔐 SESSION: Refreshing session from backend');
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.user) {
          const session: AuthSession = {
            user: data.user as AuthUser,
            accessToken: '',
            expiresAt: 0,
            role: data.role || 'user'
          };
          this.setSession(session);
          return;
        }
      }
      this.clearSession();
    } catch (error) {
      console.error('🔐 SESSION: Failed to refresh session:', error);
      this.clearSession();
    }
  }
}

// Singleton instance
console.log('🔐 SESSION: Creating SessionManager singleton');
export const sessionManager = new SessionManager();
console.log('🔐 SESSION: SessionManager singleton created');