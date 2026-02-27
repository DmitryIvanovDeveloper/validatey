<template>
  <div class="auth-redirect">
    <div class="auth-redirect__card">
      <div class="auth-redirect__header">
        <h1 class="auth-redirect__title">Validatey</h1>
        <p class="auth-redirect__subtitle">Redirecting…</p>
      </div>
      <div class="auth-redirect__body">
        <LoadingSpots inline size="lg" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue';
import LoadingSpots from './LoadingSpots.vue';

// Immediate redirect on component creation
onBeforeMount(() => {
  const sessionData = localStorage.getItem('validatey_user_id');
  const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('validatey_auth');

  if (sessionData || hasAuthCookie) {
    window.location.replace('/workspaces');
  } else {
    window.location.replace('/login');
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
  min-height: 80px;
}

</style>
