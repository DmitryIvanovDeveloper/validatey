<template>
  <div class="ai-verdict-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-signals" aria-hidden="true">
          <Brain class="w-5 h-5" />
        </span>
        <div>
          <h3 class="section-title">AI Verdict</h3>
          <p class="section-subtitle">Analysis of response data and patterns</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="loading-text">Analyzing response data...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="state state-error">
        <span class="state-icon" aria-hidden="true">
          <AlertCircle class="w-8 h-8" />
        </span>
        <p class="state-title">Failed to generate AI verdict</p>
        <p class="state-desc">{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else-if="verdictData" class="verdict-content">
        <div class="ai-verdict-card" :class="getVerdictClass(verdictData.type)">
          <div class="verdict-icon">
            <CheckCircle v-if="verdictData.type === 'positive'" />
            <AlertCircle v-else />
          </div>
          <div class="verdict-content">
            <div class="verdict-title">
              AI Verdict: {{ verdictData.label }}
            </div>
            <div class="verdict-description">
              {{ verdictData.verdict }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CheckCircle, AlertCircle, Brain } from 'lucide-vue-next';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResponsePresenter } from '../../presenters/response.presenter';
import type { AiVerdictData } from '../../presenters/response.presenter';
import { TYPES } from '../../infrastructure/bootstrap/types';

interface Props {
  projectId: string;
  sentInvitations: number;
  projectDeadline?: Date;
}

const props = defineProps<Props>();

const responsePresenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);
const verdictData = ref<AiVerdictData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const getVerdictClass = (type: 'positive' | 'negative' | 'neutral'): string => {
  return `verdict-${type}`;
};

const loadAiVerdict = async () => {
  try {
    loading.value = true;
    error.value = null;

    const result = await responsePresenter.getAiVerdict(props.projectId, {
      sentInvitations: props.sentInvitations,
      projectDeadline: props.projectDeadline
    });

    if (result.error) {
      error.value = result.error;
    } else {
      verdictData.value = result.data;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load AI verdict';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAiVerdict();
});
</script>

<style scoped>
.ai-verdict-widget {
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

.verdict-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-verdict-card {
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.verdict-positive {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.verdict-negative {
  background: #fef2f2;
  border: 1px solid #fee2e2;
}

.verdict-neutral {
  background: #fefce8;
  border: 1px solid #fde68a;
}

.verdict-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 0.125rem;
}

.verdict-positive .verdict-icon {
  color: #16a34a;
}

.verdict-negative .verdict-icon {
  color: #dc2626;
}

.verdict-neutral .verdict-icon {
  color: #d97706;
}

.verdict-content {
  flex: 1;
}

.verdict-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.verdict-positive .verdict-title {
  color: #166534;
}

.verdict-negative .verdict-title {
  color: #991b1b;
}

.verdict-neutral .verdict-title {
  color: #92400e;
}

.verdict-description {
  font-size: 0.875rem;
  line-height: 1.5;
}

.verdict-positive .verdict-description {
  color: #166534;
}

.verdict-negative .verdict-description {
  color: #991b1b;
}

.verdict-neutral .verdict-description {
  color: #92400e;
}
</style>