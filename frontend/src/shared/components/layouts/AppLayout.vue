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
        <nav v-if="authViewModel.user.value" class="header-nav" aria-label="Main">
          <router-link v-if="authViewModel.role.value === 'admin'" to="/admin/users" class="nav-link">Users</router-link>
        </nav>
        <div class="header-actions">
          <template v-if="authViewModel.user.value">
            <div class="user-badge" :title="authViewModel.user.value.email ?? undefined">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-name">{{ userDisplayName }}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="authViewModel.loading.value" @click="handleSignOut">Sign out</button>
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
import { container } from '../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '../../../modules/auth/interface-adapters/presenters/auth.presenter';
import { AuthViewModel } from '../../../modules/auth/interface-adapters/view-models/auth.view-model';
import { userContextService } from '../../services/user-context.service';
import { sessionManager } from '../../services/session-manager';

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
let unsubscribeSession: (() => void) | null = null;

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

// Session refresh interval
let sessionRefreshInterval: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();

// User activity handler
const handleUserActivity = () => {
  const now = Date.now();
  lastActivityTime = now;

  // Refresh session every 5 minutes of activity if user is logged in
  if (authViewModel.user.value && now - lastActivityTime > 5 * 60 * 1000) {
    console.log('🔄 Refreshing session due to user activity...');
    authPresenter.loadSession(authViewModel).catch(error => {
      console.warn('❌ Failed to refresh session on activity:', error);
    });
  }
};

onMounted(async () => {
  // Sync authViewModel with sessionManager
  if (sessionManager.isSessionReady && sessionManager.currentSession) {
    console.log('🔐 AppLayout: Syncing with existing sessionManager session');
    authViewModel.user.value = sessionManager.currentSession.user;
    authViewModel.role.value = sessionManager.currentSession.role ?? null;
  } else {
    console.log('🔐 AppLayout: Loading session via authPresenter');
    await authPresenter.loadSession(authViewModel);
  }

  sessionLoaded.value = true;
  userContextService.setSessionReady(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('validatey-session-ready'));
  }
  unsubscribeAuth = authPresenter.subscribeToAuthState(authViewModel);

  // Subscribe to sessionManager changes
  unsubscribeSession = sessionManager.subscribe((session) => {
    console.log('🔐 AppLayout: SessionManager updated:', session?.user?.id || null);
    authViewModel.user.value = session?.user ?? null;
    authViewModel.role.value = session?.role ?? null;
  });

  // Refresh session every 5 minutes to prevent expiration
  console.log('🚀 Starting session refresh interval');
  sessionRefreshInterval = setInterval(async () => {
    if (authViewModel.user.value) {
      console.log('🔄 Refreshing session...');
      try {
        await authPresenter.loadSession(authViewModel);
        console.log('✅ Session refreshed successfully');
      } catch (error) {
        console.warn('❌ Failed to refresh session:', error);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Clear session on page unload (browser/tab close)
  const handleBeforeUnload = () => {
    if (authViewModel.user.value) {
      // Clear session data on browser close for security
      console.log('🔐 Clearing session on browser close');
      sessionManager.clearSession();
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Listen for user activity
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
  }
});

onUnmounted(() => {
  unsubscribeAuth?.();
  unsubscribeSession?.();
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
  // Clean up event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousedown', handleUserActivity);
    window.removeEventListener('keydown', handleUserActivity);
    window.removeEventListener('scroll', handleUserActivity);
    window.removeEventListener('touchstart', handleUserActivity);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
});

async function handleSignOut() {
  await authPresenter.signOut(authViewModel);
  userContextService.clearUserId();
  sessionManager.clearSession();
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
  max-width: 1440px; /* Increased from 1200px for wider screens */
  margin: 0 auto;
  padding: 0 2rem; /* Increased padding for more space on sides */
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

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 2rem; /* Increased from 1rem for more spacing */
  flex: 1; /* Take available space to center navigation */
  justify-content: center; /* Center the nav items within the flex space */
}

.nav-link {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}

.nav-link:hover {
  color: var(--color-accent, #0d9488);
  background: var(--color-bg-subtle, #f1f5f9);
}

.nav-link.router-link-active {
  color: var(--color-accent, #0d9488);
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

/* Responsive header layout */
@media (max-width: 768px) {
  .header-inner {
    padding: 0 1rem;
  }

  .header-nav {
    margin-left: 1rem;
    flex: none;
    justify-content: flex-start;
  }
}

.main-content {
  flex: 1;
  max-width: min(1120px, 95vw); /* Responsive: 95% viewport width or 1120px, whichever is smaller */
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
}

/* Allow full width on very large screens */
@media (min-width: 1400px) {
  .main-content {
    max-width: 1280px;
  }
}

@media (min-width: 1600px) {
  .main-content {
    max-width: 1440px;
  }
}
</style>

