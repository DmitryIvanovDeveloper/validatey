<template>
  <span
    :class="[
      'badge',
      variant && `badge--${variant}`,
      size && `badge--${size}`,
      customClass
    ]"
  >
    <slot>{{ displayText }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'confirmed' | 'need_more' | 'not_supported' | 'neutral' | null;
type Size = 'sm' | 'md' | 'lg';

interface Props {
  /** The variant determines the semantic meaning */
  variant?: Variant;
  /** Size variant for the badge */
  size?: Size;
  /** Optional label if not using slot */
  label?: string;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
});

// Computed property for custom class
const customClass = computed(() => props.class);

const displayText = computed(() => {
  if (props.label) return props.label;

  switch (props.variant) {
    case 'confirmed':
      return 'Confirmed';
    case 'need_more':
      return 'Need more';
    case 'not_supported':
      return 'Not supported';
    case null:
    case 'neutral':
    default:
      return '';
  }
});
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Size variants */
.badge--sm {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
}

.badge--md {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
}

.badge--lg {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}

/* Variant styles - colors only, no background or border */
.badge--confirmed {
  color: var(--color-success);
}

.badge--need_more {
  color: var(--color-warning);
}

.badge--not_supported {
  color: var(--color-error);
}

.badge--neutral {
  color: var(--color-text-muted);
}
</style>