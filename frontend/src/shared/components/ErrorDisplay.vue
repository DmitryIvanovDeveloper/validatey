<template>
  <div v-if="displayError" class="error-display">
    <div class="error-icon">⚠️</div>
    <div class="error-content">
      <h3>{{ title || 'Error' }}</h3>
      <p>{{ displayError }}</p>
    </div>
    <button v-if="dismissible" @click="$emit('dismiss')" class="dismiss-button">×</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    error?: string | null;
    message?: string | null;
    title?: string;
    dismissible?: boolean;
  }>(),
  { error: null, message: null }
);
const displayError = computed(() => props.error ?? props.message);

defineEmits<{
  dismiss: [];
}>();
</script>

<style scoped>
.error-display {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-error-bg);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
}

.error-icon {
  font-size: 1.5rem;
}

.error-content {
  flex: 1;
}

.error-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.error-content p {
  margin: 0;
  font-size: 0.875rem;
}

.dismiss-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-error);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dismiss-button:hover {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}
</style>



