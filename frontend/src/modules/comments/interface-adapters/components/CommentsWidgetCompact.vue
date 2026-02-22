<template>
  <div class="comments-widget-compact">
    <div v-if="loading" class="widget-loading">...</div>
    <div v-else-if="error" class="widget-error">{{ error }}</div>
    <div v-else class="widget-content">
      <span class="widget-label">Comments</span>
      <span class="widget-value">{{ totalComments }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const totalComments = ref<number>(0);

const commentsPresenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

const loadComments = async () => {
  try {
    loading.value = true;
    error.value = null;
    const result = await commentsPresenter.getCommentsOverview(props.projectId);
    if (result.error) {
      error.value = result.error;
    } else {
      totalComments.value = result.data?.totalComments ?? 0;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load comments';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadComments();
});
</script>

<style scoped>
.comments-widget-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.widget-loading,
.widget-error {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.widget-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget-label {
  color: var(--color-text-muted);
}

.widget-value {
  font-weight: 600;
  color: var(--color-text);
}
</style>
