<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" role="status" aria-live="polite">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  message?: string;
  duration?: number;
}>();

const visible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const emit = defineEmits<{ dismiss: [] }>();

watch(
  () => props.show,
  (show) => {
    if (show) {
      visible.value = true;
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        visible.value = false;
        hideTimer = null;
        emit('dismiss');
      }, props.duration ?? 2500);
    } else {
      visible.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-text, #1e293b);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1100;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}
</style>
