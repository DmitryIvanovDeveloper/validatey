<template>
  <div class="cpw-pattern-header">
    <div class="cpw-pattern-label-row">
      <span class="cpw-pattern-label">{{ pattern.label }}</span>
      <span class="cpw-pattern-meta">
        <span class="cpw-pattern-count" :title="countTitle">{{ displayCount }} comments</span>
        <span
          v-if="displayAuthorCount != null"
          class="cpw-pattern-authors"
          title="Unique authors: stronger validation signal"
        >({{ displayAuthorCount }} authors)</span>
        <span
          v-if="pattern.subredditCount != null && pattern.subredditCount > 0"
          class="cpw-pattern-subreddits"
          :title="pattern.subredditNames?.length ? pattern.subredditNames.join(', ') : 'In N subreddits'"
        >in {{ pattern.subredditCount }} subreddit{{ pattern.subredditCount === 1 ? '' : 's' }}</span>
        <span class="cpw-pattern-pct">{{ displayPercentage }}%</span>
        <span
          v-if="pattern.dataConfidence && pattern.dataConfidence !== 'high'"
          class="cpw-data-confidence"
          :class="`cpw-confidence--${pattern.dataConfidence}`"
          :title="confidenceTooltip"
        >{{ confidenceLabel }}</span>
      </span>
    </div>
    <ProgressBar
      :percentage="displayPercentage"
      :fill-color="fillColor"
      size="sm"
    />
  </div>

  <button
    v-if="hasContent"
    class="cpw-toggle-btn cpw-show-comments-btn"
    type="button"
    @click="$emit('show')"
  >
    Show {{ buttonLabel }}
    <svg class="cpw-toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from '@/shared/components/ProgressBar.vue';
import type { CommentPattern } from '../../../domain/entities/comment-pattern-analysis.entity';
import type { CommentPatternsPresenter } from '../../presenters/comment-patterns.presenter';

interface Props {
  pattern: CommentPattern;
  patternIndex: number;
  presenter: CommentPatternsPresenter;
}

const props = defineProps<Props>();
defineEmits<{ show: [] }>();

/** Normalize to number (guard against API sending array by mistake). */
function toNumber(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.max(0, Math.round(v));
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'number') return Math.max(0, Math.round(v[0]));
  return 0;
}

const displayCount = computed(() => {
  const c = props.pattern.count;
  const ids = props.pattern.commentIds;
  if (ids && ids.length > 0) return ids.length;
  return toNumber(c);
});

const displayPercentage = computed(() => toNumber(props.pattern.percentage));

const displayAuthorCount = computed(() => {
  const a = props.pattern.uniqueAuthorCount;
  if (typeof a === 'number' && !Number.isNaN(a)) return a;
  if (Array.isArray(a)) return undefined;
  return a ?? undefined;
});

const countTitle = computed(() =>
  displayAuthorCount.value != null
    ? `${displayCount.value} comments in this pattern (${displayAuthorCount.value} unique authors)`
    : `${displayCount.value} comments in this pattern`
);

const hasContent = computed(() => props.presenter.hasPatternContent(props.pattern));
const buttonLabel = computed(() => props.presenter.getPatternButtonLabel(props.pattern));

const evidenceColorMap: Record<string, string> = {
  direct: 'var(--color-success)',
  alternative: 'var(--color-text-muted)',
  contradictory: 'var(--color-error)',
  neutral: 'var(--color-accent)',
};

const typeColorMap: Record<string, string> = {
  myth: 'var(--color-warning)',
  failure: 'var(--color-error)',
  advice: 'var(--color-success)',
  validation: 'var(--color-accent)',
  emotion: '#a78bfa',
  feature_request: 'var(--color-accent)',
  comparison: 'var(--color-text-muted)',
  workaround: 'var(--color-text-muted)',
};

const fillColor = computed(() => {
  const et = props.pattern.evidenceType;
  if (et && evidenceColorMap[et]) return evidenceColorMap[et];
  return typeColorMap[props.pattern.type] ?? 'var(--color-accent)';
});

const confidenceLabel = computed(() => {
  const dc = props.pattern.dataConfidence;
  if (dc === 'medium') return 'medium signal';
  if (dc === 'low') return 'low signal';
  if (dc === 'none') return 'no direct comments';
  return '';
});

const confidenceTooltip = computed(() => {
  const dc = props.pattern.dataConfidence;
  if (dc === 'medium') return '2–4 real comments match this pattern';
  if (dc === 'low') return 'Only 1 real comment matches this pattern';
  if (dc === 'none') return 'No comments were matched to this pattern — treat with caution';
  return '';
});
</script>

<style scoped>
.cpw-pattern-label-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.cpw-pattern-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  min-width: 0;
}

.cpw-pattern-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cpw-pattern-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.cpw-pattern-authors {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.cpw-pattern-pct {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: right;
}

.cpw-pattern-subreddits {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

.cpw-data-confidence {
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.1rem 0.3rem;
  border-radius: 999px;
  cursor: default;
  white-space: nowrap;
}

.cpw-confidence--medium {
  background: var(--color-warning-bg, rgba(251, 191, 36, 0.15));
  color: var(--color-warning);
}

.cpw-confidence--low {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.cpw-confidence--none {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
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
</style>
