<template>
  <div class="landing-view">
    <EmptyState
      title="Welcome to Validatey!"
      description="Sign in to create and manage your validation projects"
      :icon="true"
    >
      <template #icon>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      </template>
      <template #action>
        <router-link to="/login" class="btn btn-primary btn-large">Sign in</router-link>
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import EmptyState from './EmptyState.vue';
</script>

<style scoped>
.landing-view {
  padding: 0;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 1.125rem;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}
</style>
