<template>
  <div class="admin-layout">
    <header class="admin-header" role="banner">
      <div class="admin-header-inner">
        <router-link to="/admin/users" class="admin-brand" aria-label="Validatey Admin">
          <span class="admin-brand-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="admin-brand-text">Validatey</span>
        </router-link>
        <span class="admin-header-badge">Admin</span>
        <div class="admin-header-actions">
          <button type="button" class="admin-sign-out" @click="handleSignOut">Sign out</button>
        </div>
      </div>
    </header>
    <nav class="admin-tabs" aria-label="Admin sections">
      <router-link to="/admin/users" class="admin-tab" active-class="admin-tab--active">
        <span class="admin-tab__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 11l2 2 4-4"/></svg>
        </span>
        Users
      </router-link>
      <router-link to="/admin/wishlist" class="admin-tab" active-class="admin-tab--active">
        <span class="admin-tab__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c.552 0 1 .448 1 1v6c0 .552-.448 1-1 1H3c-.552 0-1-.448-1-1v-6c0-.552.448-1 1-1h7.5"/><circle cx="7.5" cy="12" r="1"/><circle cx="16.5" cy="12" r="1"/></svg>
        </span>
        Waitlist
      </router-link>
      <router-link to="/admin/feedback" class="admin-tab" active-class="admin-tab--active">
        <span class="admin-tab__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        Feedback
      </router-link>
    </nav>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { container } from '../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '../../../modules/auth/interface-adapters/presenters/auth.presenter';
import { AuthViewModel } from '../../../modules/auth/interface-adapters/view-models/auth.view-model';

const router = useRouter();
const authViewModel = new AuthViewModel();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);

async function handleSignOut() {
  await authPresenter.signOut(authViewModel);
  await router.replace('/login?signedOut=true');
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page, #f1f5f9);
}

.admin-header {
  flex-shrink: 0;
  background: var(--color-bg, #fff);
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.admin-header-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-accent, #0d9488);
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
}

.admin-brand:hover {
  color: var(--color-accent-hover, #0f766e);
}

.admin-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-header-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #475569);
  background: var(--color-bg-subtle, #e2e8f0);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-left: 0.25rem;
}

.admin-header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.admin-sign-out {
  padding: 0.4rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-muted, #475569);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.admin-sign-out:hover {
  background: var(--color-bg-subtle, #e2e8f0);
  color: var(--color-text, #0f172a);
}

.admin-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 0.25rem;
  padding: 0 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  background: var(--color-bg, #fff);
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.admin-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #475569);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.admin-tab:hover {
  color: var(--color-text, #0f172a);
}

.admin-tab--active {
  color: var(--color-accent, #0d9488);
  border-bottom-color: var(--color-accent, #0d9488);
}

.admin-tab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
}

.admin-main {
  flex: 1;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  background: var(--color-bg, #fff);
  border-radius: 0.75rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>
