<template>
  <div class="research-overview-widget">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <svg class="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p class="loading-text">Loading research data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="error-text">{{ error }}</p>
      <button @click="loadData" class="retry-btn">
        Try Again
      </button>
    </div>

    <div v-else-if="canvas" class="research-content">
      <div class="research-header">
        <h3 class="research-title">Research Overview</h3>
        <div class="research-stats">
          <div class="stat-item">
            <span class="stat-label">Market Data</span>
            <span class="stat-value">{{ Object.keys(canvas.marketData || {}).length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Competitors</span>
            <span class="stat-value">{{ canvas.competitorInfo?.competitors?.length || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Signals</span>
            <span class="stat-value">{{ Object.keys(canvas.userInsights || {}).length }}</span>
          </div>
        </div>
      </div>

      <div v-if="canvas.canvas && Object.keys(canvas.canvas).length > 0" class="canvas-preview">
        <div class="canvas-section">
          <h4>Market Analysis</h4>
          <div class="canvas-content">
            <div v-if="canvas.canvas.marketData && Object.keys(canvas.canvas.marketData).length > 0">
              <div class="data-item" v-for="(value, key) in canvas.canvas.marketData" :key="key">
                <span class="data-key">{{ key }}:</span>
                <span class="data-value">{{ typeof value === 'object' ? JSON.stringify(value) : value }}</span>
              </div>
            </div>
            <div v-else class="no-data">No market data available</div>
          </div>
        </div>
      </div>

      <div v-else class="no-research">
        <div class="no-research-icon">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </div>
        <h4 class="no-research-title">No Research Data Yet</h4>
        <p class="no-research-text">Start your first research to see insights and analysis here.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { GetResearchCanvasResponse } from '../../domain/types/research.types';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const researchPresenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

const loading = ref(true);
const error = ref<string | null>(null);
const canvas = ref<GetResearchCanvasResponse | null>(null);

const loadData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const result = await researchPresenter.getResearchCanvas(props.projectId);
    canvas.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load research data';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// Expose reload method for parent components
defineExpose({
  reload: loadData
});
</script>

<style scoped>
.research-overview-widget {
  @apply bg-white rounded-lg border border-gray-200 p-6;
}

.loading-state, .error-state, .no-research {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.loading-spinner {
  @apply text-blue-600 mb-4;
}

.loading-text, .error-text, .no-research-text {
  @apply text-gray-600 mb-4;
}

.error-icon {
  @apply text-red-500 mb-4;
}

.retry-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
}

.research-content {
  @apply space-y-6;
}

.research-header {
  @apply border-b border-gray-200 pb-4;
}

.research-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.research-stats {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply bg-gray-50 rounded-lg p-3 text-center;
}

.stat-label {
  @apply text-sm text-gray-600 block;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900;
}

.canvas-preview {
  @apply space-y-4;
}

.canvas-section {
  @apply bg-gray-50 rounded-lg p-4;
}

.canvas-section h4 {
  @apply font-medium text-gray-900 mb-3;
}

.canvas-content {
  @apply space-y-2;
}

.data-item {
  @apply flex justify-between items-center py-1;
}

.data-key {
  @apply font-medium text-gray-700;
}

.data-value {
  @apply text-gray-600 text-sm max-w-xs truncate;
}

.no-data {
  @apply text-gray-500 italic;
}

.no-research-icon {
  @apply text-gray-400 mb-4;
}

.no-research-title {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.no-research-text {
  @apply text-gray-600;
}
</style>