import { ref } from 'vue';
import type { AuthUser } from '../../domain/entities/auth-user.entity';

export class AuthViewModel {
  user = ref<AuthUser | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
  /** Shown after registration when email confirmation is required */
  registrationSuccessMessage = ref<string | null>(null);
}
