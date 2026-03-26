import { ref } from 'vue';
import type { AuthUser } from '../../domain/entities/auth-user.entity';
import type { AuthRole } from '../../application/ports/auth-service.port';

export class AuthViewModel {
  user = ref<AuthUser | null>(null);
  /** From GET /api/auth/session; null until loaded, then 'admin' | 'user'. */
  role = ref<AuthRole | null>(null);
  /** Legacy/global loading flag (kept for compatibility). */
  loading = ref(false);
  /** Loading for email/password flows (sign in + register). */
  emailLoading = ref(false);
  /** Loading for Google OAuth flow. */
  googleLoading = ref(false);
  error = ref<string | null>(null);
  /** Shown after registration when email confirmation is required */
  registrationSuccessMessage = ref<string | null>(null);
}
