<template>
  <div class="section-card">
    <div v-if="$slots.header || title" class="section-card-header">
      <slot name="header">
        <div v-if="title" class="section-title-wrapper">
          <h3 class="section-title">{{ title }}</h3>
          <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </div>
    <div class="section-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<style scoped>
.section-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  margin-bottom: 1.5rem;
}

.section-title-wrapper {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  margin: 0;
}

.section-subtitle {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
}

</style>