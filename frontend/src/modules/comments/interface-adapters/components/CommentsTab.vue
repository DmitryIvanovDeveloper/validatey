<template>
  <div class="comments-tab-view">
    <!-- Reddit Card -->
        <Card class="source-card reddit-card">
          <template #header>
            <div class="section-card-header">
              <span aria-hidden="true" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                <img src="@/assets/icons/reddit-logo-2436.svg" alt="Reddit" class="source-icon reddit-icon" style="width: 100%; height: 100%;" />
              </span>
              <div>
                <h4 class="section-title">Reddit</h4>
                <p class="section-subtitle">Collect comments from Reddit posts</p>
              </div>
            </div>
          </template>

          <!-- Reddit Input -->
          <div class="input-section">
          <div class="url-input-header">
            <label class="input-label">Reddit Sources</label>
          </div>

          <!-- List of URLs -->
          <div class="url-list" v-if="viewModel.redditSources.length > 0">
            <div
              v-for="(source, index) in viewModel.redditSources"
              :key="source.id"
              class="url-item"
              :class="{ 'url-item-error': !isValidUrl(source.url) }"
            >

              <div class="url-input-wrapper">
                <input
                  type="text"
                  :value="source.url"
                  readonly="true"
                  class="url-input-item"
                  :placeholder="getPlaceholderForIndex(index)"
                />
                <div class="url-validation" v-if="!isValidUrl(source.url)">
                  <svg viewBox="0 0 24 24" class="validation-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>

              <div class="url-actions">
                <button
                  @click="openCommentsSidebarForSource(source.id)"
                  class="url-action-btn url-comments-btn"
                  type="button"
                  :aria-label="`View comments for ${source.url}`"
                  :title="`View comments for ${source.url}`"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1"/>
                    <circle cx="12" cy="10" r="1"/>
                    <circle cx="15" cy="10" r="1"/>
                  </svg>
                </button>
                <button
                  @click="removeUrl(index)"
                  class="url-action-btn url-remove-btn"
                  type="button"
                  aria-label="Remove URL"
                  title="Remove URL"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>


          <!-- Add URL input -->
          <div class="add-url-section">
            <div class="add-url-input-group">
              <input
                ref="newUrlInput"
                type="text"
                v-model="newUrl"
                @keyup.enter="addUrl"
                @paste="handleBulkPaste"
                placeholder="Paste Reddit URLs here..."
                class="url-input"
              />
              <button
                @click="addUrl"
                class="add-url-btn"
                type="button"
                :disabled="!newUrl.trim()"
              >
                <svg viewBox="0 0 24 24" class="add-icon">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
        </Card>

        <!-- Hacker News Card -->
        <Card class="source-card hn-card">
          <template #header>
            <div class="section-card-header">
              <span aria-hidden="true" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                <img src="@/assets/icons/hacker-news.svg" alt="Hacker News" class="source-icon hn-icon" style="width: 100%; height: 100%;" />
              </span>
              <div>
                <h4 class="section-title">Hacker News</h4>
                <p class="section-subtitle">Collect comments from Hacker News posts</p>
              </div>
            </div>
          </template>

          <!-- Hacker News Input -->
          <div class="input-section">
          <div class="url-input-header">
            <label class="input-label">Hacker News Sources</label>
          </div>

          <!-- List of HN URLs -->
          <div class="url-list" v-if="viewModel.hnSources.length > 0">
            <div
              v-for="(source, index) in viewModel.hnSources"
              :key="source.id"
              class="url-item"
              :class="{ 'url-item-error': !isValidHnUrl(source.url) }"
            >

              <div class="url-input-wrapper">
                <input
                  type="text"
                  :value="source.url"
                  readonly="true"
                  class="url-input-item"
                  :placeholder="getHnPlaceholderForIndex(index)"
                />
                <div class="url-validation" v-if="!isValidHnUrl(source.url)">
                  <svg viewBox="0 0 24 24" class="validation-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>

              <div class="url-actions">
                <button
                  @click="openCommentsSidebarForSource(source.id)"
                  class="url-action-btn url-comments-btn"
                  type="button"
                  :aria-label="`View comments for ${source.url}`"
                  :title="`View comments for ${source.url}`"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1"/>
                    <circle cx="12" cy="10" r="1"/>
                    <circle cx="15" cy="10" r="1"/>
                  </svg>
                </button>
                <button
                  @click="removeHnUrl(index)"
                  class="url-action-btn url-remove-btn"
                  type="button"
                  aria-label="Remove URL"
                  title="Remove URL"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>


          <!-- Add HN URL input -->
          <div class="add-url-section">
            <div class="add-url-input-group">
              <input
                ref="newHnUrlInput"
                type="text"
                v-model="newHnUrl"
                @keyup.enter="addHnUrl"
                @paste="handleHnBulkPaste"
                placeholder="Paste Hacker News URLs here..."
                class="url-input"
              />
              <button
                @click="addHnUrl"
                class="add-url-btn"
                type="button"
                :disabled="!newHnUrl.trim()"
              >
                <svg viewBox="0 0 24 24" class="add-icon">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
        </Card>

        <!-- LinkedIn Card -->
        <Card class="source-card linkedin-card">
          <template #header>
            <div class="section-card-header">
              <span aria-hidden="true" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                <svg class="source-icon linkedin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0077B5" style="width: 100%; height: 100%;">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </span>
              <div>
                <h4 class="section-title">LinkedIn</h4>
                <p class="section-subtitle">Collect comments from LinkedIn posts</p>
              </div>
            </div>
          </template>

          <!-- LinkedIn Input -->
          <div class="input-section">
          <div class="url-input-header">
            <label class="input-label">LinkedIn Sources</label>
          </div>

          <!-- List of LinkedIn URLs -->
          <div class="url-list" v-if="viewModel.linkedinSources && viewModel.linkedinSources.length > 0">
            <div
              v-for="(source, index) in viewModel.linkedinSources"
              :key="source.id"
              class="url-item"
              :class="{ 'url-item-error': !isValidLinkedInUrl(source.url) }"
            >

              <div class="url-input-wrapper">
                <input
                  type="text"
                  :value="source.url"
                  readonly="true"
                  class="url-input-item"
                  :placeholder="getLinkedInPlaceholderForIndex(index)"
                />
                <div class="url-validation" v-if="!isValidLinkedInUrl(source.url)">
                  <svg viewBox="0 0 24 24" class="validation-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>

              <div class="url-actions">
                <button
                  @click="openCommentsSidebarForSource(source.id)"
                  class="url-action-btn url-comments-btn"
                  type="button"
                  :aria-label="`View comments for ${source.url}`"
                  :title="`View comments for ${source.url}`"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1"/>
                    <circle cx="12" cy="10" r="1"/>
                    <circle cx="15" cy="10" r="1"/>
                  </svg>
                </button>
                <button
                  @click="removeLinkedInUrl(index)"
                  class="url-action-btn url-remove-btn"
                  type="button"
                  aria-label="Remove URL"
                  title="Remove URL"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>


          <!-- Add LinkedIn URL input -->
          <div class="add-url-section">
            <div class="add-url-input-group">
              <input
                ref="newLinkedInUrlInput"
                type="text"
                v-model="newLinkedInUrl"
                @keyup.enter="addLinkedInUrl"
                @paste="handleLinkedInBulkPaste"
                placeholder="Paste LinkedIn post URLs here..."
                class="url-input"
              />
              <button
                @click="addLinkedInUrl"
                class="add-url-btn"
                type="button"
                :disabled="!newLinkedInUrl.trim()"
              >
                <svg viewBox="0 0 24 24" class="add-icon">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
        </Card>

    <!-- Actions Section -->
    <div class="actions-container">
        <!-- Fetch Button -->
        <div class="action-section">
          <Button
            @click="handleFetchComments"
            :disabled="isFetchDisabled || viewModel.isFetching"
            variant="primary"
            :loading="viewModel.isFetching"
            class="fetch-btn-custom"
          >
            <template v-if="!viewModel.isFetching" #icon>
              <svg viewBox="0 0 24 24" class="fetch-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </template>
            {{ viewModel.isFetching ? 'Fetching Comments...' : 'Fetch Comments' }}
          </Button>
        </div>


    </div>

    <!-- Comments Sidebar -->
        <Teleport to="body">
          <Transition name="slide-panel">
            <div v-if="showCommentsSidebar" class="detail-overlay" @click.self="closeCommentsSidebar">
              <div class="detail-panel comments-panel">
                <div class="detail-header">
                  <div class="header-info">
                    <h3>{{ commentsFilterUrl ? 'Comments' : 'All Comments' }}</h3>
                    <div class="comment-count-badge">
                      {{ filteredComments.length }}
                    </div>
                  </div>
                  <button type="button" class="btn-close" aria-label="Close" @click="closeCommentsSidebar">
                    <svg viewBox="0 0 24 24" class="close-icon">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div class="detail-body">
                  <div v-if="filteredComments.length === 0" class="comments-empty-state">
                    <div class="empty-comments-icon">💬</div>
                    <h4>No comments found</h4>
                    <p>{{ commentsFilterUrl ? 'No comments available for this URL yet.' : 'No comments have been collected yet.' }}</p>
                  </div>
                  <div v-else class="comments-list-sidebar">
                    <div
                      v-for="comment in filteredComments"
                      :key="comment.id"
                      class="comment-item-sidebar"
                    >
                      <!-- Comment Header -->
                      <div class="comment-header-sidebar">
                        <div class="comment-author-section">
                          <span class="source-badge" :class="comment.sourceType">
                            {{ comment.sourceType === 'reddit' ? 'R' : 'HN' }}
                          </span>
                          <span class="author-name">{{ comment.author || 'Anonymous' }}</span>
                          <span class="comment-separator">•</span>
                          <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                        </div>
                      </div>

                      <!-- Comment Content -->
                      <div class="comment-content-sidebar">
                        {{ truncateForFairUse(decodeHtmlEntities(comment.content)) }}
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

        <!-- Error Message -->
        <div v-if="viewModel.error" class="error-message">
          <svg viewBox="0 0 24 24" class="error-icon">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          {{ viewModel.error }}
        </div>
  </div>

  <!-- Confirm Dialog -->
  <ConfirmDialog
    v-model="showConfirmDialog"
    :title="confirmDialogConfig.title"
    :message="confirmDialogConfig.message"
    :variant="confirmDialogConfig.variant"
    :confirm-label="confirmDialogConfig.confirmLabel"
    :cancel-label="confirmDialogConfig.cancelLabel"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { decodeHtmlEntities } from '../../../../shared/utils/text';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';
import Card from '../../../../shared/components/Card.vue';
import Button from '../../../../shared/components/atoms/Button.vue';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog.vue';
import { AlertTriangle, Trash2, ExternalLink } from 'lucide-vue-next';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

// Get presenter from DI container
const presenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

// Create reactive viewModel for Vue reactivity
const viewModel = reactive(presenter.viewModel);

// Sync changes back to presenter (for methods that modify presenter.viewModel)
Object.defineProperty(presenter, 'viewModel', {
  get: () => viewModel,
  set: (value) => Object.assign(viewModel, value)
});

// Computed properties
const isFetchDisabled = computed(() => {
  // Check if there are any valid URLs in either source
  const hasRedditUrls = viewModel.redditUrls.length > 0 && viewModel.redditUrls.every(url => url.trim());
  const hasHnUrls = viewModel.hnUrls.length > 0 && viewModel.hnUrls.every(url => url.trim());
  const hasLinkedInUrls = viewModel.linkedinUrls && viewModel.linkedinUrls.length > 0 && viewModel.linkedinUrls.every(url => url.trim());
  return !hasRedditUrls && !hasHnUrls && !hasLinkedInUrls;
});

const getSourceStats = computed(() => {
  const stats = viewModel.comments.reduce((acc, comment) => {
    const source = comment.sourceType;
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(stats).map(([source, count]) => ({
    source,
    count
  })).sort((a, b) => b.count - a.count);
});

// Confirm dialog state
const showConfirmDialog = ref(false);
const confirmDialogConfig = ref({
  title: 'Confirm Deletion',
  message: '',
  variant: 'danger' as 'default' | 'danger',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel'
});

// Pending action to execute after confirmation
let pendingAction: (() => Promise<void>) | null = null;

// Show confirmation dialog
const showConfirmation = (title: string, message: string, action: () => Promise<void>, variant: 'default' | 'danger' = 'danger') => {
  confirmDialogConfig.value = {
    title,
    message,
    variant,
    confirmLabel: variant === 'danger' ? 'Delete' : 'Confirm',
    cancelLabel: 'Cancel'
  };
  pendingAction = action;
  showConfirmDialog.value = true;
};

// Handle confirmation
const handleConfirm = async () => {
  if (pendingAction) {
    await pendingAction();
    pendingAction = null;
  }
  showConfirmDialog.value = false;
};

// Handle cancel
const handleCancel = () => {
  pendingAction = null;
  showConfirmDialog.value = false;
};

const commentsCountText = computed(() => {
  const count = viewModel.comments.length;
  return `${count} comment${count !== 1 ? 's' : ''} collected`;
});

const filteredComments = computed(() => {
  // If filtering by specific URL, show comments loaded for that URL
  if (commentsFilterUrl.value) {
    return viewModel.commentsForUrl;
  }

  // Otherwise show all comments
  return viewModel.comments;
});



// Methods
const handleFeedTypeChange = () => {
  // Clear error when user changes feed type
  if (viewModel.error) {
    viewModel.error = null;
  }
};

const handleFetchComments = async () => {
  try {
    viewModel.isFetching = true;
    viewModel.error = null;
    await presenter.startFetch(props.projectId);
  } finally {
    // Ensure loading state is reset
    viewModel.isFetching = false;
  }
};

const exportComments = () => {
  const dataStr = JSON.stringify(viewModel.comments, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `comments-${props.projectId}-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength);
};

const truncateForFairUse = (text: string, maxLength: number = 500) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Reactive data
const newUrl = ref('');
const newUrlInput = ref<HTMLInputElement>();
const newHnUrl = ref('');
const newHnUrlInput = ref<HTMLInputElement>();
const newLinkedInUrl = ref('');
const newLinkedInUrlInput = ref<HTMLInputElement>();
const showCommentsSidebar = ref(false);
const commentsFilterUrl = ref<string | null>(null);

// Methods
const addUrl = async () => {
  if (newUrl.value.trim()) {
    try {
      await presenter.addRedditUrl(newUrl.value.trim(), props.projectId);
      newUrl.value = '';
      newUrlInput.value?.focus();
    } catch (error) {
      console.error('Failed to add Reddit URL:', error);
      // Error will be handled by presenter and shown in UI
    }
  }
};

const removeUrl = async (index: number) => {
  const url = viewModel.redditSources[index]?.url ?? viewModel.redditUrls[index];
  if (url) {
    const message = `
      <div style="display: flex; align-items: center; margin-bottom: 1rem;">
        <AlertTriangle class="warning-icon" size="20" />
        <strong>Delete Reddit Source</strong>
      </div>

      <p style="margin-bottom: 1rem;">Are you sure you want to remove this Reddit source? This action cannot be undone.</p>

      <div class="url-text" style="background: rgba(255, 69, 0, 0.1); border-left: var(--border-width) var(--border-style) #ff4500; padding-left: 0.75rem;">
        <ExternalLink size="14" style="margin-right: 0.5rem; vertical-align: middle;" />
        ${url}
      </div>

      <div class="warning-box danger" style="background: #fef2f2; border-color: #ef4444;">
        <Trash2 size="20" style="color: #ef4444; flex-shrink: 0;" />
        <div>
          <div class="warning-title" style="color: #dc2626;">⚠️ Data Loss Warning</div>
          <div class="warning-text" style="color: #dc2626;">
            All comments from this source will be permanently deleted.
          </div>
        </div>
      </div>
    `;
    showConfirmation('Delete Reddit Source', message, async () => {
      await presenter.deleteSourceByUrl(props.projectId, url);
    });
  }
};

const updateUrl = async (index: number, url: string) => {
  try {
    await presenter.updateRedditUrl(index, url, props.projectId);
  } catch (error) {
    console.error('Failed to update Reddit URL:', error);
    // Error will be handled by presenter and shown in UI
  }
};



const handlePaste = async (event: ClipboardEvent, index: number) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t')) {
    event.preventDefault();
    const urls = parseBulkUrls(pastedText);
    if (urls.length > 1) {
      // Multiple URLs - insert them all
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (i === 0) {
          await updateUrl(index, url);
        } else {
          try {
            await presenter.addRedditUrl(url, props.projectId);
          } catch (error) {
            console.error('Failed to add Reddit URL from paste:', error);
          }
        }
      }
    }
  }
};

const handleBulkPaste = async (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t') || pastedText.includes(' ')) {
    event.preventDefault();
    const urls = parseBulkUrls(pastedText);
    for (const url of urls) {
      if (url.trim()) {
        try {
          await presenter.addRedditUrl(url.trim(), props.projectId);
        } catch (error) {
          console.error('Failed to add Reddit URL from bulk paste:', error);
        }
      }
    }
    newUrl.value = '';
  }
};

const parseBulkUrls = (text: string): string[] => {
  return text
    .split(/[\n\t]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Clean up URLs
      if (line.startsWith('http') && !line.includes('reddit.com')) {
        return ''; // Skip non-Reddit URLs
      }
      return line;
    })
    .filter(line => line.length > 0);
};

const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is ok for now
  const trimmed = url.trim();

  // Check if it's a subreddit
  if (trimmed.match(/^r\/[a-zA-Z0-9_]+$/)) return true;
  if (trimmed.match(/^\/?r\/[a-zA-Z0-9_]+\/?$/)) return true;

  // Check if it's a Reddit URL
  if (trimmed.includes('reddit.com')) {
    return trimmed.match(/reddit\.com\/r\/[^\/]+/) !== null;
  }

  return false;
};

const isValidHnUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is ok for now
  const trimmed = url.trim();
  // Check for HN item URL pattern
  return /^https?:\/\/news\.ycombinator\.com\/item\?id=\d+$/.test(trimmed);
};

const addHnUrl = async () => {
  if (newHnUrl.value.trim()) {
    try {
      await presenter.addHnUrl(newHnUrl.value.trim(), props.projectId);
      newHnUrl.value = '';
      newHnUrlInput.value?.focus();
    } catch (error) {
      console.error('Failed to add HN URL:', error);
      // Error will be handled by presenter and shown in UI
    }
  }
};

const removeHnUrl = async (index: number) => {
  const url = viewModel.hnUrls[index];
  if (url) {
    const message = `
      <div style="display: flex; align-items: center; margin-bottom: 1rem;">
        <AlertTriangle class="warning-icon" size="20" />
        <strong>Delete Hacker News Source</strong>
      </div>

      <p style="margin-bottom: 1rem;">Are you sure you want to remove this Hacker News source? This action cannot be undone.</p>

      <div class="url-text" style="background: rgba(255, 102, 0, 0.1); border-left: var(--border-width) var(--border-style) #ff6600; padding-left: 0.75rem;">
        <ExternalLink size="14" style="margin-right: 0.5rem; vertical-align: middle;" />
        ${url}
      </div>

      <div class="warning-box danger" style="background: #fef2f2; border-color: #ef4444;">
        <Trash2 size="20" style="color: #ef4444; flex-shrink: 0;" />
        <div>
          <div class="warning-title" style="color: #dc2626;">⚠️ Data Loss Warning</div>
          <div class="warning-text" style="color: #dc2626;">
            All comments collected from this Hacker News source will be permanently deleted and cannot be recovered.
          </div>
        </div>
      </div>
    `;
    showConfirmation('Delete Hacker News Source', message, async () => {
      await presenter.deleteSourceByUrl(props.projectId, url);
    });
  }
};

const updateHnUrl = async (index: number, url: string) => {
  try {
    await presenter.updateHnUrl(index, url, props.projectId);
  } catch (error) {
    console.error('Failed to update HN URL:', error);
    // Error will be handled by presenter and shown in UI
  }
};

const isValidLinkedInUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is ok for now
  const trimmed = url.trim();
  // Check for LinkedIn post URL pattern
  return /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed\/update|activity-)/.test(trimmed);
};

const getLinkedInPlaceholderForIndex = (index: number): string => {
  const placeholders = [
    'https://www.linkedin.com/posts/activity-1234567890',
    'https://www.linkedin.com/feed/update/1234567890',
    'https://www.linkedin.com/posts/activity-0987654321'
  ];
  return placeholders[index % placeholders.length];
};

const addLinkedInUrl = async () => {
  if (newLinkedInUrl.value.trim()) {
    try {
      await presenter.addLinkedInUrl(newLinkedInUrl.value.trim(), props.projectId);
      newLinkedInUrl.value = '';
      newLinkedInUrlInput.value?.focus();
    } catch (error) {
      console.error('Failed to add LinkedIn URL:', error);
      // Error will be handled by presenter and shown in UI
    }
  }
};

const removeLinkedInUrl = async (index: number) => {
  const url = viewModel.linkedinSources[index]?.url ?? viewModel.linkedinUrls[index];
  if (url) {
    const message = `
      <div style="display: flex; align-items: center; margin-bottom: 1rem;">
        <AlertTriangle class="warning-icon" size="20" />
        <strong>Delete LinkedIn Source</strong>
      </div>

      <p style="margin-bottom: 1rem;">Are you sure you want to remove this LinkedIn source? This action cannot be undone.</p>

      <div class="url-text" style="background: rgba(0, 119, 181, 0.1); border-left: var(--border-width) var(--border-style) #0077B5; padding-left: 0.75rem;">
        <ExternalLink size="14" style="margin-right: 0.5rem; vertical-align: middle;" />
        ${url}
      </div>

      <div class="warning-box danger" style="background: #fef2f2; border-color: #ef4444;">
        <Trash2 size="20" style="color: #ef4444; flex-shrink: 0;" />
        <div>
          <div class="warning-title" style="color: #dc2626;">⚠️ Data Loss Warning</div>
          <div class="warning-text" style="color: #dc2626;">
            All comments collected from this LinkedIn source will be permanently deleted and cannot be recovered.
          </div>
        </div>
      </div>
    `;
    showConfirmation('Delete LinkedIn Source', message, async () => {
      await presenter.deleteSourceByUrl(props.projectId, url);
    });
  }
};

const handleLinkedInBulkPaste = async (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t') || pastedText.includes(' ')) {
    event.preventDefault();
    const urls = pastedText
      .split(/[\n\t ]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('linkedin.com'));
    for (const url of urls) {
      if (url.trim()) {
        try {
          await presenter.addLinkedInUrl(url.trim(), props.projectId);
        } catch (error) {
          console.error('Failed to add LinkedIn URL from bulk paste:', error);
        }
      }
    }
    newLinkedInUrl.value = '';
  }
};

const handleHnBulkPaste = async (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t') || pastedText.includes(' ')) {
    event.preventDefault();
    const urls = parseHnBulkUrls(pastedText);
    for (const url of urls) {
      if (url.trim()) {
        try {
          await presenter.addHnUrl(url.trim(), props.projectId);
        } catch (error) {
          console.error('Failed to add HN URL from bulk paste:', error);
        }
      }
    }
    newHnUrl.value = '';
  }
};

const parseHnBulkUrls = (text: string): string[] => {
  return text
    .split(/[\n\t]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Clean up URLs
      if (line.startsWith('http') && !line.includes('news.ycombinator.com')) {
        return ''; // Skip non-HN URLs
      }
      return line;
    })
    .filter(line => line.length > 0);
};

const getHnPlaceholderForIndex = (index: number): string => {
  const placeholders = [
    'https://news.ycombinator.com/item?id=46966201',
    'https://news.ycombinator.com/item?id=46966202',
    'https://news.ycombinator.com/item?id=46966203',
    'https://news.ycombinator.com/item?id=46966204'
  ];
  return placeholders[index % placeholders.length];
};

const getPlaceholderForIndex = (index: number): string => {
  const placeholders = [
    'https://reddit.com/r/startup/comments/abc123',
    'r/technology',
    'https://reddit.com/r/productivity',
    'r/indiehackers'
  ];
  return placeholders[index % placeholders.length];
};

const openCommentsSidebar = () => {
  commentsFilterUrl.value = null;
  showCommentsSidebar.value = true;
};

const openCommentsSidebarForUrl = async (url: string) => {
  await presenter.loadCommentsByUrl(props.projectId, url);
  commentsFilterUrl.value = url;
  showCommentsSidebar.value = true;
};

const openCommentsSidebarForSource = async (sourceId: string) => {
  await presenter.loadCommentsBySourceId(props.projectId, sourceId);
  commentsFilterUrl.value = sourceId; // used only as a truthy flag to show commentsForUrl
  showCommentsSidebar.value = true;
};

const closeCommentsSidebar = () => {
  showCommentsSidebar.value = false;
  commentsFilterUrl.value = null;
  viewModel.commentsForUrl = []; // Clear URL-specific comments
};

// Initialize presenter and load data on mount
onMounted(async () => {
  await presenter.initialize(props.projectId);
  await presenter.loadComments(props.projectId);
});
</script>

<style scoped>
.comments-tab-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section headers */
.section-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  color: white;
}

.section-icon-comments {
  background: #FF4500;
}

.section-icon-list {
  background: #6366f1;
}

/* Source Cards */
.source-card {
  margin-bottom: 1.5rem;
  background: none;
}

/* Actions Container */
.actions-container {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reddit-card .section-icon-reddit {
  background: linear-gradient(135deg, #FF4500, #FF6B35);
}

.hn-card .section-icon-hn {
  background: linear-gradient(135deg, #ff6600, #ff8533);
}

.linkedin-card .section-icon-linkedin {
  background: linear-gradient(135deg, #0077B5, #00A0DC);
}

.reddit-card .section-icon-reddit,
.hn-card .section-icon-hn,
.linkedin-card .section-icon-linkedin {
  color: white;
}

.reddit-card h4,
.hn-card h4,
.linkedin-card h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.reddit-card .section-subtitle,
.hn-card .section-subtitle,
.linkedin-card .section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.comments-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 1rem;
}

.comments-header-main {
  flex: 1;
}

.comments-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.comments-count {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.count-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

.count-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.comments-sources {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sources-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.source-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.source-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.source-tag.reddit {
  background: var(--color-accent-bg);
  color: var(--color-accent-dark);
  border: var(--border-width) var(--border-style) var(--color-accent-light);
}

.source-tag.hackernews {
  background: linear-gradient(135deg, #ff6600, #ff8533);
  color: white;
}

.comments-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 2;
}

/* Comments content */
.comments-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.source-icon {
  width: 1rem;
  height: 1rem;
}

.reddit-icon {
  width: 100%;
  height: 100%;
}

/* Input sections */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.url-input,
.feed-select {
  padding: 0.75rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
}

.url-input:focus,
.feed-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.input-help {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Action section */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fetch-btn-custom {
  width: 100%;
  justify-content: center;
}

.fetch-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}


/* Error message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: var(--border-width) var(--border-style) #fecaca;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.875rem;
}

.error-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Comments list content */
.comments-list-content {
  padding: 1.5rem;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
}

.loading-state p {
  color: var(--color-text-secondary);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 4rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  border: var(--border-width) var(--border-style) rgba(255, 255, 255, 0.2);
  margin: 1rem 0;
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent-light), transparent);
  border-radius: 1px;
}

.empty-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--color-text-muted);
  stroke-width: 1.5;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

.empty-icon-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent-bg) 0%, transparent 70%);
  opacity: 0.3;
  animation: pulse 2s ease-in-out infinite alternate;
}

.empty-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 500px;
}

.empty-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  background: linear-gradient(135deg, var(--color-text), var(--color-text-muted));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-desc {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse {
  0% { opacity: 0.2; transform: scale(1); }
  100% { opacity: 0.4; transform: scale(1.05); }
}

@keyframes commentSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  border: var(--border-width) var(--border-style) rgba(255, 255, 255, 0.2);
  margin: 1rem 0;
}

.loading-state p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-weight: 500;
}

/* Loading spinner */
.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: var(--border-width) var(--border-style) var(--color-border-light);
  border-top: var(--border-width) var(--border-style) var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* URL Input Header */
.url-input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}


.input-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}


/* URL List */
.url-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.url-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: var(--border-width) var(--border-style) rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
}

.url-item:hover {
  border-color: rgba(13, 148, 136, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.url-item:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.url-item-error {
  border-color: var(--color-error-light);
  background: none;
}

.url-item-error:hover {
  border-color: var(--color-error);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}


.url-input-wrapper {
  flex: 1;
  position: relative;
}

.url-input-item {
  width: 100%;
  padding: 0.625rem 0.75rem;
  padding-right: 2.5rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  font-family: var(--font-mono);
}

.url-input-item:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.url-input-item:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.url-input-item::placeholder {
  font-family: var(--font-sans);
  color: var(--color-text-muted);
}

.url-validation {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.validation-icon {
  width: 1rem;
  height: 1rem;
  stroke: var(--color-error);
  stroke-width: 2;
  fill: none;
}

.url-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.url-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}


.url-comments-btn {
  background: var(--color-accent);
  color: white;
  border: var(--border-width) var(--border-style) var(--color-accent);
}

.url-comments-btn:hover {
  background: var(--color-accent-hover);
  transform: scale(1.05);
}


.url-remove-btn {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--border-width) var(--border-style) var(--color-error-light);
}

.url-remove-btn:hover {
  background: var(--color-error);
  color: white;
  transform: scale(1.05);
}

.action-icon {
  width: 0.875rem;
  height: 0.875rem;
  stroke: currentColor;
  stroke-width: 2;
}


/* Add URL Section */
.add-url-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-url-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.url-input {
  flex: 1;
  padding: 0.75rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  font-family: var(--font-mono);
}

.url-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.url-input::placeholder {
  color: var(--color-text-muted);
  font-family: var(--font-sans);
}

.add-url-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.add-url-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
}

.add-url-btn:disabled {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  stroke-width: 2.5;
}


/* Responsive */
@media (max-width: 768px) {
  .comments-header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .comments-actions {
    justify-content: center;
  }

  .comments-stats {
    align-items: center;
    text-align: center;
  }

  .comments-sources {
    justify-content: center;
  }

  .source-tags {
    justify-content: center;
  }
}

/* Show Comments Section */
.show-comments-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(248, 250, 252, 0.8);
  border-radius: var(--radius-md);
  border: var(--border-width) var(--border-style) var(--color-border-light);
}

.comments-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.comments-count-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.comments-count-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

.comments-count-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.comments-sources {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comments-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.show-comments-btn {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.show-comments-btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
}

.comments-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 2;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* Comments Sidebar */
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

.comment-count-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: var(--color-accent);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.9rem;
  background: transparent;
  color: var(--color-accent);
  border: var(--border-width) var(--border-style) var(--color-accent);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-outline:hover {
  background: var(--color-accent);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(13, 148, 136, 0.2);
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

.btn-icon {
  width: 0.875rem;
  height: 0.875rem;
  stroke: currentColor;
  stroke-width: 2;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-border-light);
  color: var(--color-text);
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
}

.comment-time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.comment-content-sidebar {
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.comment-actions-sidebar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}


.view-source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  color: var(--color-accent);
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

.view-source-link:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.comments-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-comments-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
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
  max-width: 300px;
  line-height: 1.5;
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

@media (max-width: 640px) {
  .count-number {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .detail-overlay {
    padding: 0.5rem;
  }

  .detail-panel {
    max-width: none;
  }

  .comments-panel {
    max-width: none;
  }

  .comments-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .comments-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .show-comments-btn {
    width: 100%;
    justify-content: center;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }

  .comment-item-sidebar {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .comment-header-sidebar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comment-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comment-author-section {
    flex-wrap: wrap;
  }

  .comment-actions-sidebar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .comment-stats {
    justify-content: center;
  }

  .detail-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-info {
    width: 100%;
    justify-content: space-between;
  }

  .fair-use-indicator {
    display: block;
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(156, 163, 175, 0.1);
    border-radius: 3px;
  }
}
</style>