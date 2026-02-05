<template>
  <div class="app-layout">
    <header v-if="showNavbar" class="header" role="banner">
      <div class="header-inner">
        <router-link to="/projects" class="brand" aria-label="Validatey home">
          <span class="brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="brand-text">Validatey</span>
        </router-link>
        <div class="header-actions">
          <template v-if="authViewModel.user.value">
            <div class="user-badge" :title="authViewModel.user.value.email ?? undefined">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-name">{{ userDisplayName }}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="authViewModel.loading.value" @click="handleSignOut">Sign out</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-primary" :disabled="authViewModel.loading.value" @click="handleSignIn">Sign in with Google</button>
          </template>
        </div>
      </div>
    </header>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '@/modules/auth/interface-adapters/presenters/auth.presenter';
import { AuthViewModel } from '@/modules/auth/interface-adapters/view-models/auth.view-model';
import { userContextService } from '@/shared/services/user-context.service';

const route = useRoute();
const router = useRouter();
const authViewModel = new AuthViewModel();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);

const userDisplayName = computed(() => {
  const u = authViewModel.user.value;
  if (!u) return '';
  return u.email ?? u.displayName ?? 'User';
});

const userInitial = computed(() => {
  const name = userDisplayName.value;
  if (!name) return '?';
  const part = name.trim().split(/[\s@]/).find(Boolean) ?? '';
  return part.charAt(0).toUpperCase() || '?';
});
let unsubscribeAuth: (() => void) | null = null;

/** True after loadSession() has completed. Prevents clearing userId on initial run (user is null before session loads). */
const sessionLoaded = ref(false);

const showNavbar = computed(() => {
  return route.meta.hideNavbar !== true;
});

watch(
  () => authViewModel.user.value,
  async (user) => {
    if (user) {
      const previousId = userContextService.getUserId();
      if (previousId && previousId !== user.id) {
        try {
          await authPresenter.linkPreviousUser(previousId);
        } catch (_) {
          // Non-blocking: projects stay under old id; user can retry or continue
        }
      }
      userContextService.setUserId(user.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('validatey-user-id-synced'));
      }
    } else {
      // Only clear when we know session was loaded and user is null (e.g. sign out).
      // Do NOT clear on first run: user is null before loadSession, and clearing would wipe stored Google id, so list projects would use a new anonymous id and show empty.
      if (sessionLoaded.value) {
        userContextService.clearUserId();
      }
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await authPresenter.loadSession(authViewModel);
  sessionLoaded.value = true;
  userContextService.setSessionReady(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('validatey-session-ready'));
  }
  unsubscribeAuth = authPresenter.subscribeToAuthState(authViewModel);
});

onUnmounted(() => {
  unsubscribeAuth?.();
});

async function handleSignIn() {
  await authPresenter.signInWithGoogle(authViewModel);
}

async function handleSignOut() {
  await authPresenter.signOut(authViewModel);
  userContextService.clearUserId();
  await router.replace('/login');
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg, #fafafa);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-accent, #0d9488);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  transition: color 0.2s, opacity 0.2s;
}

.brand:hover {
  color: var(--color-accent-hover, #0f766e);
  opacity: 0.9;
}

.brand-icon {
  display: flex;
  color: var(--color-accent, #0d9488);
}

.brand-text {
  font-weight: 700;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  background: var(--color-bg-subtle, #f1f5f9);
  border-radius: 9999px;
}

.user-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--color-accent, #0d9488);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 0.8125rem;
  color: var(--color-text, #334155);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: background 0.15s, color 0.15s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background: var(--color-accent, #0d9488);
  color: white;
  box-shadow: 0 1px 2px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted, #64748b);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--color-text, #334155);
  background: var(--color-bg-subtle, #f1f5f9);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-content {
  flex: 1;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>

