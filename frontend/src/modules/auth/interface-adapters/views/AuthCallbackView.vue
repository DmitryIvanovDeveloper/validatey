<template>
  <div class="auth-callback">
    <p v-if="status === 'loading'">Signing you in…</p>
    <p v-else-if="status === 'error'" class="error">{{ error }}</p>
    <p v-else>Redirecting…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_CONFIG } from '@/infrastructure/config/api.config';

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
  return '/projects';
}

onMounted(async () => {
  try {
    const params = parseHashParams(window.location.hash);
    const accessToken = params.access_token;
    if (!accessToken) {
      await router.replace('/');
      return;
    }
    const base = API_CONFIG.BASE_URL;
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.AUTH_SESSION}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
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
.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}
.error {
  color: var(--color-error, #b91c1c);
}
</style>
