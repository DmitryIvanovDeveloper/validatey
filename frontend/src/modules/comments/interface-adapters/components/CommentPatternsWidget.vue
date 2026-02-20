<template>
  <div class="comment-patterns-widget">
    <!-- Header -->
    <div class="cpw-header">
      <div class="cpw-header-left">
        <svg class="cpw-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <div>
          <h3 class="cpw-title">Comment Pattern Analysis</h3>
          <p v-if="analysis" class="cpw-subtitle">Based on {{ analysis.totalComments }} collected comments</p>
        </div>
      </div>
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
        :class="`cpw-pattern-card--${pattern.type}`"
      >
        <div class="cpw-pattern-header">
          <div class="cpw-pattern-label-row">
            <span class="cpw-pattern-type-dot" :class="`cpw-dot--${pattern.type}`"></span>
            <span class="cpw-pattern-label">{{ pattern.label }}</span>
            <span class="cpw-pattern-count">{{ pattern.count }}</span>
            <span class="cpw-pattern-pct">{{ pattern.percentage }}%</span>
          </div>
          <div class="cpw-pattern-bar-wrap">
            <div class="cpw-pattern-bar" :class="`cpw-bar--${pattern.type}`" :style="{ width: pattern.percentage + '%' }"></div>
          </div>
        </div>

        <p class="cpw-pattern-insight">{{ pattern.insight }}</p>

        <!-- Examples (collapsible) -->
        <div v-if="expandedPattern === pattern.type" class="cpw-examples">
          <div v-for="(ex, idx) in pattern.examples" :key="idx" class="cpw-example">
            <p class="cpw-example-content">"{{ ex.content }}"</p>
            <p class="cpw-example-meta">{{ ex.author }} · {{ ex.source }}</p>
          </div>
        </div>

        <button
          v-if="pattern.examples.length > 0"
          class="cpw-toggle-btn"
          @click="togglePattern(pattern.type)"
          type="button"
        >
          {{ expandedPattern === pattern.type ? 'Hide examples' : `Show ${pattern.examples.length} example${pattern.examples.length > 1 ? 's' : ''}` }}
          <svg class="cpw-toggle-icon" :class="{ 'cpw-toggle-icon--open': expandedPattern === pattern.type }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Footer hint -->
    <div v-if="analysis && analysis.totalComments > 0" class="cpw-footer">
      <svg class="cpw-footer-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      Analyzed {{ analysis.totalComments }} real comments from community sources
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
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.cpw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}

.cpw-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cpw-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6366f1;
  flex-shrink: 0;
}

.cpw-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.cpw-subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.125rem 0 0;
}

.cpw-score-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
}

.cpw-score--high { background: #d1fae5; color: #065f46; }
.cpw-score--medium { background: #fef9c3; color: #854d0e; }
.cpw-score--low { background: #f3f4f6; color: #6b7280; }

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
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cpw-pattern-card {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  background: #fafafa;
  transition: border-color 0.15s;
}

.cpw-pattern-card:hover {
  border-color: #e5e7eb;
}

.cpw-pattern-card--myth { border-left: 3px solid #f59e0b; }
.cpw-pattern-card--failure { border-left: 3px solid #ef4444; }
.cpw-pattern-card--advice { border-left: 3px solid #10b981; }
.cpw-pattern-card--validation { border-left: 3px solid #6366f1; }

.cpw-pattern-header {
  margin-bottom: 0.375rem;
}

.cpw-pattern-label-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.cpw-pattern-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cpw-dot--myth { background: #f59e0b; }
.cpw-dot--failure { background: #ef4444; }
.cpw-dot--advice { background: #10b981; }
.cpw-dot--validation { background: #6366f1; }

.cpw-pattern-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.cpw-pattern-count {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
}

.cpw-pattern-pct {
  font-size: 0.75rem;
  color: #9ca3af;
  min-width: 2.5rem;
  text-align: right;
}

.cpw-pattern-bar-wrap {
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.cpw-pattern-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.cpw-bar--myth { background: #f59e0b; }
.cpw-bar--failure { background: #ef4444; }
.cpw-bar--advice { background: #10b981; }
.cpw-bar--validation { background: #6366f1; }

.cpw-pattern-insight {
  font-size: 0.8125rem;
  color: #4b5563;
  margin: 0.5rem 0 0;
  line-height: 1.5;
}

.cpw-examples {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.cpw-example {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
}

.cpw-example-content {
  font-size: 0.8125rem;
  color: #374151;
  margin: 0 0 0.25rem;
  line-height: 1.5;
  font-style: italic;
}

.cpw-example-meta {
  font-size: 0.6875rem;
  color: #9ca3af;
  margin: 0;
}

.cpw-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.cpw-toggle-btn:hover {
  color: #4f46e5;
}

.cpw-toggle-icon {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.2s;
}

.cpw-toggle-icon--open {
  transform: rotate(180deg);
}

.cpw-footer {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #9ca3af;
  background: #fafafa;
}

.cpw-footer-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}
</style>
