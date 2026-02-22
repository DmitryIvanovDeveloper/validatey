<template>
  <div class="comment-patterns-widget">
    <!-- Header -->
    <div class="cpw-header">
      <h3 class="cpw-title">Comment Pattern Analysis</h3>
      <div v-if="analysis" class="cpw-score-badge" :class="scoreBadgeClass">
        {{ scoreLabel }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cpw-loading">
      <div class="cpw-loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span>Analyzing comment patterns…</span>
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
            <span class="cpw-pattern-label">{{ pattern.label }}</span>
            <span class="cpw-pattern-count">{{ pattern.count }}</span>
            <span class="cpw-pattern-pct">{{ pattern.percentage }}%</span>
          </div>
          <div class="cpw-pattern-bar-wrap">
            <div class="cpw-pattern-bar" :class="`cpw-bar--${pattern.type}`" :style="{ width: pattern.percentage + '%' }"></div>
          </div>
        </div>

        <!-- Examples (collapsible) -->
        <div v-if="expandedPattern === pattern.type" class="cpw-examples">
          <div v-for="(ex, idx) in pattern.examples" :key="idx" class="cpw-example">
            <blockquote class="cpw-example-content" :cite="ex.url">
              {{ ex.content }}
            </blockquote>
            <div class="cpw-example-meta">
              <span class="cpw-example-author">{{ ex.author }}</span>
              <span class="cpw-example-source">{{ ex.source }}</span>
              <a v-if="ex.url" :href="ex.url" target="_blank" rel="noopener noreferrer" class="cpw-example-link">
                View
              </a>
            </div>
          </div>
        </div>

        <button
          v-if="pattern.examples.length > 0"
          class="cpw-toggle-btn"
          @click="togglePattern(pattern.type)"
          type="button"
        >
          {{ expandedPattern === pattern.type ? 'Hide' : `Show ${pattern.examples.length}` }}
          <svg class="cpw-toggle-icon" :class="{ 'cpw-toggle-icon--open': expandedPattern === pattern.type }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../types';
import type { GetCommentPatternsUseCase } from '../../application/use-cases/get-comment-patterns.use-case';
import type { CommentPatternAnalysis, PatternType } from '../../domain/entities/comment-pattern-analysis.entity';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const analysis = ref<CommentPatternAnalysis | null>(null);
const expandedPattern = ref<PatternType | null>(null);

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

function togglePattern(type: PatternType): void {
  expandedPattern.value = expandedPattern.value === type ? null : type;
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.cpw-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.cpw-score-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.cpw-score--high { background: var(--color-success-bg); color: var(--color-success); }
.cpw-score--medium { background: var(--color-warning-bg); color: var(--color-warning); }
.cpw-score--low { background: var(--color-bg-subtle); color: var(--color-text-muted); }

.cpw-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.cpw-loading-dots {
  display: flex;
  gap: 3px;
}

.cpw-loading-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6366f1;
  animation: cpw-pulse 1.2s ease-in-out infinite;
}

.cpw-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.cpw-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes cpw-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.cpw-empty {
  padding: 2rem 1.25rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.cpw-empty-icon {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 0.5rem;
  color: #d1d5db;
}

.cpw-empty-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.cpw-patterns {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cpw-pattern-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  background: var(--color-bg);
}

.cpw-pattern-header {
  margin-bottom: 0.5rem;
}

.cpw-pattern-label-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

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
  height: 6px;
  background: var(--color-bg-subtle);
  border-radius: 3px;
  overflow: hidden;
}

.cpw-pattern-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.cpw-bar--myth { background: var(--color-warning); }
.cpw-bar--failure { background: var(--color-error); }
.cpw-bar--advice { background: var(--color-success); }
.cpw-bar--validation { background: var(--color-accent); }

.cpw-examples {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
}

.cpw-example {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.75rem;
}

.cpw-example-content {
  font-size: 0.8125rem;
  color: var(--color-text);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.cpw-example-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

.cpw-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.cpw-toggle-btn:hover {
  text-decoration: underline;
}

.cpw-toggle-icon {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.2s;
}

.cpw-toggle-icon--open {
  transform: rotate(180deg);
}

.cpw-example-author {
  font-weight: 500;
}

.cpw-example-source {
  color: var(--color-text-muted);
}

.cpw-example-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
}

.cpw-example-link:hover {
  text-decoration: underline;
}
</style>
