<template>
  <div class="comments-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <h3 class="section-title">Comments Overview</h3>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <LoadingSpots message="Loading comments..." size="lg" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="state state-error">
        <span class="state-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="w-8 h-8">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </span>
        <p class="state-title">Failed to load comments</p>
        <p class="state-desc">{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else class="comments-content">
        <!-- Progress bars for each source -->
        <div v-if="overviewData.totalComments > 0 && sourceStats.length > 0" class="comments-progress-section">
          <div class="comments-progress-header">
            <span class="comments-total">{{ overviewData.totalComments }}</span>
            <span class="comments-label">comments</span>
          </div>
          <div class="comments-sources-list">
            <div
              v-for="stat in sourceStats"
              :key="stat.source"
              class="comments-source-item"
            >
              <div class="comments-source-header">
                <span class="comments-source-name">
                  {{ formatSourceName(stat.source) }}
                </span>
                <span class="comments-source-count">{{ stat.count }}</span>
              </div>
              <ProgressBar
                :percentage="overviewData.totalComments ? (stat.count / overviewData.totalComments) * 100 : 0"
                :fill-color="sourceFillColor(stat.source)"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <p class="empty-text">No comments collected yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import LoadingSpots from '../../../../shared/components/LoadingSpots.vue';
import ProgressBar from '@/shared/components/ProgressBar.vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter, CommentsOverviewData } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';

interface Props {
  projectId: string;
  externalLoading?: boolean;
}

interface Emits {
  (e: 'comments-loaded', count: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive data
const loading = ref(false);
const error = ref<string | null>(null);
const overviewData = ref<CommentsOverviewData>({
  sourceStats: [],
  totalComments: 0
});

// Get presenter from DI container
const commentsPresenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

// Computed properties
const sourceStats = computed(() => overviewData.value.sourceStats);

// Distinct color per source for progress bars (muted, less saturated)
function sourceFillColor(source: string): string {
  const colors: Record<string, string> = {
    reddit: '#b86b5a',
    hackernews: '#c98a5a',
    hn: '#c98a5a',
    linkedin: '#6b95b8',
    twitter: '#7ab5d9',
  };
  const key = (source || '').toLowerCase().replace(/[\s_-]+/g, '');
  return colors[key] ?? 'var(--color-accent, #0f766e)';
}

// Format source name with smart capitalization and known name overrides
const formatSourceName = (source: string) => {
  const knownNames: Record<string, string> = {
    'reddit': 'Reddit',
    'hackernews': 'Hacker News',
    'linkedin': 'LinkedIn'
  }

  if (knownNames[source]) return knownNames[source]

  // For unknown sources: smart formatting
  return source
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .split(/[-_\s]+/) // split by hyphens/underscores/spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Methods
const loadComments = async () => {
  if (props.externalLoading) return;

  try {
    loading.value = true;
    error.value = null;

    const result = await commentsPresenter.getCommentsOverview(props.projectId);

    if (result.error) {
      error.value = result.error;
    } else {
      overviewData.value = result.data;
      emit('comments-loaded', result.data.totalComments || 0);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load comments overview';
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadComments();
});

watch(() => props.projectId, (newId) => {
  if (newId) loadComments();
});

// Expose method for external reloading
defineExpose({
  reload: loadComments
});
</script>

<style scoped>
.comments-progress-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-progress-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.comments-total {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.comments-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.comments-sources-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comments-source-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.comments-source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.comments-source-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.comments-source-count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Loading state styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

/* Error state styles */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.state-error {
  color: var(--color-error);
}

.state-icon {
  margin-bottom: 1rem;
}

.state-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.state-desc {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.8;
}

/* Section card styles */
.section-card {
  background: var(--color-bg-page);
  border-radius: 0.75rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0;
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

.section-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}
</style>