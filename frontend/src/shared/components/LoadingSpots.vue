<template>
  <div class="loading-spots" :class="[sizeClass, { 'loading-spots--inline': inline }]">
    <div class="loading-spots__dots" aria-hidden="true">
      <span v-for="i in 3" :key="i" class="loading-spots__dot" />
    </div>
    <p v-if="message && !inline" class="loading-spots__message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** Optional text below the dots */
  message?: string;
  /** Dot size: sm (5px), md (6px), lg (8px) */
  size?: 'sm' | 'md' | 'lg';
  /** Inline layout (dots only, no column, for use inside buttons or text) */
  inline?: boolean;
}>();

const sizeClass = computed(() => {
  return props.size ? `loading-spots--${props.size}` : 'loading-spots--md';
});
</script>

<style scoped>
.loading-spots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3, 0.75rem);
}

.loading-spots--inline {
  flex-direction: row;
  display: inline-flex;
  gap: 0.25rem;
}

.loading-spots__dots {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
}

.loading-spots__dot {
  border-radius: 50%;
  background: var(--color-accent, #6366f1);
  animation: loading-spots-bounce 1.4s ease-in-out infinite both;
}

.loading-spots__dot:nth-child(1) { animation-delay: 0s; }
.loading-spots__dot:nth-child(2) { animation-delay: 0.2s; }
.loading-spots__dot:nth-child(3) { animation-delay: 0.4s; }

/* sizes */
.loading-spots--sm .loading-spots__dot { width: 5px; height: 5px; }
.loading-spots--md .loading-spots__dot { width: 6px; height: 6px; }
.loading-spots--lg .loading-spots__dot { width: 8px; height: 8px; }

.loading-spots__message {
  margin: 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-muted, #6b7280);
  font-weight: var(--font-weight-medium, 500);
}

@keyframes loading-spots-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
