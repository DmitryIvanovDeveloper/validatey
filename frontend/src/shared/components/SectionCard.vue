<template>
  <div :class="['section-card', variant && `section-card--${variant}`]">
    <div v-if="$slots.header || title" class="section-card-header">
      <slot name="header">
        <div v-if="title" class="section-title-wrapper">
          <h3 class="section-title">{{ title }}</h3>
          <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </div>
      <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
  variant?: 'dark' | 'light' | 'gradient' | 'elevated';
}

defineProps<Props>();
</script>

<style scoped>
.section-card {
  border-radius: 0.75rem;
  padding: 1.5rem;
}

/* Default variant */
.section-card:not([class*="section-card--"]) {
  background: var(--color-bg-page);
  border: var(--border-width) var(--border-style) var(--color-border-dashed, var(--color-border));
}

/* Dark variant - like Stock Taper dark sections */
.section-card--dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: none;
  color: #f8fafc;
}

.section-card--dark .section-title {
  color: #f8fafc;
}

/* Light variant */
.section-card--light {
  background: var(--color-bg-page);
  border: var(--border-width) var(--border-style) var(--color-border-dashed, var(--color-border-light));
}

/* Gradient variant */
.section-card--gradient {
  background: var(--color-bg-page);
  border: var(--border-width) var(--border-style) var(--color-border-dashed, var(--color-border-light));
}

/* Elevated variant */
.section-card--elevated {
  background: var(--color-bg-page);
  border: var(--border-width) var(--border-style) var(--color-border-dashed, var(--color-border));
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08);
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

</style>