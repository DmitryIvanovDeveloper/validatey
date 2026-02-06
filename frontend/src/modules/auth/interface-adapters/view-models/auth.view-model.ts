import { ref } from 'vue';
import type { AuthUser } from '../../domain/entities/auth-user.entity';
import type { AuthRole } from '../../application/ports/auth-service.port';

export class AuthViewModel {
  user = ref<AuthUser | null>(null);
  /** From GET /api/auth/session; null until loaded, then 'admin' | 'user'. */
  role = ref<AuthRole | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
  /** Shown after registration when email confirmation is required */
  registrationSuccessMessage = ref<string | null>(null);
}
