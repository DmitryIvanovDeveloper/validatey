<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <SmallSpinner
      v-if="loading && showSpinner"
      class="button-spinner"
    />
    <slot v-else>
      {{ text }}
    </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SmallSpinner from '../SmallSpinner.vue';

interface Props {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  showSpinner?: boolean;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  showSpinner: true,
  text: '',
});

const emit = defineEmits<{
  click: [event: Event];
}>();

const buttonClasses = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  {
    'btn-loading': props.loading,
    'btn-disabled': props.disabled || props.loading,
  },
]);

function handleClick(event: Event) {
  if (!props.loading && !props.disabled) {
    emit('click', event);
  }
}
</script>

<style scoped>
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md, 0.5rem);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  outline: none;
}

.btn:disabled,
.btn.btn-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-loading {
  pointer-events: none;
}

/* Variants */
.btn-primary {
  background: var(--color-accent, #0d9488);
  color: white;
  border-color: var(--color-accent, #0d9488);
}

.btn-primary:hover:not(.btn-disabled) {
  background: var(--color-accent-hover, #0f766e);
  border-color: var(--color-accent-hover, #0f766e);
}

.btn-secondary {
  background: white;
  color: var(--color-text, #374151);
  border-color: var(--color-border, #d1d5db);
}

.btn-secondary:hover:not(.btn-disabled) {
  background: var(--color-bg-subtle, #f9fafb);
  border-color: var(--color-border-light, #9ca3af);
}

.btn-danger {
  background: var(--color-error, #ef4444);
  color: white;
  border-color: var(--color-error, #ef4444);
}

.btn-danger:hover:not(.btn-disabled) {
  background: var(--color-error-hover, #dc2626);
  border-color: var(--color-error-hover, #dc2626);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted, #6b7280);
  border-color: transparent;
}

.btn-ghost:hover:not(.btn-disabled) {
  background: var(--color-bg-subtle, #f9fafb);
  color: var(--color-text, #374151);
}

/* Sizes */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

/* Loading spinner */
.button-spinner {
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.button-spinner .spinner {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  border-color: currentColor;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>