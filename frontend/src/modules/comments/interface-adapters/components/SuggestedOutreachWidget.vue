<template>
  <div class="suggested-outreach-widget">
    <div v-if="loading" class="loading-state">
      <p class="loading-text">Loading...</p>
    </div>
    <div v-else-if="error" class="state state-error">
      <p class="state-desc">{{ error }}</p>
    </div>
    <div v-else-if="commenters.length === 0" class="empty-state section-card">
      <p class="empty-text">Run research to see suggested commenters aligned with your hypothesis.</p>
    </div>
    <div v-else class="section-card signals-card">
      <div class="section-card-header">
        <h3 class="section-title">Suggested outreach</h3>
        <p class="section-subtitle">Commenters whose feedback aligns with your hypothesis — good candidates for manual survey outreach.</p>
      </div>
      <div class="commenters-list">
        <div
          v-for="c in visibleCommenters"
          :key="commenterKey(c)"
          class="commenter-card"
        >
          <div class="commenter-header">
            <div class="commenter-info-row">
              <div class="commenter-avatar">
                {{ c.author.charAt(0).toUpperCase() }}
              </div>
              <div class="commenter-info">
                <div class="commenter-name-row">
                  <span class="commenter-name">{{ c.author }}</span>
                  <button
                    class="commenter-message-btn"
                    @click="openProfile(c)"
                    type="button"
                    :title="'Message ' + c.author"
                  >
                    message
                  </button>
                </div>
                <div class="commenter-meta">
                  <span class="commenter-source">{{ sourceLabel(c.sourceType) }}</span>
                  <span class="commenter-stats">{{ c.supportingCount }} of {{ c.commentCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="commenter-show-comments-btn"
            @click="toggleComments(c)"
            type="button"
          >
            Show {{ c.commentCount }} comments
            <svg class="commenter-toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        <!-- Show more button -->
        <button
          v-if="hasMoreCommenters"
          class="commenter-show-more-btn"
          @click="toggleExpanded"
          type="button"
        >
          {{ commentersExpanded ? 'Show less' : `Show ${remainingCommentersCount} more` }}
          <svg
            class="commenter-expand-icon"
            :class="{ 'rotated': commentersExpanded }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Comments Sidebar -->
    <CommentsSidebar
      :is-open="showCommentsSidebar"
      :title="selectedCommenter ? `${selectedCommenter.author}'s comments` : 'Comments'"
      :subtitle="selectedCommenter ? sourceLabel(selectedCommenter.sourceType) : undefined"
      :comments="sidebarComments"
      :loading="sidebarLoading"
      :error="sidebarError"
      :empty-message="'No comments available for this author.'"
      :show-author="false"
      @close="closeCommentsSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';
import CommentsSidebar from './CommentsSidebar.vue';

interface Commenter {
  author: string;
  sourceType: 'reddit' | 'hackernews' | 'linkedin';
  commentCount: number;
  supportingCount: number;
  lastCommentAt: string;
  profileUrl: string;
}

interface CommentItem {
  id: string;
  content: string;
  author: string | null;
  url: string;
  createdAt: string;
}

interface Props {
  projectId: string;
  limit?: number;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const commenters = ref<Commenter[]>([]);
const commentsByAuthor = reactive<Record<string, CommentItem[]>>({});
const commentsLoadState = reactive<Record<string, { loading?: boolean; error?: string }>>({});

// Sidebar state
const showCommentsSidebar = ref(false);
const selectedCommenter = ref<Commenter | null>(null);
const sidebarComments = ref<CommentItem[]>([]);
const sidebarLoading = ref(false);
const sidebarError = ref<string | null>(null);

// Expandable list state
const commentersExpanded = ref(false);
const PREVIEW_COMMENTERS_COUNT = 3;

const commentsPresenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

// Computed properties for expandable list
const visibleCommenters = computed(() => {
  if (commentersExpanded.value) return commenters.value;
  return commenters.value.slice(0, PREVIEW_COMMENTERS_COUNT);
});

const hasMoreCommenters = computed(() => {
  return commenters.value.length > PREVIEW_COMMENTERS_COUNT;
});

const remainingCommentersCount = computed(() => {
  return Math.max(0, commenters.value.length - PREVIEW_COMMENTERS_COUNT);
});

function commenterKey(c: Commenter): string {
  return `${c.author}\n${c.sourceType}`;
}

function cacheKey(c: Commenter): string {
  return commenterKey(c);
}

function sourceLabel(sourceType: 'reddit' | 'hackernews' | 'linkedin'): string {
  if (sourceType === 'hackernews') return 'Hacker News';
  if (sourceType === 'linkedin') return 'LinkedIn';
  return 'Reddit';
}

function snippet(text: string, maxLen = 120): string {
  if (!text || !text.trim()) return '(no text)';
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + '…';
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function toggleComments(c: Commenter) {
  selectedCommenter.value = c;
  showCommentsSidebar.value = true;

  const ck = cacheKey(c);
  if (commentsByAuthor[ck]?.length !== undefined) {
    // Comments already loaded, show them immediately
    sidebarComments.value = commentsByAuthor[ck] || [];
    sidebarLoading.value = false;
    sidebarError.value = null;
    return;
  }

  // Comments not loaded yet, show loading state while loading
  sidebarComments.value = [];
  sidebarLoading.value = true;
  sidebarError.value = null;

  // Load comments asynchronously while sidebar is open
  loadCommentsForAuthor(c);
}

function closeCommentsSidebar() {
  showCommentsSidebar.value = false;
  selectedCommenter.value = null;
  sidebarComments.value = [];
  sidebarLoading.value = false;
  sidebarError.value = null;
}

function toggleExpanded() {
  commentersExpanded.value = !commentersExpanded.value;
}

function openProfile(c: Commenter) {
  // For Reddit, construct profile URL
  if (c.sourceType === 'reddit') {
    window.open(`https://reddit.com/u/${c.author}`, '_blank');
  } else if (c.sourceType === 'hackernews') {
    // HackerNews doesn't have direct profile links, but we can try to search
    window.open(`https://hn.algolia.com/?query=author:${c.author}`, '_blank');
  } else if (c.sourceType === 'linkedin') {
    // For LinkedIn, we can try to search or use the profile URL if available
    window.open(c.profileUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.author)}`, '_blank');
  }
}

async function loadCommentsForAuthor(c: Commenter) {
  if (!props.projectId) return;
  const ck = cacheKey(c);
  commentsLoadState[ck] = { loading: true };
  sidebarLoading.value = true;
  sidebarError.value = null;

  const result = await commentsPresenter.getCommentsByAuthor(props.projectId, {
    author: c.author,
    sourceType: c.sourceType,
    supportingOnly: false,
    limit: 200,
  });

  commentsLoadState[ck] = { loading: false };
  sidebarLoading.value = false;

  if (result.error) {
    commentsLoadState[ck] = { ...commentsLoadState[ck], error: result.error };
    sidebarError.value = result.error;
    return;
  }

  const comments = result.data?.comments ?? [];
  commentsByAuthor[ck] = comments;
  sidebarComments.value = comments;
}

async function load() {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;
  const result = await commentsPresenter.getSuggestedOutreach(props.projectId, props.limit ?? 20);
  loading.value = false;
  if (result.error) {
    error.value = result.error;
    commenters.value = [];
    return;
  }
  commenters.value = result.data?.commenters ?? [];
}

onMounted(() => load());
watch(() => [props.projectId, props.limit], () => {
  commenters.value = [];
  commentersExpanded.value = false;
  selectedCommenter.value = null;
  showCommentsSidebar.value = false;
  if (props.projectId) load();
}, { deep: true });

defineExpose({
  reload: load
});
</script>

<style scoped>
.suggested-outreach-widget {
  margin-bottom: 0;
}

.loading-state,
.state-error {
  padding: 0.75rem 0;
}

.loading-text,
.state-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.state-error .state-desc {
  color: var(--color-danger, #dc2626);
}

.empty-state {
  padding: 1rem;
}

.empty-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.section-card-header {
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}

.commenters-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.commenter-card {
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  background: var(--color-bg);
}

.commenter-header {
  margin-bottom: 0.5rem;
}

.commenter-info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.commenter-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-primary, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.commenter-info {
  flex: 1;
  min-width: 0;
}

.commenter-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.commenter-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.commenter-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.commenter-source {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  font-weight: 500;
}

.commenter-stats {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.commenter-show-comments-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-success, #16a34a);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
}

.commenter-show-comments-btn:hover {
  text-decoration: underline;
}

.commenter-toggle-icon {
  width: 0.875rem;
  height: 0.875rem;
}


.commenter-message-btn {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  background: none;
  color: var(--color-success, #16a34a);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.commenter-message-btn:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.02));
}

.commenter-show-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-success, #16a34a);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
}

.commenter-show-more-btn:hover {
  text-decoration: underline;
}

.commenter-expand-icon {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.2s ease;
}

.commenter-expand-icon.rotated {
  transform: rotate(180deg);
}


.comments-loading,
.comments-error,
.comments-empty {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0 0;
}

.comments-error {
  color: var(--color-danger, #dc2626);
}

.comment-snippets {
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
}

.comment-snippet {
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}

.comment-link {
  color: var(--color-text);
  text-decoration: none;
  display: block;
  line-height: 1.35;
}

.comment-link:hover {
  color: var(--color-primary, #2563eb);
  text-decoration: underline;
}

.comment-date {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}


</style>
