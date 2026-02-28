<template>
  <div v-if="freshness" class="comments-freshness-widget">
    <div v-if="freshness.isStale" class="freshness-warning section-card">
      <div class="freshness-warning-content">
        <span class="freshness-icon" aria-hidden="true">
          <AlertCircle :size="20" stroke-width="2" />
        </span>
        <div class="freshness-text">
          <p class="freshness-title">Data freshness</p>
          <p class="freshness-desc">
            Conclusions are based on comments older than 6 months. Consider re-fetching or checking relevance.
          </p>
          <p v-if="freshness.newestCommentAt" class="freshness-meta">
            Newest comment: {{ formatDate(freshness.newestCommentAt) }} · {{ freshness.totalCount }} total
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const freshness = ref<{
  oldestCommentAt: string;
  newestCommentAt: string;
  totalCount: number;
  isStale: boolean;
} | null>(null);

const commentsPresenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

async function load() {
  if (!props.projectId) return;
  const result = await commentsPresenter.getCommentsFreshness(props.projectId);
  if (result.error) return;
  if (result.data) freshness.value = result.data;
}

onMounted(() => load());
watch(() => props.projectId, (id) => {
  freshness.value = null;
  if (id) load();
});
</script>

<style scoped>
.comments-freshness-widget {
  margin-bottom: 0;
}

.freshness-warning {
  padding: 0.875rem 1rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.5rem;
}

.freshness-warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.freshness-icon {
  flex-shrink: 0;
  color: #d97706;
}

.freshness-text {
  min-width: 0;
}

.freshness-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.freshness-desc {
  font-size: 0.8125rem;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.freshness-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0.35rem 0 0 0;
}
</style>
