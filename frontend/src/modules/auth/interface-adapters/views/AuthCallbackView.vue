<template>
  <div class="auth-redirect">
    <div class="auth-redirect__card">
      <div class="auth-redirect__header">
        <h1 class="auth-redirect__title">Validatey</h1>
        <p v-if="status !== 'error'" class="auth-redirect__subtitle">
          {{ status === 'loading' ? 'Signing you in…' : 'Redirecting…' }}
        </p>
      </div>
      <div class="auth-redirect__body">
        <template v-if="status === 'loading'">
          <div class="auth-redirect__dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </template>
        <template v-else-if="status === 'done'">
          <div class="auth-redirect__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </template>
        <template v-else-if="status === 'error'">
          <div class="auth-redirect__error-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p class="auth-redirect__error-text">{{ error }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

const route = useRoute();
const router = useRouter();
const status = ref<'loading' | 'done' | 'error'>('loading');
const error = ref<string | null>(null);

function parseHashParams(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hash || hash[0] !== '#') return out;
  const q = new URLSearchParams(hash.slice(1));
  q.forEach((v, k) => { out[k] = v; });
  return out;
}

function getRedirectTarget(): string {
  const fromQuery = route.query.redirect as string | undefined;
  if (fromQuery && fromQuery.startsWith('/')) return fromQuery;
  try {
    const fromStorage = sessionStorage.getItem('auth_redirect');
    if (fromStorage) return fromStorage;
  } catch {
    /* ignore */
  }
  return '/workspaces';
}

onMounted(async () => {
  try {
    const params = parseHashParams(window.location.hash);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token ?? null;
    if (!accessToken) {
      await router.replace('/');
      return;
    }
    const base = API_CONFIG.BASE_URL;
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.AUTH_SESSION}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        ...(refreshToken && { refresh_token: refreshToken }),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Sign in failed');
    }
    status.value = 'done';
    try {
      sessionStorage.removeItem('auth_redirect');
    } catch {
      /* ignore */
    }
    const redirect = getRedirectTarget();
    await router.replace(redirect);
  } catch (e) {
    status.value = 'error';
    error.value = e instanceof Error ? e.message : 'Sign in failed';
  }
});
</script>

<style scoped>
.auth-redirect {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
}

.auth-redirect__card {
  width: 100%;
  max-width: 380px;
  padding: 2.5rem 2.25rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.auth-redirect__header {
  margin-bottom: 1.5rem;
}

.auth-redirect__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.auth-redirect__subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.auth-redirect__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 80px;
}

.auth-redirect__dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.auth-redirect__dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent, #0d9488);
  animation: bounce 1.4s ease-in-out infinite both;
}

.auth-redirect__dots span:nth-child(1) { animation-delay: 0s; }
.auth-redirect__dots span:nth-child(2) { animation-delay: 0.2s; }
.auth-redirect__dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.auth-redirect__check {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success-bg, #d1fae5);
  color: var(--color-success, #059669);
  border-radius: 50%;
}

.auth-redirect__check svg {
  width: 28px;
  height: 28px;
}

.auth-redirect__error-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-error, #dc2626);
}

.auth-redirect__error-icon svg {
  width: 32px;
  height: 32px;
}

.auth-redirect__error-text {
  font-size: 0.9375rem;
  color: var(--color-error, #dc2626);
  margin: 0;
}
</style>
