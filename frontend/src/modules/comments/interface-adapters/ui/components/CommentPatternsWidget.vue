<template>
  <div id="comment-pattern-analysis-section" class="comment-patterns-widget">
    <!-- Header -->
    <div class="cpw-header">
      <div class="cpw-title-row">
        <h3 class="cpw-title">Comment Pattern Analysis</h3>
        <SectionHintButton
          text="Patterns in comments and how much they support the hypothesis. Score is computed from real matched comments, not an LLM estimate. Unique author counts per pattern indicate diversity (higher = stronger signal)."
          aria-label="Hint: Comment Pattern Analysis"
        />
      </div>
      <div v-if="analysis" class="cpw-header-badges">
        <div class="cpw-score-badge" :class="scoreBadgeClass" :title="scoreTooltip">
          {{ scoreLabel }}
        </div>
        <span v-if="coverageLabel" class="cpw-coverage-badge" :title="coverageTooltip">{{ coverageLabel }}</span>
        <span v-if="analysis?.patterns?.length" class="cpw-diversity-hint" title="See unique authors per pattern below">Diversity: per-pattern authors below</span>
        <template v-if="analysis.platformInsights">
          <span v-if="recurrenceLabel" class="cpw-recurrence-badge" :title="'Same patterns appear across subreddits — strong validation signal'">{{ recurrenceLabel }}</span>
          <span v-if="subredditSummary" class="cpw-subreddits-badge" :title="'Comments from these communities'">{{ subredditSummary }}</span>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cpw-loading">
      <LoadingSpots message="Analyzing comment patterns…" size="sm" />
    </div>

    <!-- Error: show CTA when pattern analysis not available (e.g. run Research first) -->
    <div v-else-if="error" class="cpw-empty">
      <p v-if="isRunResearchError" class="cpw-empty-title">Comment Pattern Analysis not available yet</p>
      <p v-else>{{ error }}</p>
      <p v-if="isRunResearchError" class="cpw-empty-hint">Run <strong>Start Research</strong> (Collect + Synthesis) to classify comments and see Supporting Evidence, Contradictions, and Alternative Approaches with &quot;Show comments&quot; links.</p>
    </div>

    <!-- No data -->
    <div v-else-if="!analysis || analysis.totalComments === 0" class="cpw-empty">
      <svg class="cpw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
      <p>No comments collected yet.</p>
      <p class="cpw-empty-hint">Add Reddit or HackerNews sources in the Comments tab to collect data.</p>
    </div>

    <!-- Patterns grouped by evidence type -->
    <div v-else class="cpw-patterns">
      <!-- Supporting Evidence -->
      <template v-if="directPatterns.length > 0">
        <div class="cpw-section-header cpw-section--direct">
          <span class="cpw-section-dot cpw-dot--direct"></span>Supporting Evidence
          <span class="cpw-section-count">{{ directPatterns.length }}</span>
        </div>
        <div
          v-for="(pattern, idx) in visibleDirectPatterns"
          :key="`direct-${idx}`"
          class="cpw-pattern-card"
        >
          <PatternCardContent
            :pattern="pattern"
            :pattern-index="allPatterns.indexOf(pattern)"
            :presenter="presenter"
            @show="showPatternInSidebar(pattern, allPatterns.indexOf(pattern))"
          />
        </div>
        <div v-if="directPatterns.length > PREVIEW_PATTERNS_COUNT" class="cpw-show-more-wrap">
          <button type="button" class="cpw-show-more-btn" @click="directExpanded = !directExpanded">
            {{ directExpanded ? 'Show less' : `Show more (${directPatterns.length - PREVIEW_PATTERNS_COUNT} more)` }}
            <svg class="cpw-show-more-icon" :class="{ 'cpw-show-more-icon--expanded': directExpanded }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </template>

      <!-- Alternative Approaches (ways users solve the problem without your product) -->
      <template v-if="alternativePatterns.length > 0">
        <div class="cpw-section-header cpw-section--alternative">
          <span class="cpw-section-dot cpw-dot--alternative"></span>Alternative Approaches
          <span class="cpw-section-count">{{ alternativePatterns.length }}</span>
        </div>
        <p class="cpw-section-subtitle cpw-section-subtitle--alternative">Ways users solve the problem without your product.</p>
        <div
          v-for="(pattern, idx) in visibleAlternativePatterns"
          :key="`alt-${idx}`"
          class="cpw-pattern-card"
        >
          <PatternCardContent
            :pattern="pattern"
            :pattern-index="allPatterns.indexOf(pattern)"
            :presenter="presenter"
            @show="showPatternInSidebar(pattern, allPatterns.indexOf(pattern))"
          />
        </div>
        <div v-if="alternativePatterns.length > PREVIEW_PATTERNS_COUNT" class="cpw-show-more-wrap">
          <button type="button" class="cpw-show-more-btn" @click="alternativeExpanded = !alternativeExpanded">
            {{ alternativeExpanded ? 'Show less' : `Show more (${alternativePatterns.length - PREVIEW_PATTERNS_COUNT} more)` }}
            <svg class="cpw-show-more-icon" :class="{ 'cpw-show-more-icon--expanded': alternativeExpanded }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </template>

      <!-- Contradictions (always show block when we have any patterns, so skepticism is visible) -->
      <template v-if="allPatterns.length > 0">
        <div class="cpw-section-header cpw-section--contradictory">
          <span class="cpw-section-dot cpw-dot--contradictory"></span>Contradictions
          <span class="cpw-section-count">{{ contradictoryPatterns.length }}</span>
        </div>
        <p v-if="contradictoryPatterns.length === 0" class="cpw-section-subtitle cpw-section-subtitle--contradictory">No contradictory patterns identified in this sample.</p>
        <div
          v-for="(pattern, idx) in visibleContradictoryPatterns"
          :key="`contra-${idx}`"
          class="cpw-pattern-card"
        >
          <PatternCardContent
            :pattern="pattern"
            :pattern-index="allPatterns.indexOf(pattern)"
            :presenter="presenter"
            @show="showPatternInSidebar(pattern, allPatterns.indexOf(pattern))"
          />
        </div>
        <div v-if="contradictoryPatterns.length > PREVIEW_PATTERNS_COUNT" class="cpw-show-more-wrap">
          <button type="button" class="cpw-show-more-btn" @click="contradictoryExpanded = !contradictoryExpanded">
            {{ contradictoryExpanded ? 'Show less' : `Show more (${contradictoryPatterns.length - PREVIEW_PATTERNS_COUNT} more)` }}
            <svg class="cpw-show-more-icon" :class="{ 'cpw-show-more-icon--expanded': contradictoryExpanded }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </template>

      <!-- Context / Neutral -->
      <template v-if="neutralPatterns.length > 0">
        <div class="cpw-section-header cpw-section--neutral">
          <span class="cpw-section-dot cpw-dot--neutral"></span>Context
          <span class="cpw-section-count">{{ neutralPatterns.length }}</span>
        </div>
        <div
          v-for="(pattern, idx) in visibleNeutralPatterns"
          :key="`neutral-${idx}`"
          class="cpw-pattern-card"
        >
          <PatternCardContent
            :pattern="pattern"
            :pattern-index="allPatterns.indexOf(pattern)"
            :presenter="presenter"
            @show="showPatternInSidebar(pattern, allPatterns.indexOf(pattern))"
          />
        </div>
        <div v-if="neutralPatterns.length > PREVIEW_PATTERNS_COUNT" class="cpw-show-more-wrap">
          <button type="button" class="cpw-show-more-btn" @click="neutralExpanded = !neutralExpanded">
            {{ neutralExpanded ? 'Show less' : `Show more (${neutralPatterns.length - PREVIEW_PATTERNS_COUNT} more)` }}
            <svg class="cpw-show-more-icon" :class="{ 'cpw-show-more-icon--expanded': neutralExpanded }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- Comments Sidebar -->
    <CommentsSidebar
      :is-open="showCommentsSidebar"
      :title="sidebarPattern?.label || 'Comments'"
      :comments="sidebarComments"
      :loading="sidebarLoading"
      :error="sidebarError"
      :empty-message="'No comments for this pattern yet.'"
      :show-reddit-metadata="true"
      :truncate-content="true"
      @close="closeCommentsSidebar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import LoadingSpots from '../../../../../shared/components/LoadingSpots.vue';
import ProgressBar from '@/shared/components/ProgressBar.vue';
import SectionHintButton from '@/shared/components/SectionHintButton.vue';
import { decodeHtmlEntities } from '../../../../../shared/utils/text';
import CommentsSidebar from '../../components/CommentsSidebar.vue';
import PatternCardContent from './PatternCard.vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../../types';
import type { CommentPatternsPresenter } from '../../presenters/comment-patterns.presenter';
import type { CommentPatternAnalysis } from '../../../domain/entities/comment-pattern-analysis.entity';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const presenter = container.get<CommentPatternsPresenter>(COMMENT_TYPES.CommentPatternsPresenter);

const loading = ref(false);
const error = ref<string | null>(null);
const analysis = ref<CommentPatternAnalysis | null>(null);

// Sidebar state
const showCommentsSidebar = ref(false);
const sidebarComments = ref<any[]>([]);
const sidebarPattern = ref<any>(null);
const sidebarLoading = ref(false);
const sidebarError = ref<string | null>(null);
const showingOnlyExamples = ref(false);

const PREVIEW_PATTERNS_COUNT = 3;
const patternsExpanded = ref(false);
const directExpanded = ref(false);
const alternativeExpanded = ref(false);
const contradictoryExpanded = ref(false);
const neutralExpanded = ref(false);

const allPatterns = computed(() => analysis.value?.patterns ?? []);

const directPatterns = computed(() =>
  allPatterns.value.filter((p) => !p.evidenceType || p.evidenceType === 'direct')
);
const alternativePatterns = computed(() =>
  allPatterns.value.filter((p) => p.evidenceType === 'alternative')
);
const contradictoryPatterns = computed(() =>
  allPatterns.value.filter((p) => p.evidenceType === 'contradictory')
);
const neutralPatterns = computed(() =>
  allPatterns.value.filter((p) => p.evidenceType === 'neutral')
);

const visibleDirectPatterns = computed(() =>
  directExpanded.value ? directPatterns.value : directPatterns.value.slice(0, PREVIEW_PATTERNS_COUNT)
);
const visibleAlternativePatterns = computed(() =>
  alternativeExpanded.value ? alternativePatterns.value : alternativePatterns.value.slice(0, PREVIEW_PATTERNS_COUNT)
);
const visibleContradictoryPatterns = computed(() =>
  contradictoryExpanded.value ? contradictoryPatterns.value : contradictoryPatterns.value.slice(0, PREVIEW_PATTERNS_COUNT)
);
const visibleNeutralPatterns = computed(() =>
  neutralExpanded.value ? neutralPatterns.value : neutralPatterns.value.slice(0, PREVIEW_PATTERNS_COUNT)
);

// Legacy computed (kept for non-grouped fallback)
const visiblePatterns = computed(() => {
  const patterns = allPatterns.value;
  if (patternsExpanded.value || patterns.length <= PREVIEW_PATTERNS_COUNT) return patterns;
  return patterns.slice(0, PREVIEW_PATTERNS_COUNT);
});

const hasMorePatterns = computed(() => allPatterns.value.length > PREVIEW_PATTERNS_COUNT);
const remainingPatternsCount = computed(() => Math.max(0, allPatterns.value.length - PREVIEW_PATTERNS_COUNT));

function patternIndexFor(idx: number): number {
  return idx;
}

const scoreBadgeClass = computed(() => {
  const score = analysis.value?.validationScore ?? 0;
  if (score >= 70) return 'cpw-score--high';
  if (score >= 30) return 'cpw-score--medium';
  return 'cpw-score--low';
});

const scoreLabel = computed(() => {
  const score = analysis.value?.validationScore ?? 0;
  if (score >= 70) return `Strong Evidence (${score}%)`;
  if (score >= 30) return `Moderate Evidence (${score}%)`;
  return `Early Stage (${score}%)`;
});

const recurrenceLabel = computed(() => {
  const r = analysis.value?.platformInsights?.recurrenceScore;
  if (r == null || r < 0) return '';
  const pct = Math.round(r * 100);
  if (pct === 0) return '';
  return `Recurrence: ${pct}%`;
});

const subredditSummary = computed(() => {
  const dist = analysis.value?.platformInsights?.subredditDistribution;
  if (!dist || typeof dist !== 'object') return '';
  const n = Object.keys(dist).length;
  if (n === 0) return '';
  return `${n} subreddit${n === 1 ? '' : 's'}`;
});

const coverageLabel = computed(() => {
  const a = analysis.value;
  if (!a || a.totalComments === 0) return '';
  if (a.classifiedComments == null) return '';
  return `${a.classifiedComments} / ${a.totalComments} comments classified`;
});

const coverageTooltip = computed(() => {
  const a = analysis.value;
  if (!a || a.classifiedComments == null) return '';
  const pct = Math.round((a.classifiedComments / a.totalComments) * 100);
  return `${a.totalComments} comments analysed. ${a.classifiedComments} unique comments matched at least one pattern (${pct}%). Counts per pattern may sum to more than ${a.classifiedComments} because one comment can match several patterns.`;
});

const scoreTooltip = computed(() => {
  const a = analysis.value;
  if (!a) return '';
  return `Score is computed deterministically from ${a.classifiedComments ?? '?'} real matched comments (unique author diversity weighted). Not an LLM estimate.`;
});

/** True when error indicates user should run Research (404 / pattern analysis not available). */
const isRunResearchError = computed(() => {
  const e = error.value;
  if (!e) return false;
  const lower = e.toLowerCase();
  return lower.includes('pattern analysis not available') || lower.includes('run') && lower.includes('research') || lower.includes('not available');
});

const sidebarHint = computed(() =>
  presenter.getSidebarHint(sidebarPattern.value, showingOnlyExamples.value, sidebarComments.value.length)
);

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function truncateForFairUse(text: string, maxLength: number = 500): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

function patternFillColor(type: string): string {
  const colors: Record<string, string> = {
    myth: 'var(--color-warning)',
    failure: 'var(--color-error)',
    advice: 'var(--color-success)',
    validation: 'var(--color-accent)',
    emotion: '#a78bfa',
    feature_request: 'var(--color-accent)',
    comparison: 'var(--color-text-muted)',
    workaround: 'var(--color-text-muted)',
  };
  return colors[type] ?? 'var(--color-accent)';
}

function formatSourceName(source: string): string {
  const knownNames: Record<string, string> = {
    'reddit': 'Reddit',
    'hackernews': 'Hacker News',
    'linkedin': 'LinkedIn',
  };
  if (knownNames[source]) return knownNames[source];
  return source
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function showPatternInSidebar(pattern: any, patternIndex?: number): Promise<void> {
  showCommentsSidebar.value = true;
  sidebarPattern.value = pattern;
  sidebarComments.value = [];
  sidebarError.value = null;
  showingOnlyExamples.value = false;

  const hasIds = pattern.commentIds && pattern.commentIds.length > 0;
  if (hasIds) {
    try {
      sidebarLoading.value = true;
      const { comments, showingOnlyExamples: onlyExamples } = await presenter.loadPatternComments(
        props.projectId,
        pattern,
        patternIndex
      );
      sidebarComments.value = comments;
      showingOnlyExamples.value = onlyExamples;
    } catch (e) {
      console.error('Exception loading pattern comments:', e);
      sidebarError.value = 'Failed to load comments';
      const { comments, showingOnlyExamples: onlyExamples } = await presenter.loadPatternComments(
        props.projectId,
        { ...pattern, commentIds: [] },
        patternIndex
      );
      sidebarComments.value = comments;
      showingOnlyExamples.value = onlyExamples;
    } finally {
      sidebarLoading.value = false;
    }
  } else {
    const { comments, showingOnlyExamples: onlyExamples } = await presenter.loadPatternComments(
      props.projectId,
      pattern,
      patternIndex
    );
    sidebarComments.value = comments;
    showingOnlyExamples.value = onlyExamples;
  }
}

function closeCommentsSidebar(): void {
  showCommentsSidebar.value = false;
  sidebarComments.value = [];
  sidebarPattern.value = null;
  sidebarError.value = null;
  showingOnlyExamples.value = false;
}

async function loadPatterns(): Promise<void> {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;
  try {
    const { analysis: a, error: e } = await presenter.loadAnalysis(props.projectId);
    analysis.value = a;
    error.value = e;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPatterns();
});

watch(() => props.projectId, (newId) => {
  if (newId) loadPatterns();
});

defineExpose({
  reload: loadPatterns,
});
</script>

<style scoped>
.comment-patterns-widget {
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
}

.cpw-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
}

.cpw-title-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cpw-title-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.cpw-header-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.cpw-recurrence-badge,
.cpw-subreddits-badge,
.cpw-coverage-badge {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  cursor: default;
}
.cpw-pattern-subreddits {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}
.comment-score-badge,
.comment-depth-badge {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-left: 0.35rem;
}

.cpw-loading {
  padding: 1.5rem 1.25rem;
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

/* Evidence-type section headers */
.cpw-section-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 0.25rem 0 0.1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.1rem;
}

.cpw-section-count {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border-radius: 999px;
  padding: 0.1rem 0.35rem;
}

.cpw-section-dot {
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.cpw-dot--direct      { background: var(--color-success); }
.cpw-dot--alternative { background: var(--color-text-muted); }
.cpw-dot--contradictory { background: var(--color-error); }
.cpw-dot--neutral     { background: var(--color-accent); }

.cpw-section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: -0.2rem 0 0.5rem 0;
  padding: 0;
}

.cpw-section-subtitle--contradictory {
  margin-bottom: 0.5rem;
}

.cpw-diversity-hint {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.cpw-empty-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.cpw-show-more-wrap {
  padding: 0.5rem 0 0;
  border-top: var(--border-width) var(--border-style) var(--color-border);
  margin-top: 0.25rem;
}

.cpw-show-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #0d9488;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.cpw-show-more-btn:hover {
  background: rgba(13, 148, 136, 0.08);
}

.cpw-show-more-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s;
}

.cpw-show-more-icon.expanded,
.cpw-show-more-icon--expanded {
  transform: rotate(180deg);
}

.cpw-pattern-card {
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  background: var(--color-bg);
}

.cpw-pattern-header {
  margin-bottom: 0.5rem;
}

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
}

.cpw-pattern-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.cpw-pattern-authors {
  display: none;
}

.cpw-pattern-pct {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: right;
}

.cpw-examples {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: var(--border-width) var(--border-style) var(--color-border);
  padding-top: 0.75rem;
}

.cpw-example {
  background: var(--color-bg-subtle);
  border: var(--border-width) var(--border-style) var(--color-border);
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

/* Right Sidebar (same as CommentsTab) */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
  padding: 1rem;
}

.detail-panel {
  background: var(--color-bg);
  width: 100%;
  max-width: 500px;
  height: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.comments-panel {
  max-width: 500px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
  background: var(--color-bg);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.cpw-sidebar-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.comments-empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
}

.empty-comments-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.comments-empty-state h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--color-text);
}

.comments-empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.comments-list-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cpw-sidebar-hint {
  margin: 0 0 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  background: var(--color-bg-subtle, #f3f4f6);
  border-radius: var(--radius-sm, 6px);
  border-left: var(--border-width) var(--border-style) var(--color-accent, #6366f1);
}

.comment-item-sidebar {
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: var(--border-width) var(--border-style) var(--color-border);
  transition: border-color 0.2s ease;
}

.comment-item-sidebar:hover {
  border-color: var(--color-accent);
}

.comment-header-sidebar {
  margin-bottom: 0.75rem;
}

.comment-author-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
}

.source-badge.reddit {
  background: #ff4500;
}

.source-badge.hackernews {
  background: #ff6600;
}

.source-badge.linkedin {
  background: #0077b5;
}

.source-badge.other {
  background: var(--color-text-muted);
}

.author-name {
  font-weight: 500;
  color: var(--color-text);
}

.comment-separator {
  color: var(--color-text-muted);
}

.comment-time {
  font-size: 0.8125rem;
}

.comment-content-sidebar {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.comment-context-sidebar {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin-bottom: 0.5rem;
}

.comment-actions-sidebar {
  margin-top: 0.5rem;
}

.view-source-link {
  font-size: 0.8125rem;
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.view-source-link:hover {
  text-decoration: underline;
}

/* Slide animation for sidebar */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-active .detail-panel,
.slide-panel-leave-active .detail-panel {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-panel-enter-from .detail-panel,
.slide-panel-leave-to .detail-panel {
  transform: translateX(100%);
}

/* Show comments button styling */
.cpw-show-comments-btn {
  background: none;
  border: none;
  transition: all 0.2s;
}

.cpw-show-comments-btn:hover {
  background: none;
  border: none;
}
</style>
