<template>
  <div class="response-pace-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
          <h3 class="section-title">Response Pace</h3>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <p class="loading-text">Loading...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="state state-error">
        <span class="state-icon" aria-hidden="true">
          <AlertCircle class="w-8 h-8" />
        </span>
        <p class="state-title">Failed to load response pace</p>
        <p class="state-desc">{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else class="pace-content">
        <!-- Main metrics -->
        <div class="pace-metrics">
          <div class="metric-item">
            <span class="metric-label">Current</span>
            <span class="metric-value">{{ currentPace }}/day</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Target</span>
            <span class="metric-value">{{ targetPace }}/day</span>
          </div>
        </div>

        <!-- Progress towards target -->
        <div v-if="targetPace > 0" class="pace-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{
                'progress-excellent': (currentPace / targetPace) >= 0.8,
                'progress-good': (currentPace / targetPace) >= 0.5 && (currentPace / targetPace) < 0.8,
                'progress-low': (currentPace / targetPace) < 0.5
              }"
              :style="{ width: `${Math.min((currentPace / targetPace) * 100, 100)}%` }"
            ></div>
          </div>
          <div class="progress-label">{{ Math.round((currentPace / targetPace) * 100) }}%</div>
        </div>

        <!-- Response trend -->
        <div class="pace-trend">
          <div class="trend-grid">
            <div class="trend-item">
              <span class="trend-value">{{ yesterdayResponses }}</span>
              <span class="trend-label">Yesterday</span>
            </div>
            <div class="trend-item">
              <span class="trend-value">{{ lastWeekAvg }}</span>
              <span class="trend-label">7d avg</span>
            </div>
            <div class="trend-item">
              <span class="trend-value">{{ thisWeekTotal }}</span>
              <span class="trend-label">This week</span>
            </div>
          </div>
        </div>

        <!-- Insights -->
        <div v-if="insights.length > 0" class="pace-insights">
            <div
              v-for="insight in insights"
              :key="insight.id"
              class="insight-item"
            >
              <p class="insight-text">{{ insight.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, withDefaults } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResponsePresenter } from '../presenters/response.presenter';
import type { ResponsePaceData } from '../presenters/response.presenter';
import { TYPES } from '../../infrastructure/bootstrap/types';

interface Props {
  projectId: string;
  targetPace?: number; // Target responses per day
  externalLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  targetPace: 5,
  externalLoading: false,
});

const responsePresenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);
const paceData = ref<ResponsePaceData>({
  currentPace: 0,
  yesterdayResponses: 0,
  lastWeekAvg: 0,
  thisWeekTotal: 0,
  insights: []
});
const internalLoading = ref(true);
const error = ref<string | null>(null);

// Combined loading state that considers both internal and external loading
const loading = computed(() => internalLoading.value || props.externalLoading);

// Reactive computed properties for template
const currentPace = computed(() => paceData.value.currentPace);
const yesterdayResponses = computed(() => paceData.value.yesterdayResponses);
const lastWeekAvg = computed(() => paceData.value.lastWeekAvg);
const thisWeekTotal = computed(() => paceData.value.thisWeekTotal);
const insights = computed(() => paceData.value.insights);

const loadResponsePace = async () => {
  try {
    internalLoading.value = true;
    error.value = null;

    const result = await responsePresenter.getResponsePace(props.projectId, props.targetPace || 5);

    if (result.error) {
      error.value = result.error;
    } else {
      paceData.value = result.data;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load response pace data';
  } finally {
    internalLoading.value = false;
  }
};

onMounted(() => {
  loadResponsePace();
});

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    loadResponsePace();
  }
}, { immediate: false });
</script>

<style scoped>
.response-pace-widget {
  width: 100%;
}

.section-card {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  padding: 1rem;
}

.section-card-header {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}


.loading-state {
  padding: 1rem 0;
}

.loading-text {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  gap: 0.75rem;
}

.state-error .state-icon {
  color: #ef4444;
}

.state-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
}

.state-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.pace-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pace-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.pace-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 0.375rem;
  background: var(--color-bg-subtle, #f1f5f9);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: right;
  margin: 0;
}

.progress-fill {
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.progress-excellent {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-low {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.pace-trend {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.trend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.trend-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.trend-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.trend-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.pace-insights {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
}

.insight-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}
</style>