import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { TokenValidator } from '../../../shared/validation/token-validator';
import { container } from '../../bootstrap/container';
import { TYPES as AUTH_TYPES } from '../../../modules/auth/infrastructure/bootstrap/types';
import type { AuthServicePort, AuthSession } from '../../../modules/auth/application/ports/auth-service.port';
import { sessionManager } from '../../../shared/services/session-manager';

/** Routes that are allowed without authentication (no redirect to login). */
const PUBLIC_ROUTE_NAMES = new Set([
  'login',
  'auth-callback',
  'landing',
  'respondent-survey',
  'survey-public',
  'survey-public-short',
  'project-dashboard-guest', // /view/:slug — public project overview
]);

/** User app routes (workspaces/projects): admin has no access, redirect to /admin/users. */
const USER_APP_ROUTE_NAMES = new Set([
  'workspaces',
  'workspace-projects',
  'create-project',
  'project-details',
  'project-scraper',
  'project-report',
  'project-invitations',
  'project-edit',
  'project-responses',
  'project-panel',
]);

export async function tokenGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  console.log('🔐 Token guard called for:', to.name, to.path);
  console.log('🔐 Route requires auth?', typeof to.name === 'string' && USER_APP_ROUTE_NAMES.has(to.name));
  console.log('🔐 SessionManager state:', {
    isSessionReady: sessionManager.isSessionReady,
    isAuthenticated: sessionManager.isAuthenticated,
    currentUserId: sessionManager.currentUserId,
    currentUser: sessionManager.currentUser?.email
  });

  // Skip auth guard for routes that request it
  if (to.meta?.skipAuthGuard) {
    console.log('🔐 Skipping auth guard for route:', to.name);
    next();
    return;
  }

  let session: AuthSession | null = null;

  try {
    const authService = container.get<AuthServicePort>(AUTH_TYPES.AuthService);
    console.log('🔐 Checking session for route:', to.path);

    // First, check sessionManager state (fast, no network call)
    if (sessionManager.isSessionReady) {
      console.log('🔐 SessionManager ready, checking local auth state');
      if (sessionManager.isAuthenticated && sessionManager.currentSession) {
        session = sessionManager.currentSession;
        console.log('🔐 Local session found:', session.user.email);
      } else {
        console.log('🔐 No local session, will check API');
      }
    }

    // If no local session, check API with timeout
    if (!session) {
      console.log('🔐 Checking API session');
      const sessionPromise = authService.getSession();
      // Prod can be a bit slow (Supabase role/user lookup); if we time out too aggressively
      // the user will be redirected back to login even though cookies are valid.
      const AUTH_GUARD_TIMEOUT_MS = 8000;
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_GUARD_TIMEOUT_MS)
      );

      session = await Promise.race([sessionPromise, timeoutPromise]).catch((error: unknown) => {
        console.warn('🔐 Auth timeout or API unavailable:', error instanceof Error ? error.message : String(error));
        return null; // Treat as not authenticated
      });
      if (session !== null) {
        sessionManager.setSession({
          user: session.user,
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          role: session.role ?? 'user'
        });
      }
      console.log('🔐 API session check result:', session ? 'authenticated' : 'not authenticated');
    }
  } catch (error) {
    console.warn('Auth service error in tokenGuard:', error);
    // Continue without session if auth fails - session is already null
  }

  // Survey by token: only validate token, no auth required
  if (to.name === 'respondent-survey') {
    const token = to.params.token as string;
    if (!token || !TokenValidator.isValid(token)) {
      next({ name: 'not-found' });
      return;
    }
    next();
    return;
  }

  // Login page: if already authenticated, redirect to app (admin → /admin/users)
  if (to.name === 'login') {
    if (session) {
      const requestedRedirect = (to.query.redirect as string) || '/workspaces';
      const redirect = session.role === 'admin' ? '/admin/users' : requestedRedirect;
      next({ path: redirect, replace: true });
      return;
    }
    next();
    return;
  }

  // Other public routes (e.g. auth-callback)
  if (typeof to.name === 'string' && PUBLIC_ROUTE_NAMES.has(to.name)) {
    next();
    return;
  }

  // Root (login page): already handled above
  if (to.name === 'home') {
    next();
    return;
  }

  // Landing page: public access
  if (to.name === 'landing') {
    next();
    return;
  }

  // All other routes (including not-found): require authentication
  if (!session) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Admin-only routes: redirect non-admins to /workspaces
  if ((to.meta?.requiresAdmin as boolean) === true && session.role !== 'admin') {
    next({ path: '/workspaces', replace: true });
    return;
  }

  // User app (projects): redirect admins to /admin/users — admin has no projects page
  if (session.role === 'admin' && typeof to.name === 'string' && USER_APP_ROUTE_NAMES.has(to.name)) {
    next({ path: '/admin/users', replace: true });
    return;
  }

  next();
}



