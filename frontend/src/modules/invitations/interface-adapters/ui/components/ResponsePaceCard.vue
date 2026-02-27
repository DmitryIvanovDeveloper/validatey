<template>
  <div class="response-pace-card">
    <div class="metric-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['w-5 h-5', paceColor]">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    </div>
    <div class="metric-content">
      <div class="metric-label">Response Pace</div>
      <div class="metric-value">{{ Math.round(responsesPerDay) }}/day</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  responsesPerDay: number;
}

const props = defineProps<Props>();

const paceColor = computed(() => {
  return props.responsesPerDay > 5 ? 'text-green-600' : 'text-gray-600';
});
</script>

<style scoped>
.response-pace-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.metric-icon {
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.text-green-600 {
  color: #16a34a;
}

.text-gray-600 {
  color: #4b5563;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}
</style>