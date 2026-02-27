<template>
  <div class="login-view">
    <div class="login-card">
      <header class="login-header">
        <h1 class="login-title">{{ labels.loginTitle }}</h1>
        <p class="login-subtitle">{{ labels.loginSubtitle }}</p>
      </header>

      <div v-if="authViewModel.error.value" class="login-error" role="alert">
        {{ authViewModel.error.value }}
      </div>

      <div v-if="authViewModel.registrationSuccessMessage.value" class="login-success" role="status">
        {{ authViewModel.registrationSuccessMessage.value }}
      </div>

      <form class="auth-form" @submit.prevent="handleEmailSubmit">
        <label class="field">
          <span class="field-label">{{ labels.emailLabel }}</span>
          <input
            v-model="email"
            type="email"
            class="field-input"
            :placeholder="labels.emailPlaceholder"
            required
            autocomplete="email"
          />
        </label>
        <label class="field">
          <span class="field-label">{{ labels.passwordLabel }}</span>
          <div class="field-password">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              :placeholder="labels.passwordPlaceholder"
              required
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              minlength="8"
            />
            <button type="button" class="field-password-toggle" @click="showPassword = !showPassword" :aria-label="labels.togglePasswordAria">
              {{ showPassword ? labels.hidePassword : labels.showPassword }}
            </button>
          </div>
          <p v-if="isRegister" class="field-hint">{{ labels.passwordHint }}</p>
        </label>
        <button
          type="submit"
          class="btn-primary"
          :disabled="authViewModel.loading.value || !email.trim() || !password"
        >
          <span v-if="authViewModel.loading.value" class="spinner" aria-hidden="true"></span>
          <template v-else>{{ isRegister ? labels.createAccount : labels.signIn }}</template>
        </button>
      </form>

      <p class="auth-switch">
        <button type="button" class="auth-switch-link" @click="isRegister = !isRegister">
          {{ isRegister ? labels.alreadyHaveAccount : labels.dontHaveAccount }}
        </button>
      </p>

      <div class="divider">
        <span>{{ labels.orDivider }}</span>
      </div>

      <button
        type="button"
        class="btn-google"
        :disabled="authViewModel.loading.value"
        @click="handleGoogleSignIn"
      >
        <span v-if="authViewModel.loading.value" class="spinner" aria-hidden="true"></span>
        <template v-else>
          <svg class="btn-google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ labels.signInWithGoogle }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import type { AuthPresenter } from '../../presenters/auth.presenter';
import { AuthViewModel } from '../../view-models/auth.view-model';

const router = useRouter();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);
const labels = authPresenter.labels;
const authViewModel = new AuthViewModel();

const isRegister = ref(false);
const email = ref('');
const password = ref('');
const showPassword = ref(false);

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await authPresenter.loadSession(authViewModel);
  if (authViewModel.user.value) {
    let redirect = (router.currentRoute.value.query.redirect as string) || '/workspaces';

    // Don't redirect to /projects directly - always go to workspaces first
    if (redirect === '/projects' || redirect.startsWith('/projects')) {
      redirect = '/workspaces';
    }

    await router.replace(redirect);
    return;
  }
  unsubscribe = authPresenter.subscribeToAuthState(authViewModel);
});

onUnmounted(() => {
  unsubscribe?.();
});

async function handleEmailSubmit() {
  const ok = isRegister.value
    ? await authPresenter.registerWithEmail(authViewModel, email.value.trim(), password.value)
    : await authPresenter.signInWithEmail(authViewModel, email.value.trim(), password.value);
  if (ok) {
    if (authViewModel.registrationSuccessMessage.value) {
      isRegister.value = false;
      return;
    }
    let redirect = (router.currentRoute.value.query.redirect as string) || '/workspaces';

    // Don't redirect to /projects directly - always go to workspaces first
    if (redirect === '/projects' || redirect.startsWith('/projects')) {
      redirect = '/workspaces';
    }

    await router.replace(redirect);
  }
}

async function handleGoogleSignIn() {
  let redirect = (router.currentRoute.value.query.redirect as string) || '/workspaces';

  // Don't redirect to /projects directly - always go to workspaces first
  if (redirect === '/projects' || redirect.startsWith('/projects')) {
    redirect = '/workspaces';
  }

  try {
    sessionStorage.setItem('auth_redirect', redirect);
  } catch {
    /* ignore */
  }
  await authPresenter.signInWithGoogle(authViewModel, redirect); // redirect stored in sessionStorage for callback
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 2rem 2.25rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.06);
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.login-error {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 0.8125rem;
}

.login-success {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: #ecfdf5;
  color: #047857;
  border-radius: 8px;
  font-size: 0.8125rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.field-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  color: #111;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input::placeholder {
  color: #9ca3af;
}

.field-input:focus {
  outline: none;
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.field-password {
  position: relative;
}

.field-password .field-input {
  padding-right: 3.5rem;
}

.field-password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.field-password-toggle:hover {
  color: #111;
}

.field-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fff;
  background: #0d9488;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0f766e;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin: 1rem 0 0;
  text-align: center;
}

.auth-switch-link {
  font-size: 0.8125rem;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.auth-switch-link:hover {
  color: #0d9488;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.btn-google:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google-icon {
  flex-shrink: 0;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
