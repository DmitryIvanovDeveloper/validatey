<template>
  <div class="comment-patterns-widget">
    <!-- Header -->
    <div class="cpw-header">
      <h3 class="cpw-title">Comment Pattern Analysis</h3>
      <div v-if="analysis" class="cpw-score-info">
        <span class="cpw-score-label">{{ scoreLabel }}</span>
        <div class="cpw-progress-bar">
          <div class="cpw-progress-fill" :class="scoreBadgeClass" :style="{ width: (analysis.validationScore || 0) + '%' }"></div>
        </div>
        <p class="cpw-score-explanation">{{ scoreExplanation }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cpw-loading">
      <div class="cpw-progress-bar">
        <div class="cpw-progress-fill cpw-progress-loading"></div>
      </div>
      <span>Analyzing {{ analysis?.totalComments || 0 }} comments…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cpw-empty">
      <p>{{ error }}</p>
    </div>

    <!-- No data -->
    <div v-else-if="!analysis || analysis.totalComments === 0" class="cpw-empty">
      <svg class="cpw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
      <p>No comments collected yet.</p>
      <p class="cpw-empty-hint">Add Reddit or HackerNews sources in the Comments tab to collect data.</p>
    </div>

    <!-- Patterns list -->
    <div v-else class="cpw-patterns">
      <div
        v-for="pattern in analysis.patterns"
        :key="pattern.type"
        class="cpw-pattern-card"
      >
        <div class="cpw-pattern-header">
          <div class="cpw-pattern-label-row">
            <span class="cpw-pattern-type-dot" :class="`cpw-dot--${pattern.type}`"></span>
            <span class="cpw-pattern-label">{{ pattern.label }}</span>
            <span class="cpw-pattern-count">{{ pattern.count }}</span>
            <span class="cpw-pattern-pct">{{ pattern.percentage }}%</span>
          </div>
        </div>
        <div class="cpw-pattern-bar-wrap">
          <div class="cpw-pattern-bar" :class="`cpw-bar--${pattern.type}`" :style="{ width: pattern.percentage + '%' }"></div>
        </div>
        <p class="cpw-pattern-insight">{{ pattern.insight }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../types';
import type { GetCommentPatternsUseCase } from '../../application/use-cases/get-comment-patterns.use-case';
import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const analysis = ref<CommentPatternAnalysis | null>(null);

const scoreBadgeClass = computed(() => {
  const score = analysis.value?.validationScore ?? 0;
  if (score >= 60) return 'cpw-score--high';
  if (score >= 30) return 'cpw-score--medium';
  return 'cpw-score--low';
});

const scoreLabel = computed(() => {
  const score = analysis.value?.validationScore ?? 0;
  if (score >= 60) return `Strong Evidence (${score}%)`;
  if (score >= 30) return `Moderate Evidence (${score}%)`;
  return `Early Stage (${score}%)`;
});

const scoreExplanation = computed(() => {
  const score = analysis.value?.validationScore ?? 0;
  if (score >= 60) return 'Hypothesis supported by data. Strong validation signals from comments.';
  if (score >= 30) return 'Mixed signals. More data needed for clear validation.';
  return 'Too little data or weak support. Collect more comments for analysis.';
});

async function loadPatterns(): Promise<void> {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;

  try {
    const useCase = container.get<GetCommentPatternsUseCase>(COMMENT_TYPES.GetCommentPatternsUseCase);
    const result = await useCase.execute(props.projectId);

    if (result.isSuccess) {
      analysis.value = result.data;
    } else {
      error.value = result.error?.message ?? 'Failed to load pattern analysis';
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load pattern analysis';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPatterns();
});
</script>

<style scoped>
.comment-patterns-widget {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
}

.cpw-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.cpw-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.75rem 0;
}

.cpw-score-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cpw-score-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.cpw-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.cpw-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.cpw-progress-fill.cpw-score--high {
  background: var(--color-success);
}

.cpw-progress-fill.cpw-score--medium {
  background: var(--color-warning);
}

.cpw-progress-fill.cpw-score--low {
  background: var(--color-text-muted);
}

.cpw-progress-loading {
  background: var(--color-accent);
  animation: cpw-progress-loading 1.5s ease-in-out infinite;
}

@keyframes cpw-progress-loading {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

.cpw-score-explanation {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.cpw-loading {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.cpw-empty {
  padding: 1.5rem 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.cpw-empty-icon {
  width: 1.5rem;
  height: 1.5rem;
  margin: 0 auto 0.5rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.cpw-empty-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}

.cpw-patterns {
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cpw-pattern-card {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.cpw-pattern-card:last-child {
  border-bottom: none;
}

.cpw-pattern-header {
  margin-bottom: 0.5rem;
}

.cpw-pattern-label-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.cpw-pattern-type-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cpw-dot--myth { background: var(--color-warning); }
.cpw-dot--failure { background: var(--color-error); }
.cpw-dot--advice { background: var(--color-success); }
.cpw-dot--validation { background: var(--color-accent); }

.cpw-pattern-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
}

.cpw-pattern-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.cpw-pattern-pct {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: right;
}

.cpw-pattern-bar-wrap {
  height: 4px;
  background: var(--color-bg-subtle);
  border-radius: 2px;
  overflow: hidden;
}

.cpw-pattern-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.cpw-bar--myth { background: var(--color-warning); }
.cpw-bar--failure { background: var(--color-error); }
.cpw-bar--advice { background: var(--color-success); }
.cpw-bar--validation { background: var(--color-accent); }

.cpw-pattern-insight {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.375rem 0 0;
  line-height: 1.5;
}

</style>
