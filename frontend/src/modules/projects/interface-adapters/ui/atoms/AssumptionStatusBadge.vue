<template>
  <span
    v-if="status"
    :class="['assumption-badge', `assumption-badge--${status}`]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Status = 'confirmed' | 'need_more' | 'not_supported';

const props = withDefaults(
  defineProps<{
    status: Status | null;
    /** Labels per status. If not provided, default English labels are used. */
    statusLabels?: Partial<Record<Status, string>>;
  }>(),
  {
    statusLabels: undefined,
  }
);

const defaultLabels: Record<Status, string> = {
  confirmed: 'Confirmed',
  need_more: 'Need more',
  not_supported: 'Not supported',
};

const label = computed(() => {
  if (!props.status) return '';
  const labels = { ...defaultLabels, ...props.statusLabels };
  return labels[props.status] ?? '';
});
</script>

<style scoped>
.assumption-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}
.assumption-badge--confirmed { background: var(--color-success-bg); color: var(--color-success); }
.assumption-badge--need_more { background: var(--color-warning-bg); color: var(--color-warning); }
.assumption-badge--not_supported { background: var(--color-error-bg); color: var(--color-error); }
</style>
