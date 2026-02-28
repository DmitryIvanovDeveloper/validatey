<template>
  <!-- Comments Sidebar -->
  <Teleport to="body">
    <Transition name="slide-panel">
      <div v-if="isOpen" class="detail-overlay" @click.self="$emit('close')">
        <div class="detail-panel comments-panel">
          <div class="detail-header">
            <div class="header-info">
              <h3>{{ title }}</h3>
              <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" class="close-icon">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="detail-body">
            <div v-if="loading" class="comments-loading">Loading comments…</div>
            <div v-else-if="error" class="comments-error">{{ error }}</div>
            <div v-else-if="comments.length === 0" class="comments-empty-state">
              <div class="empty-comments-icon">💬</div>
              <h4>No comments found</h4>
              <p>{{ emptyMessage }}</p>
            </div>
            <div v-else class="comments-list-sidebar">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item-sidebar"
              >
                <!-- Comment Header -->
                <div class="comment-header-sidebar">
                  <div class="comment-author-section">
                    <span class="source-badge" :class="comment.sourceType">
                      {{ comment.sourceType === 'reddit' ? 'R' : comment.sourceType === 'hackernews' ? 'HN' : 'LI' }}
                    </span>
                    <span v-if="showAuthor" class="author-name">{{ comment.author || 'Anonymous' }}</span>
                    <span class="comment-separator">•</span>
                    <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                    <template v-if="comment.sourceType === 'reddit' && showRedditMetadata">
                      <span v-if="comment.score != null" class="comment-score-badge" :title="'Reddit score (upvotes)'">+{{ comment.score }}</span>
                      <span v-if="comment.depth != null && comment.depth > 0" class="comment-depth-badge" :title="'Depth in thread'">depth {{ comment.depth }}</span>
                    </template>
                  </div>
                </div>

                <!-- Comment Content -->
                <div class="comment-content-sidebar">
                  {{ truncateContent ? truncateForFairUse(decodeHtmlEntities(comment.content)) : comment.content }}
                </div>

                <!-- Comment Context -->
                <div v-if="comment.contextTitle && showContext" class="comment-context-sidebar">
                  <strong>From:</strong> {{ comment.contextTitle }}
                </div>

                <!-- Comment Actions -->
                <div class="comment-actions-sidebar">
                  <a
                    :href="comment.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-source-link"
                  >
                    View Source
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { decodeHtmlEntities } from '../../../../shared/utils/text';
import type { CommentItem } from '../../application/use-cases/get-comments.usecase';

interface Props {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  comments: CommentItem[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showAuthor?: boolean;
  showContext?: boolean;
  showRedditMetadata?: boolean;
  truncateContent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  loading: false,
  error: null,
  emptyMessage: 'No comments available.',
  showAuthor: true,
  showContext: true,
  showRedditMetadata: false,
  truncateContent: false,
});

defineEmits<{
  close: [];
}>();

function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj);
  } catch {
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    return dateStr.slice(0, 10);
  }
}

function truncateForFairUse(text: string, maxLength = 300): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

</script>

<style scoped>
/* Sidebar Styles */
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
  transition: none !important;
  opacity: 1 !important;
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
  flex-direction: column;
  gap: 0.25rem;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.header-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
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
  flex-wrap: wrap;
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
  flex-shrink: 0;
}

.source-badge.reddit {
  background: #FF4500;
}

.source-badge.hackernews {
  background: #ff6600;
}

.author-name {
  font-weight: 500;
  color: var(--color-text);
}

.comment-separator {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.comment-time {
  font-size: 0.8125rem;
  flex-shrink: 0;
}

.comment-score-badge,
.comment-depth-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  background: var(--color-accent);
  color: white;
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.comment-content-sidebar {
  margin-bottom: 0.75rem;
  line-height: 1.5;
  font-size: 0.9375rem;
  color: var(--color-text);
  word-wrap: break-word;
}

.comment-context-sidebar {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.comment-actions-sidebar {
  display: flex;
  justify-content: flex-end;
}

.view-source-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.view-source-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.comments-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
}

.empty-comments-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.comments-empty-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.comments-empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.comments-loading,
.comments-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.comments-error {
  color: var(--color-danger);
}

/* Slide animation for sidebar */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s ease;
}

.slide-panel-enter-from {
  transform: translateX(100%);
}

.slide-panel-leave-to {
  transform: translateX(100%);
}
</style>