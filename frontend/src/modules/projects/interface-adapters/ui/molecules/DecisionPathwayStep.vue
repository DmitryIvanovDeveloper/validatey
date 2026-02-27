<template>
  <div class="decision-pathway-step">
    <div :class="['decision-pathway-indicator', `decision-pathway-indicator--${step.status}`]"></div>
    <div class="decision-pathway-content">
      <span :class="['decision-pathway-label', `decision-pathway-label--${step.status}`]">
        {{ step.label }}
      </span>
      <router-link
        v-if="showLink && step.actionHref"
        :to="step.actionHref"
        class="decision-pathway-link"
      >
        {{ actionLabel }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  step: { id: string; label: string; status: string; actionHref?: string | null };
  showLink?: boolean;
}>();

const actionLabel = computed(() => {
  if (props.step.status === 'pending') return 'Start';
  if (props.step.status === 'in_progress') return 'Continue';
  return 'View';
});
</script>

<style scoped>
.decision-pathway-step {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.decision-pathway-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.decision-pathway-indicator--done { background: #059669; }
.decision-pathway-indicator--in_progress { background: #2563eb; }
.decision-pathway-indicator--pending { background: #d1d5db; }

.decision-pathway-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 0.5rem;
  min-width: 0;
}

.decision-pathway-label {
  font-size: 0.875rem;
  font-weight: 400;
  flex: 1;
  min-width: 0;
}

.decision-pathway-label--done { color: var(--color-text); }
.decision-pathway-label--in_progress { color: var(--color-text); }
.decision-pathway-label--pending { color: var(--color-text-muted); }

.decision-pathway-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.decision-pathway-link:hover { text-decoration: underline; }
</style>
