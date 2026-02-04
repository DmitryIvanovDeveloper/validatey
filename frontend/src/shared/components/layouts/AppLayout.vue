<template>
  <div class="app-layout">
    <nav v-if="showNavbar" class="navbar" role="navigation" aria-label="Main">
      <div class="navbar-content">
        <router-link to="/" class="logo" aria-label="Validatey home">Validatey</router-link>
        <ul class="nav-links">
          <li><router-link to="/projects" class="nav-link" active-class="nav-link-active">Projects</router-link></li>
          <li><router-link to="/projects/new" class="nav-link nav-link-cta">+ New Project</router-link></li>
        </ul>
        <div class="nav-user">
          <template v-if="authViewModel.user.value">
            <span class="user-email" :title="authViewModel.user.value.email">{{ userDisplayName }}</span>
            <button type="button" class="btn btn-ghost" :disabled="authViewModel.loading.value" @click="handleSignOut">Sign out</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-primary" :disabled="authViewModel.loading.value" @click="handleSignIn">Sign in with Google</button>
          </template>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '@/modules/auth/interface-adapters/presenters/auth.presenter';
import { AuthViewModel } from '@/modules/auth/interface-adapters/view-models/auth.view-model';
import { userContextService } from '@/shared/services/user-context.service';

const route = useRoute();
const authViewModel = new AuthViewModel();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);

const userDisplayName = computed(() => {
  const u = authViewModel.user.value;
  if (!u) return '';
  return u.email ?? u.displayName ?? 'User';
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
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--color-border);
  padding: 0.875rem 0;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-accent);
  text-decoration: none;
  letter-spacing: -0.03em;
  transition: color 0.2s;
}

.logo:hover {
  color: var(--color-accent-hover);
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  padding: 0.5rem 0.75rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  border-radius: var(--radius-md);
  transition: color 0.15s, background 0.15s;
}

.nav-link:hover {
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.nav-link-active {
  color: var(--color-accent);
  background: var(--color-accent-light);
  font-weight: 600;
}

.nav-link-cta {
  color: white;
  background: var(--color-accent);
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.3);
}

.nav-link-cta:hover {
  background: var(--color-accent-hover);
  color: white;
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.35);
}

.nav-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-bg-subtle);
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

