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
      <LoadingSpots message="Analyzing comment patterns…" size="sm" />
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
        v-for="(pattern, patternIndex) in analysis.patterns"
        :key="patternIndex"
        class="cpw-pattern-card"
      >
        <div class="cpw-pattern-header">
          <div class="cpw-pattern-label-row">
            <span class="cpw-pattern-label">{{ pattern.label }}</span>
            <span class="cpw-pattern-count">{{ pattern.count }}</span>
            <span v-if="pattern.uniqueAuthorCount != null" class="cpw-pattern-authors" :title="'Unique authors: stronger validation signal'">{{ pattern.uniqueAuthorCount }} authors</span>
            <span class="cpw-pattern-pct">{{ pattern.percentage }}%</span>
          </div>
          <ProgressBar
              :percentage="pattern.percentage"
              :fill-color="patternFillColor(pattern.type)"
              size="sm"
            />
        </div>

        <button
          v-if="hasPatternContent(pattern)"
          class="cpw-toggle-btn cpw-show-comments-btn"
          @click="showPatternInSidebar(pattern, patternIndex)"
          type="button"
        >
          Show {{ patternCommentCount(pattern) }}
          <svg class="cpw-toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Comments Sidebar -->
    <CommentsSidebar
      :is-open="showCommentsSidebar"
      :title="sidebarPattern?.label || 'Comments'"
      :comments="sidebarComments"
      :loading="sidebarLoading"
      :error="sidebarError"
      :empty-message="'No comments for this pattern yet.'"
      :truncate-content="true"
      @close="closeCommentsSidebar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import LoadingSpots from '../../../../shared/components/LoadingSpots.vue';
import ProgressBar from '@/shared/components/ProgressBar.vue';
import { decodeHtmlEntities } from '../../../../shared/utils/text';
import CommentsSidebar from './CommentsSidebar.vue';
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

// Sidebar state
const showCommentsSidebar = ref(false);
const sidebarComments = ref<any[]>([]);
const sidebarPattern = ref<any>(null);
const sidebarLoading = ref(false);
const sidebarError = ref<string | null>(null);

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

function hasPatternContent(pattern: any): boolean {
  const hasIds = pattern.commentIds && pattern.commentIds.length > 0;
  const hasExamples = pattern.examples && pattern.examples.length > 0;
  return !!hasIds || !!hasExamples;
}

function patternCommentCount(pattern: any): string {
  const n = (pattern.commentIds && pattern.commentIds.length) || (pattern.examples && pattern.examples.length) || 0;
  const fromApi = pattern.commentIds && pattern.commentIds.length > 0;
  return n ? `${n} ${fromApi ? 'comments' : 'examples'}` : '0';
}

function examplesToSidebarItems(examples: any[]): any[] {
  if (!examples || !examples.length) return [];
  return examples.map((ex, idx) => ({
    id: `example-${idx}`,
    content: ex.content,
    author: ex.author || 'Anonymous',
    sourceType: ex.source?.toLowerCase().replace(/\s+/g, '') || 'other',
    url: ex.url,
    contextTitle: null,
    contextUrl: ex.url,
    createdAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    isProcessed: false,
    processedAt: null,
    importOrigin: null,
    subsourceName: ex.source || null,
  }));
}

async function showPatternInSidebar(pattern: any, patternIndex?: number): Promise<void> {
  const hasIds = pattern.commentIds && pattern.commentIds.length > 0;

  showCommentsSidebar.value = true;
  sidebarPattern.value = pattern;
  sidebarComments.value = [];
  sidebarError.value = null;

  if (hasIds) {
    try {
      sidebarLoading.value = true;
      const useCase = container.get<GetPatternCommentsUseCase>(COMMENT_TYPES.GetPatternCommentsUseCase);
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuidFrom = (x: unknown): string | null => {
        if (typeof x === 'string') return uuidRe.test(x.trim()) ? x.trim() : (x.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null);
        if (x && typeof x === 'object' && 'id' in x && typeof (x as { id: string }).id === 'string') return uuidFrom((x as { id: string }).id);
        return null;
      };
      const idsFromPattern: string[] = [];
      for (const id of pattern.commentIds || []) {
        const u = uuidFrom(id);
        if (u) idsFromPattern.push(u);
      }
      const result = await useCase.execute(props.projectId, pattern.type, patternIndex, idsFromPattern.length > 0 ? idsFromPattern : undefined);

      if (result.isSuccess && result.data.comments && result.data.comments.length > 0) {
        sidebarComments.value = result.data.comments;
      } else {
        sidebarComments.value = examplesToSidebarItems(pattern.examples || []);
      }
    } catch (error) {
      console.error('Exception loading pattern comments:', error);
      sidebarError.value = 'Failed to load comments';
      sidebarComments.value = examplesToSidebarItems(pattern.examples || []);
    } finally {
      sidebarLoading.value = false;
    }
  } else {
    sidebarComments.value = examplesToSidebarItems(pattern.examples || []);
  }
}

function closeCommentsSidebar(): void {
  showCommentsSidebar.value = false;
  sidebarComments.value = [];
  sidebarPattern.value = null;
  sidebarError.value = null;
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
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
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
