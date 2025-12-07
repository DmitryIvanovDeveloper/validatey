<template>
  <div class="progress-bar">
    <div class="progress-bar-track">
      <div
        class="progress-bar-fill"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <span class="progress-text">{{ current }} / {{ total }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  current: number;
  total: number;
}>();

const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.current / props.total) * 100);
});
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar-track {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #007AFF;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #666;
  min-width: 60px;
  text-align: right;
}
</style>


