<template>
  <div class="early-signals-widget">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p class="loading-text">Loading early signals...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <AlertTriangle class="w-8 h-8" />
      </div>
      <h3 class="error-title">Failed to load signals</h3>
      <p class="error-description">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!signals || signals.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <h3 class="empty-title">No Early Signals Yet</h3>
      <p class="empty-description">Signals will be generated from respondent feedback and analysis.</p>
    </div>

    <!-- Signals content -->
    <div v-else class="signals-content">
      <div class="signals-by-confidence">
        <!-- High confidence -->
        <div v-if="signalsByConfidence.high.length" class="signal-confidence-group confidence-high">
          <h4 class="signal-confidence-label">
            <div class="confidence-indicator high"></div>
            High confidence (≥80%)
          </h4>
          <ul class="signal-confidence-list">
            <li v-for="signal in signalsByConfidence.high" :key="signal.id" class="signal-card" :class="`signal-${signal.type}`">
              <div class="signal-icon">
                <component :is="getSignalIconComponent(signal.type)" class="w-4 h-4" />
              </div>
              <div class="signal-content">
                <strong class="signal-title">{{ signal.title }}</strong>
                <p class="signal-desc">{{ signal.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Medium confidence -->
        <div v-if="signalsByConfidence.medium.length" class="signal-confidence-group confidence-medium">
          <h4 class="signal-confidence-label">
            <div class="confidence-indicator medium"></div>
            Medium confidence (50–80%)
          </h4>
          <ul class="signal-confidence-list">
            <li v-for="signal in signalsByConfidence.medium" :key="signal.id" class="signal-card" :class="`signal-${signal.type}`">
              <div class="signal-icon">
                <component :is="getSignalIconComponent(signal.type)" class="w-4 h-4" />
              </div>
              <div class="signal-content">
                <strong class="signal-title">{{ signal.title }}</strong>
                <p class="signal-desc">{{ signal.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Low confidence (early signals) -->
        <div v-if="signalsByConfidence.low.length" class="signal-confidence-group confidence-low">
          <h4 class="signal-confidence-label">
            <div class="confidence-indicator low"></div>
            Early signals (collecting data)
          </h4>
          <div class="confidence-note">
            <p>These signals are based on limited data. Collect more responses for higher confidence analysis.</p>
          </div>
          <ul class="signal-confidence-list">
            <li v-for="signal in signalsByConfidence.low" :key="signal.id" class="signal-card" :class="`signal-${signal.type}`">
              <div class="signal-icon">
                <component :is="getSignalIconComponent(signal.type)" class="w-4 h-4" />
              </div>
              <div class="signal-content">
                <strong class="signal-title">{{ signal.title }}</strong>
                <p class="signal-desc">{{ signal.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Info message for insufficient data -->
        <div v-if="!hasEnoughData && signals.value && signals.value.length > 0" class="info-message">
          <div class="info-icon">
            <Info class="w-5 h-5" />
          </div>
          <div class="info-content">
            <p class="info-title">Need more data</p>
            <p class="info-description">Collect at least 5 responses for meaningful signal analysis.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Zap, AlertTriangle, TrendingUp, TrendingDown, Minus, Info, AlertCircle } from 'lucide-vue-next';
import { container } from '@infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES as RESEARCH_TYPES } from '@modules/research/infrastructure/bootstrap/types';
import type { EarlySignal } from '../../domain/entities/research-canvas.entity';

interface Props {
  projectId: string;
  earlySignals?: EarlySignal[] | null;
}

const props = defineProps<Props>();

const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);

// Reactive data
const signals = ref<EarlySignal[] | null>(null);

const responseCount = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);

// Load early signals data
const loadEarlySignals = async () => {
  // If earlySignals prop is provided, use it directly
  if (props.earlySignals !== undefined) {
    signals.value = props.earlySignals;
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Get research canvas which includes early signals
    const result = await researchPresenter.getResearchCanvas(props.projectId);

    if (result.canvas?.earlySignals) {
      signals.value = result.canvas.earlySignals;
    } else {
      signals.value = null;
    }

    // For now, we don't have direct access to response count from research module
    // This could be extended to include response statistics in research data
    responseCount.value = 0;

    if (result.error) {
      error.value = result.error;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load early signals';
    console.error('Failed to load early signals:', err);
  } finally {
    loading.value = false;
  }
};

// Group signals by confidence based on response count
const signalsByConfidence = computed(() => {
  const count = responseCount.value;
  const high: any[] = [];
  const medium: any[] = [];
  const low: any[] = [];

  const currentSignals = signals.value || [];
  currentSignals.forEach((signal: any) => {
    if (count >= 15 && (signal.type === 'positive' || signal.type === 'negative')) {
      high.push(signal);
    } else if (count >= 5) {
      medium.push(signal);
    } else {
      low.push(signal);
    }
  });

  return { high, medium, low };
});

// Check if we have enough data for meaningful analysis
const hasEnoughData = computed(() => {
  return responseCount.value >= 5;
});

const getSignalIcon = (type: string) => {
  switch (type) {
    case 'positive': return '✓';
    case 'negative': return '⚠';
    case 'neutral': return 'ℹ';
    default: return '•';
  }
};

const getSignalIconComponent = (type: string) => {
  switch (type) {
    case 'positive': return TrendingUp;
    case 'negative': return TrendingDown;
    case 'neutral': return Minus;
    default: return Info;
  }
};

// Watch for prop changes and update reactive data
watch(() => props.earlySignals, (newSignals) => {
  if (newSignals !== undefined) {
    signals.value = newSignals;
    loading.value = false;
    error.value = null;
  }
}, { immediate: true });

onMounted(() => {
  loadEarlySignals();
});
</script>

<style scoped>
.early-signals-widget {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.loading-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
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
  font-size: var(--text-sm);
  margin: 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1.5rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.error-icon {
  color: var(--color-error);
}

.error-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-error);
  margin: 0;
}

.error-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1.5rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.empty-icon {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.empty-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

.signals-content {
  width: 100%;
}

.signals-by-confidence {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signal-confidence-group {
  margin: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.signal-confidence-group:hover {
  box-shadow: var(--shadow-md);
}

.signal-confidence-label {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.confidence-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.confidence-indicator.high {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
}

.confidence-indicator.medium {
  background: var(--color-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.confidence-indicator.low {
  background: var(--color-text-muted);
  box-shadow: 0 0 8px rgba(100, 116, 139, 0.2);
}

.signal-confidence-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.signal-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.signal-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.signal-positive {
  border-left: 4px solid var(--color-success);
  background: var(--color-success-bg);
}

.signal-negative {
  border-left: 4px solid var(--color-error);
  background: var(--color-error-bg);
}

.signal-neutral {
  border-left: 4px solid var(--color-accent);
  background: var(--color-accent-bg);
}

.signal-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
}

.signal-positive .signal-icon {
  background: var(--color-success);
}

.signal-negative .signal-icon {
  background: var(--color-error);
}

.signal-neutral .signal-icon {
  background: var(--color-accent);
}

.signal-content {
  flex: 1;
  min-width: 0;
}

.signal-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: block;
  line-height: 1.3;
}

.signal-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.confidence-note {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.confidence-note p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.info-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-info-bg);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-lg);
  margin-top: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.info-icon {
  flex-shrink: 0;
  color: var(--color-info);
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.info-description {
  font-size: var(--text-sm);
  color: var(--color-text);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .signal-confidence-group {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .signal-card {
    padding: 0.875rem;
    gap: 0.875rem;
  }

  .signal-icon {
    width: 1.75rem;
    height: 1.75rem;
  }

  .signal-title {
    font-size: var(--text-sm);
  }

  .confidence-note {
    padding: 0.875rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 2rem 1.5rem;
  }
}
</style>