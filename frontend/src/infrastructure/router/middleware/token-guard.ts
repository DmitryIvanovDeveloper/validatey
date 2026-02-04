import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { TokenValidator } from '../../../shared/validation/token-validator';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES as AUTH_TYPES } from '@/modules/auth/infrastructure/bootstrap/types';
import type { AuthServicePort } from '@/modules/auth/application/ports/auth-service.port';

export async function tokenGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  // Survey route: validate token
  if (to.name === 'respondent-survey') {
    const token = to.params.token as string;
    if (!token || !TokenValidator.isValid(token)) {
      next({ name: 'not-found' });
      return;
    }
    next();
    return;
  }

  // Root: unauthenticated → /login; authenticated → /projects
  if (to.name === 'home') {
    const authService = container.get<AuthServicePort>(AUTH_TYPES.AuthService);
    const session = await authService.getSession();
    if (session) {
      next({ path: '/projects', replace: true });
      return;
    }
    next({ name: 'login', replace: true });
    return;
  }

  // Public routes: no auth check
  if (to.name === 'login' || to.name === 'auth-callback' || to.meta.requiresAuth === false) {
    if (to.name === 'login') {
      const authService = container.get<AuthServicePort>(AUTH_TYPES.AuthService);
      const session = await authService.getSession();
      if (session) {
        const redirect = (to.query.redirect as string) || '/projects';
        next({ path: redirect, replace: true });
        return;
      }
    }
    next();
    return;
  }

  // Protected routes: require auth
  const authService = container.get<AuthServicePort>(AUTH_TYPES.AuthService);
  const session = await authService.getSession();
  if (!session) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  next();
}



