<template>
  <div class="section-hint" ref="rootRef">
    <button
      type="button"
      class="section-hint__btn"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="toggle"
    >
      ?
    </button>
    <Transition name="section-hint-popover">
      <div
        v-show="isOpen"
        class="section-hint__popover"
        role="tooltip"
        :id="popoverId"
      >
        <p class="section-hint__text">{{ text }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

interface Props {
  /** Hint text (English). Shown in tooltip. */
  text: string;
  /** Optional aria-label for the button. */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Section hint',
});

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const popoverId = `section-hint-${Math.random().toString(36).slice(2, 9)}`;

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.section-hint {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
}

.section-hint__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-text-muted, #6b7280);
  background: var(--color-bg-muted, #f3f4f6);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.section-hint__btn:hover {
  color: var(--color-text, #374151);
  background: var(--color-bg-hover, #e5e7eb);
  border-color: var(--color-border-hover, #d1d5db);
}

.section-hint__btn:focus-visible {
  outline: 2px solid var(--color-focus, #0ea5e9);
  outline-offset: 2px;
}

.section-hint__popover {
  position: absolute;
  z-index: 50;
  left: 0;
  bottom: calc(100% + 0.5rem);
  max-width: 20rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--color-text, #1f2937);
  background: var(--color-bg-elevated, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-hint__text {
  margin: 0;
}

.section-hint-popover-enter-active,
.section-hint-popover-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.section-hint-popover-enter-from,
.section-hint-popover-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
