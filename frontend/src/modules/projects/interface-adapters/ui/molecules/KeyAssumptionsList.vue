<template>
  <div class="key-assumptions-section" role="region" aria-label="Key Assumptions: status and evidence per assumption">
    <ul class="key-assumptions-list">
      <AssumptionCard
        v-for="assumption in assumptions"
        :key="assumption.id"
        :label-html="formatMarkdown(assumption.text)"
        :status="getStatus(assumption.id)"
        :evidence-html="getEvidence(assumption.id)"
        :evidence-label="getEvidenceLabel(assumption.id)"
        :expanded="expandedIds.has(assumption.id)"
        @toggle="$emit('toggle', assumption.id)"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import AssumptionCard from './AssumptionCard.vue';

defineProps<{
  assumptions: ReadonlyArray<{ id: string; text: string }>;
  getStatus: (id: string) => 'confirmed' | 'need_more' | 'not_supported' | 'not_testable' | 'disproven' | null;
  getEvidence: (id: string) => string | null;
  getEvidenceLabel: (id: string) => string;
  expandedIds: Set<string>;
  formatMarkdown: (text: string) => string;
}>();

defineEmits<{
  toggle: [id: string];
}>();
</script>

<style scoped>
.key-assumptions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
</style>
