<template>
  <div class="response-pace-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-signals" aria-hidden="true">
          <Clock class="w-5 h-5" />
        </span>
        <div>
          <h3 class="section-title">Response Pace</h3>
          <p class="section-subtitle">Monitor response rate and trends</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="loading-text">Analyzing response pace...</p>
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
          <div class="metric-card metric-primary">
            <div class="metric-header">
              <span class="metric-icon">
                <TrendingUp class="w-5 h-5" />
              </span>
              <h4 class="metric-title">Daily Response Rate</h4>
            </div>
            <div class="metric-content">
              <p class="metric-value">{{ currentPace }}/day</p>
              <p class="metric-note">7-day average</p>
            </div>
          </div>

          <div class="metric-card metric-secondary">
            <div class="metric-header">
              <span class="metric-icon">
                <Target class="w-5 h-5" />
              </span>
              <h4 class="metric-title">Target Pace</h4>
            </div>
            <div class="metric-content">
              <p class="metric-value">{{ targetPace }}/day</p>
              <p class="metric-note">Goal</p>
            </div>
          </div>
        </div>

        <!-- Progress towards target -->
        <div v-if="targetPace > 0" class="pace-progress">
          <div class="progress-header">
            <span class="progress-label">Progress to target</span>
            <span class="progress-value">{{ Math.round((currentPace / targetPace) * 100) }}%</span>
          </div>
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
        </div>

        <!-- Response trend -->
        <div class="pace-trend">
          <h4 class="trend-title">Response Trend</h4>
          <div class="trend-grid">
            <div class="trend-item">
              <div class="trend-value">{{ yesterdayResponses }}</div>
              <div class="trend-label">Yesterday</div>
            </div>
            <div class="trend-item">
              <div class="trend-value">{{ lastWeekAvg }}</div>
              <div class="trend-label">7-day avg</div>
            </div>
            <div class="trend-item">
              <div class="trend-value">{{ thisWeekTotal }}</div>
              <div class="trend-label">This week</div>
            </div>
          </div>
        </div>

        <!-- Insights -->
        <div v-if="insights.length > 0" class="pace-insights">
          <h4 class="insights-title">Insights</h4>
          <div class="insights-list">
            <div
              v-for="insight in insights"
              :key="insight.id"
              class="insight-item"
            >
              <span class="insight-icon" aria-hidden="true">
                <AlertCircle class="w-4 h-4" />
              </span>
              <p class="insight-text">{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, withDefaults } from 'vue';
import { Clock, AlertCircle, TrendingUp, Target } from 'lucide-vue-next';
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
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.section-icon-signals {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  margin: 0;
}


.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: loading-dots 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  color: var(--color-text-muted);
  font-size: 0.875rem;
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
  gap: 1.5rem;
}

.pace-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metric-card {
  background: var(--color-background-light);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-light);
  padding: 1rem;
}

.metric-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-primary .metric-title,
.metric-primary .metric-value,
.metric-primary .metric-note {
  color: white;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.metric-secondary .metric-icon {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.metric-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.metric-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
  line-height: var(--leading-none);
}

.metric-note {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  margin: 0;
}

.pace-progress {
  background: var(--color-background-light);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-light);
  padding: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--color-background);
  border-radius: 0.25rem;
  overflow: hidden;
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
  background: var(--color-background-light);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-light);
  padding: 1rem;
}

.trend-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-4) 0;
}

.trend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-4);
}

.trend-item {
  text-align: center;
}

.trend-value {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
  line-height: var(--leading-none);
}

.trend-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.pace-insights {
  background: #fef3c7;
  border-radius: 0.5rem;
  border: 1px solid #f59e0b;
  padding: 1rem;
}

.insights-title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.75rem 0;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.insight-icon {
  color: #d97706;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.insight-text {
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
  line-height: 1.4;
}
</style>