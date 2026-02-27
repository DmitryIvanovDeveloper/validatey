<template>
  <SectionCard>
    <template #header>
      <h3 class="section-title">{{ title }}</h3>
    </template>
    <p class="guest-placeholder-text">{{ message }}</p>
    <router-link to="/login" class="guest-placeholder-link">{{ signInLabel }}</router-link>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from '../../../../../shared/components/SectionCard.vue';

withDefaults(
  defineProps<{
    title: string;
    message: string;
    signInLabel?: string;
  }>(),
  { signInLabel: 'Sign in' }
);
</script>

<style scoped>
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.guest-placeholder-text {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem 0;
}

.guest-placeholder-link {
  font-size: 0.875rem;
  color: var(--color-accent);
  text-decoration: none;
}

.guest-placeholder-link:hover {
  text-decoration: underline;
}
</style>
