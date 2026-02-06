import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { TokenValidator } from '../../../shared/validation/token-validator';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES as AUTH_TYPES } from '@/modules/auth/infrastructure/bootstrap/types';
import type { AuthServicePort } from '@/modules/auth/application/ports/auth-service.port';

/** Routes that are allowed without authentication (no redirect to login). */
const PUBLIC_ROUTE_NAMES = new Set(['login', 'auth-callback', 'respondent-survey', 'survey-public', 'survey-public-short']);

export async function tokenGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const authService = container.get<AuthServicePort>(AUTH_TYPES.AuthService);
  const session = await authService.getSession();

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

  // Login page: if already authenticated, redirect to app
  if (to.name === 'login') {
    if (session) {
      const redirect = (to.query.redirect as string) || '/projects';
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

  // Root: redirect to /projects if authenticated, else to login
  if (to.name === 'home') {
    if (session) {
      next({ path: '/projects', replace: true });
      return;
    }
    next({ name: 'login', replace: true });
    return;
  }

  // All other routes (including not-found): require authentication
  if (!session) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  next();
}



