import { ref } from 'vue';
import type { AuthUser } from '../../domain/entities/auth-user.entity';

export class AuthViewModel {
  user = ref<AuthUser | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
}
