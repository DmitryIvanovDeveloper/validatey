<template>
  <div class="comments-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-signals" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="w-5 h-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1"/>
            <circle cx="12" cy="10" r="1"/>
            <circle cx="15" cy="10" r="1"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Comments Overview</h3>
          <p class="section-subtitle">Collected comments from all sources</p>
        </div>
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

        <!-- Source breakdown -->
        <div v-if="sourceStats.length > 0" class="source-breakdown">
          <h4 class="breakdown-title">By Source</h4>
          <div class="source-stats">
            <div
              v-for="stat in sourceStats"
              :key="stat.source"
              class="source-stat"
              :class="stat.source.toLowerCase()"
            >
              <div class="source-info">
                <img
                  v-if="stat.source === 'reddit'"
                  src="@/assets/icons/reddit-logo-2436.svg"
                  alt="Reddit"
                  class="source-icon reddit-icon"
                />
                <img
                  v-else-if="stat.source === 'hackernews'"
                  src="@/assets/icons/hacker-news.svg"
                  alt="Hacker News"
                  class="source-icon hn-icon"
                />
                <div
                  v-else
                  class="source-icon unknown-icon"
                >
                  <svg viewBox="0 0 24 24" class="w-4 h-4">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <span class="source-name">
                  {{ stat.source === 'reddit' ? 'Reddit' : stat.source === 'hackernews' ? 'Hacker News' : 'Unknown' }}
                </span>
              </div>
              <span class="source-count">{{ stat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" class="w-8 h-8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1"/>
              <circle cx="12" cy="10" r="1"/>
              <circle cx="15" cy="10" r="1"/>
            </svg>
          </div>
          <p class="empty-text">No comments collected yet</p>
          <p class="empty-desc">Add sources and run comment collection to see data here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.usecase';
import { COMMENT_TYPES } from '../../types';

interface Props {
  projectId: string;
  externalLoading?: boolean;
}

const props = defineProps<Props>();

// Reactive data
const loading = ref(false);
const error = ref<string | null>(null);
const comments = ref<any[]>([]);

// Get use case from DI container
const getCommentsUseCase = container.get<GetCommentsUseCase>(COMMENT_TYPES.GetCommentsUseCase);

// Computed properties

const sourceStats = computed(() => {
  const stats = comments.value.reduce((acc, comment) => {
    const source = comment.sourceType || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(stats).map(([source, count]) => ({
    source,
    count
  })).sort((a, b) => b.count - a.count);
});

// Methods
const loadComments = async () => {
  if (props.externalLoading) return;

  try {
    loading.value = true;
    error.value = null;

    const result = await getCommentsUseCase.execute({
      projectId: props.projectId,
      limit: 1000 // Get a reasonable number for overview
    });

    if (result.isSuccess) {
      comments.value = result.data.comments;
    } else {
      error.value = result.error.message;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load comments';
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

.comments-metrics {
  margin-bottom: 1.5rem;
}


.source-breakdown {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 1.25rem;
}

.breakdown-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
}

.source-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.source-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.source-stat.reddit {
  border-color: rgba(255, 69, 0, 0.2);
}

.source-stat.hackernews {
  border-color: rgba(255, 102, 0, 0.2);
}

.source-stat.unknown {
  border-color: rgba(108, 117, 125, 0.2);
}

.unknown-icon {
  background: var(--color-text-muted);
  color: white;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.source-icon {
  width: 1rem;
  height: 1rem;
}

.reddit-icon {
  width: 100%;
  height: 100%;
}

.hn-icon {
  width: 100%;
  height: 100%;
}

.source-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.source-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  opacity: 0.6;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  font-size: 0.875rem;
  margin: 0;
  max-width: 250px;
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
  margin-bottom: 1.5rem;
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