<template>
  <div class="app-layout">
    <header v-if="showNavbar" class="header" role="banner">
      <div class="header-inner">
        <router-link to="/workspaces" class="brand" aria-label="Validatey home">
          <span class="brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="brand-text">Validatey</span>
        </router-link>
        <nav v-if="currentUser" class="header-nav" aria-label="Main">
          <router-link v-if="currentRole === 'admin'" to="/admin/users" class="nav-link">Users</router-link>
        </nav>
        <div class="header-actions">
          <template v-if="currentUser">
            <div class="user-badge" :title="currentUser.email ?? undefined">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-name">{{ userDisplayName }}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click="handleSignOut">Sign out</button>
          </template>
        </div>
      </div>
    </header>
    <div class="body-wrap">
      <aside v-if="showNavbar && currentUser" class="sidebar" aria-label="Workspaces">
        <WorkspaceSidebar />
      </aside>
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { container } from '../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '../../../modules/auth/interface-adapters/presenters/auth.presenter';
import type { AuthSession } from '../../../modules/auth/application/ports/auth-service.port';
import { sessionManager } from '../../services/session-manager';
import WorkspaceSidebar from '../../../modules/workspaces/interface-adapters/ui/components/WorkspaceSidebar.vue';

const route = useRoute();
const router = useRouter();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);

// Reactive session state using SessionManager
const session = ref<AuthSession | null>(null);

// Computed properties for template
const isAuthenticated = computed(() => !!session.value);
const currentUser = computed(() => session.value?.user || null);
const currentRole = computed(() => session.value?.role ?? 'user');

const userDisplayName = computed(() => {
  const user = currentUser.value;
  if (!user) return '';
  return user.email ?? user.displayName ?? 'User';
});

const userInitial = computed(() => {
  const name = userDisplayName.value;
  if (!name) return '?';
  const part = name.trim().split(/[\s@]/).find(Boolean) ?? '';
  return part.charAt(0).toUpperCase() || '?';
});

const showNavbar = computed(() => {
  return route.meta.hideNavbar !== true;
});

// Subscribe to session changes from SessionManager
let unsubscribeSession: (() => void) | null = null;

// Session refresh interval
let sessionRefreshInterval: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();

// User activity handler
const handleUserActivity = () => {
  const now = Date.now();
  if (now - lastActivityTime > 10 * 60 * 1000 && sessionManager.isAuthenticated) { // 10 minutes
    console.log('🔄 Refreshing session due to user activity...');
    lastActivityTime = now;
    sessionManager.refreshSession().catch(error => {
      console.warn('❌ Failed to refresh session on activity:', error);
    });
  } else {
    lastActivityTime = now;
  }
};

onMounted(async () => {
  console.log('🔍 APP LAYOUT: onMounted called');

  // Session manager is already initialized in main.ts
  console.log('🔍 APP LAYOUT: Session manager should already be initialized');

  // Subscribe to session changes
  unsubscribeSession = sessionManager.subscribe((newSession) => {
    session.value = newSession;

    // Dispatch event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('validatey-user-id-synced'));
    }
  });

  console.log('🔍 APP LAYOUT: onMounted completed');

  // Refresh session every 5 minutes to prevent expiration
  console.log('🚀 Starting session refresh interval');
  sessionRefreshInterval = setInterval(async () => {
    if (sessionManager.isAuthenticated) {
      console.log('🔄 Refreshing session...');
      try {
        await sessionManager.refreshSession();
        console.log('✅ Session refreshed successfully');
      } catch (error) {
        console.warn('❌ Failed to refresh session:', error);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Listen for user activity
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
  }
});

onUnmounted(() => {
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
  }

});

async function handleSignOut() {
  // Clear session using SessionManager
  sessionManager.clearSession();

  // Sign out via auth presenter (clears cookies)
  await authPresenter.signOut();

  await router.replace('/login');
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page, #fbf7eb);
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg-page);
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

/* Responsive: hide sidebar on small screens */
@media (max-width: 900px) {
  .sidebar {
    display: none;
  }
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

.body-wrap {
  flex: 1;
  display: flex;
  min-height: 0;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

.sidebar {
  width: 14rem;
  flex-shrink: 0;
  background: var(--color-bg-page);
  border-right: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  min-width: 0;
  max-width: min(1120px, 95vw);
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

