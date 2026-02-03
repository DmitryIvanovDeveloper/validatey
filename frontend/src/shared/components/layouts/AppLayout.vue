<template>
  <div class="app-layout">
    <nav class="navbar" v-if="showNavbar">
      <div class="navbar-content">
        <router-link to="/" class="logo">Validatey</router-link>
        <div class="nav-links">
          <router-link to="/projects">Projects</router-link>
          <router-link to="/projects/new">Create Project</router-link>
          <template v-if="authViewModel.user.value">
            <span class="user-email">{{ authViewModel.user.value.email ?? authViewModel.user.value.displayName ?? 'User' }}</span>
            <button type="button" class="btn-sign-out" :disabled="authViewModel.loading.value" @click="handleSignOut">Sign out</button>
          </template>
          <template v-else>
            <button type="button" class="btn-sign-in" :disabled="authViewModel.loading.value" @click="handleSignIn">Sign in with Google</button>
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
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/auth/infrastructure/bootstrap/types';
import type { AuthPresenter } from '@/modules/auth/interface-adapters/presenters/auth.presenter';
import { AuthViewModel } from '@/modules/auth/interface-adapters/view-models/auth.view-model';
import { userContextService } from '@/shared/services/user-context.service';

const route = useRoute();
const authViewModel = new AuthViewModel();
const authPresenter = container.get<AuthPresenter>(TYPES.AuthPresenter);
let unsubscribeAuth: (() => void) | null = null;

const showNavbar = computed(() => {
  return route.meta.hideNavbar !== true;
});

watch(
  () => authViewModel.user.value,
  (user) => {
    if (user) {
      userContextService.setUserId(user.id);
    } else {
      userContextService.clearUserId();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await authPresenter.loadSession(authViewModel);
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
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #2d3748;
}

.user-email {
  color: #4a5568;
  font-size: 0.9rem;
}

.btn-sign-in,
.btn-sign-out {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-sign-in {
  background: #1a73e8;
  color: #fff;
}

.btn-sign-in:hover:not(:disabled) {
  background: #1557b0;
}

.btn-sign-out {
  background: transparent;
  color: #4a5568;
}

.btn-sign-out:hover:not(:disabled) {
  color: #2d3748;
}

.btn-sign-in:disabled,
.btn-sign-out:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
</style>

