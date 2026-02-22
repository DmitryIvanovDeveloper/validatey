<template>
  <div class="comments-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <h3 class="section-title">Comments Overview</h3>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="loading-text">Loading comments...</p>
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
                  {{ stat.source === 'reddit' ? 'Reddit' : stat.source === 'hackernews' ? 'Hacker News' : 'Unknown' }}
                </span>
                <span class="comments-source-count">{{ stat.count }}</span>
              </div>
              <div class="comments-progress-bar">
                <div
                  class="comments-progress-segment"
                  :class="stat.source.toLowerCase()"
                  :style="{ width: `${(stat.count / overviewData.totalComments) * 100}%` }"
                ></div>
              </div>
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
import { ref, onMounted, computed } from 'vue';
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

// Expose method for external reloading
defineExpose({
  reload: loadComments
});
</script>

<style scoped>
.comments-widget {
  /* Widget container styles */
}

.comments-content {
  /* Content padding removed - now handled by section-card */
}

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

.comments-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-bg-subtle);
  border-radius: 3px;
  overflow: hidden;
}

.comments-progress-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.comments-progress-segment.reddit {
  background: #ff4500;
}

.comments-progress-segment.hackernews {
  background: #ff6600;
}

.comments-progress-segment.unknown {
  background: var(--color-text-muted);
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

.loading-dots {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: loading 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0.8);
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
  margin: 0;
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
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
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