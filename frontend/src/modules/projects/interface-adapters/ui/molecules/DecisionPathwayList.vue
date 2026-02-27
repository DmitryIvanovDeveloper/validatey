<template>
  <div class="decision-pathway-list">
    <DecisionPathwayStep
      v-for="step in steps"
      :key="step.id"
      :step="step"
      :show-link="showLinks"
    />
  </div>
</template>

<script setup lang="ts">
import DecisionPathwayStep from './DecisionPathwayStep.vue';

defineProps<{
  steps: ReadonlyArray<{ id: string; label: string; status: string; actionHref?: string | null }>;
  showLinks?: boolean;
}>();
</script>

<style scoped>
.decision-pathway-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
