import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { TokenValidator } from '../../../shared/validation/token-validator';

export function tokenGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // Проверка токена для survey routes
  if (to.name === 'respondent-survey') {
    const token = to.params.token as string;
    
    if (!token || !TokenValidator.isValid(token)) {
      next({ name: 'not-found' });
      return;
    }
  }

  next();
}


