<template>
  <Badge
    v-if="status"
    :variant="status"
    size="sm"
    :label="label"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge from '@/shared/components/atoms/Badge.vue';

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
