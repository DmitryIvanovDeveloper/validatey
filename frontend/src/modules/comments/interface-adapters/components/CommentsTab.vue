<template>
  <div class="comments-tab-view">
    <!-- Fetch Comments Section -->
    <Card>
      <template #header>
        <div class="section-card-header">
          <span class="section-icon section-icon-comments" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1"/>
              <circle cx="12" cy="10" r="1"/>
              <circle cx="15" cy="10" r="1"/>
            </svg>
          </span>
          <div>
            <h3 class="section-title">Collect Comments</h3>
            <p class="section-subtitle">Add URLs from Reddit and Hacker News to collect comments</p>
          </div>
        </div>
      </template>

      <div class="comments-content">
        <!-- Reddit Card -->
        <Card class="source-card reddit-card">
          <template #header>
            <div class="section-card-header">
              <span class="section-icon section-icon-reddit" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="source-icon reddit-icon">
                  <circle cx="12" cy="12" r="10" fill="#FF4500"/>
                  <circle cx="12" cy="12" r="6" fill="white"/>
                  <circle cx="12" cy="12" r="2" fill="#FF4500"/>
                </svg>
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
            <div class="input-label-group">
              <svg viewBox="0 0 24 24" class="input-icon">
                <circle cx="12" cy="12" r="10" fill="#FF4500"/>
                <circle cx="12" cy="12" r="6" fill="white"/>
                <circle cx="12" cy="12" r="2" fill="#FF4500"/>
              </svg>
              <label class="input-label">Reddit Sources</label>
            </div>
            <div class="url-stats" v-if="viewModel.redditUrls.length > 0">
              <span class="url-count">{{ viewModel.redditUrls.length }}</span>
              <span class="url-count-label">URL{{ viewModel.redditUrls.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>

          <!-- List of URLs -->
          <div class="url-list" v-if="viewModel.redditUrls.length > 0">
            <div
              v-for="(url, index) in viewModel.redditUrls"
              :key="index"
              class="url-item"
              :class="{ 'url-item-error': !isValidUrl(url) }"
            >
              <div class="url-drag-handle">
                <svg viewBox="0 0 24 24" class="drag-icon">
                  <circle cx="4" cy="8" r="1.5"/>
                  <circle cx="4" cy="12" r="1.5"/>
                  <circle cx="4" cy="16" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="8" cy="12" r="1.5"/>
                  <circle cx="8" cy="16" r="1.5"/>
                </svg>
              </div>

              <div class="url-input-wrapper">
                <input
                  type="text"
                  :value="url"
                  readonly="true"
                  class="url-input-item"
                  :placeholder="getPlaceholderForIndex(index)"
                />
                <div class="url-validation" v-if="!isValidUrl(url)">
                  <svg viewBox="0 0 24 24" class="validation-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>

              <div class="url-actions">
                <button
                  @click="duplicateUrl(index)"
                  class="url-action-btn url-duplicate-btn"
                  type="button"
                  aria-label="Duplicate URL"
                  title="Duplicate URL"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

          <!-- Quick Actions -->
          <div class="url-quick-actions" v-if="viewModel.redditUrls.length > 0">
            <button
              @click="clearAllUrls"
              class="quick-action-btn quick-action-clear"
              type="button"
            >
              <svg viewBox="0 0 24 24" class="quick-icon">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Clear All
            </button>
            <button
              @click="pasteFromClipboard"
              class="quick-action-btn quick-action-paste"
              type="button"
            >
              <svg viewBox="0 0 24 24" class="quick-icon">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              Paste URLs
            </button>
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
        </Card>

        <!-- Hacker News Card -->
        <Card class="source-card hn-card">
          <template #header>
            <div class="section-card-header">
              <span class="section-icon section-icon-hn" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="source-icon hn-icon">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
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
            <div class="input-label-group">
              <svg viewBox="0 0 24 24" class="input-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <label class="input-label">Hacker News Sources</label>
            </div>
            <div class="url-stats" v-if="viewModel.hnUrls.length > 0">
              <span class="url-count">{{ viewModel.hnUrls.length }}</span>
              <span class="url-count-label">URL{{ viewModel.hnUrls.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>

          <!-- List of HN URLs -->
          <div class="url-list" v-if="viewModel.hnUrls.length > 0">
            <div
              v-for="(url, index) in viewModel.hnUrls"
              :key="index"
              class="url-item"
              :class="{ 'url-item-error': !isValidHnUrl(url) }"
            >
              <div class="url-drag-handle">
                <svg viewBox="0 0 24 24" class="drag-icon">
                  <circle cx="4" cy="8" r="1.5"/>
                  <circle cx="4" cy="12" r="1.5"/>
                  <circle cx="4" cy="16" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="8" cy="12" r="1.5"/>
                  <circle cx="8" cy="16" r="1.5"/>
                </svg>
              </div>

              <div class="url-input-wrapper">
                <input
                  type="text"
                  :value="url"
                  readonly="true"
                  class="url-input-item"
                  :placeholder="getHnPlaceholderForIndex(index)"
                />
                <div class="url-validation" v-if="!isValidHnUrl(url)">
                  <svg viewBox="0 0 24 24" class="validation-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
              </div>

              <div class="url-actions">
                <button
                  @click="duplicateHnUrl(index)"
                  class="url-action-btn url-duplicate-btn"
                  type="button"
                  aria-label="Duplicate URL"
                  title="Duplicate URL"
                >
                  <svg viewBox="0 0 24 24" class="action-icon">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

          <!-- Quick Actions -->
          <div class="url-quick-actions" v-if="viewModel.hnUrls.length > 0">
            <button
              @click="clearAllHnUrls"
              class="quick-action-btn quick-action-clear"
              type="button"
            >
              <svg viewBox="0 0 24 24" class="quick-icon">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Clear All
            </button>
            <button
              @click="pasteHnFromClipboard"
              class="quick-action-btn quick-action-paste"
              type="button"
            >
              <svg viewBox="0 0 24 24" class="quick-icon">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              Paste URLs
            </button>
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
        </Card>

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

        <!-- Show Comments Button -->
        <div v-if="viewModel.comments.length > 0" class="show-comments-section">
          <div class="comments-summary">
            <div class="comments-count-info">
              <span class="comments-count-number">{{ viewModel.comments.length }}</span>
              <span class="comments-count-label">comments collected</span>
            </div>
            <div v-if="getSourceStats.length > 0" class="comments-sources">
              <span class="sources-label">from</span>
              <div class="source-tags">
                <span
                  v-for="stat in getSourceStats"
                  :key="stat.source"
                  class="source-tag"
                  :class="stat.source.toLowerCase()"
                >
                  {{ stat.count }} {{ stat.source === 'reddit' ? 'Reddit' : 'HN' }}
                </span>
              </div>
            </div>
          </div>

          <div class="comments-actions">
            <Button @click="openCommentsSidebar" variant="primary" class="show-comments-btn">
              <template #icon>
                <svg viewBox="0 0 24 24" class="comments-icon">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <circle cx="9" cy="10" r="1"/>
                  <circle cx="12" cy="10" r="1"/>
                  <circle cx="15" cy="10" r="1"/>
                </svg>
              </template>
              Show Comments
            </Button>

            <button @click="exportComments" class="btn btn-secondary btn-sm export-btn">
              <svg viewBox="0 0 24 24" class="btn-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <!-- Comments Sidebar -->
        <Teleport to="body">
          <Transition name="slide-panel">
            <div v-if="showCommentsSidebar" class="detail-overlay" @click.self="closeCommentsSidebar">
              <div class="detail-panel comments-panel">
                <div class="detail-header">
                  <h3>All Comments ({{ viewModel.comments.length }})</h3>
                  <button type="button" class="btn-close" aria-label="Close" @click="closeCommentsSidebar">×</button>
                </div>
                <div class="detail-body">
                  <div class="comments-list-sidebar">
                    <div
                      v-for="comment in viewModel.comments"
                      :key="comment.id"
                      class="comment-item-sidebar"
                    >
                      <div class="comment-header-sidebar">
                        <div class="comment-author-sidebar">
                          <span class="source-badge" :class="comment.sourceType">
                            {{ comment.sourceType === 'reddit' ? 'R' : 'HN' }}
                          </span>
                          <span class="author-name">{{ comment.author || 'Anonymous' }}</span>
                        </div>
                        <div class="comment-date-sidebar">
                          {{ formatDate(comment.createdAt) }}
                        </div>
                      </div>

                      <div class="comment-content-sidebar">
                        {{ comment.content }}
                      </div>

                      <div v-if="comment.contextTitle" class="comment-context-sidebar">
                        From: {{ comment.contextTitle }}
                      </div>

                      <div class="comment-actions-sidebar">
                        <a
                          :href="comment.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="view-source-link"
                        >
                          <svg viewBox="0 0 24 24" class="external-link-icon">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15,3 21,3 21,9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          View on {{ comment.sourceType === 'reddit' ? 'Reddit' : 'Hacker News' }}
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
    </Card>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';
import Card from '../../../../shared/components/Card.vue';
import Button from '../../../../shared/components/atoms/Button.vue';

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
  return !hasRedditUrls && !hasHnUrls;
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

const commentsCountText = computed(() => {
  const count = viewModel.comments.length;
  return `${count} comment${count !== 1 ? 's' : ''} collected`;
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

// Reactive data
const newUrl = ref('');
const newUrlInput = ref<HTMLInputElement>();
const newHnUrl = ref('');
const newHnUrlInput = ref<HTMLInputElement>();
const showCommentsSidebar = ref(false);

// Methods
const addUrl = () => {
  if (newUrl.value.trim()) {
    presenter.addRedditUrl(newUrl.value.trim());
    newUrl.value = '';
    newUrlInput.value?.focus();
  }
};

const removeUrl = async (index: number) => {
  const url = viewModel.redditUrls[index];
  if (url) {
    await presenter.deleteSourceByUrl(props.projectId, url);
  }
};

const updateUrl = (index: number, url: string) => {
  presenter.updateRedditUrl(index, url);
};

const duplicateUrl = (index: number) => {
  const url = viewModel.redditUrls[index];
  if (url) {
    presenter.addRedditUrl(url);
  }
};

const clearAllUrls = async () => {
  if (confirm(`Remove all ${viewModel.redditUrls.length} URLs and their comments?`)) {
    // Delete each source from database
    for (const url of viewModel.redditUrls.slice()) { // slice() to avoid modifying while iterating
      await presenter.deleteSourceByUrl(props.projectId, url);
    }
  }
};

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const urls = parseBulkUrls(text);
    urls.forEach(url => {
      if (url.trim()) {
        presenter.addRedditUrl(url.trim());
      }
    });
  } catch (error) {
    console.warn('Failed to read clipboard:', error);
  }
};

const handlePaste = (event: ClipboardEvent, index: number) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t')) {
    event.preventDefault();
    const urls = parseBulkUrls(pastedText);
    if (urls.length > 1) {
      // Multiple URLs - insert them all
      urls.forEach((url, i) => {
        if (i === 0) {
          updateUrl(index, url);
        } else {
          presenter.addRedditUrl(url);
        }
      });
    }
  }
};

const handleBulkPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t') || pastedText.includes(' ')) {
    event.preventDefault();
    const urls = parseBulkUrls(pastedText);
    urls.forEach(url => {
      if (url.trim()) {
        presenter.addRedditUrl(url.trim());
      }
    });
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

const addHnUrl = () => {
  if (newHnUrl.value.trim()) {
    presenter.addHnUrl(newHnUrl.value.trim());
    newHnUrl.value = '';
    newHnUrlInput.value?.focus();
  }
};

const removeHnUrl = async (index: number) => {
  const url = viewModel.hnUrls[index];
  if (url) {
    await presenter.deleteSourceByUrl(props.projectId, url);
  }
};

const updateHnUrl = (index: number, url: string) => {
  presenter.updateHnUrl(index, url);
};

const duplicateHnUrl = (index: number) => {
  const url = viewModel.hnUrls[index];
  if (url) {
    presenter.addHnUrl(url);
  }
};

const clearAllHnUrls = async () => {
  if (confirm(`Remove all ${viewModel.hnUrls.length} HN URLs and their comments?`)) {
    // Delete each source from database
    for (const url of viewModel.hnUrls.slice()) { // slice() to avoid modifying while iterating
      await presenter.deleteSourceByUrl(props.projectId, url);
    }
  }
};

const pasteHnFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const urls = parseHnBulkUrls(text);
    urls.forEach(url => {
      if (url.trim()) {
        presenter.addHnUrl(url.trim());
      }
    });
  } catch (error) {
    console.warn('Failed to read clipboard:', error);
  }
};

const handleHnBulkPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.includes('\n') || pastedText.includes('\t') || pastedText.includes(' ')) {
    event.preventDefault();
    const urls = parseHnBulkUrls(pastedText);
    urls.forEach(url => {
      if (url.trim()) {
        presenter.addHnUrl(url.trim());
      }
    });
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
  showCommentsSidebar.value = true;
};

const closeCommentsSidebar = () => {
  showCommentsSidebar.value = false;
};

// Initialize presenter and load data on mount
onMounted(async () => {
  presenter.initialize();
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
}

.reddit-card .section-icon-reddit {
  background: linear-gradient(135deg, #FF4500, #FF6B35);
}

.hn-card .section-icon-hn {
  background: linear-gradient(135deg, #ff6600, #ff8533);
}

.reddit-card .section-icon-reddit,
.hn-card .section-icon-hn {
  color: white;
}

.reddit-card h4,
.hn-card h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.reddit-card .section-subtitle,
.hn-card .section-subtitle {
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
  border: 1px solid var(--color-accent-light);
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

.reddit-icon circle {
  fill: #FF4500;
}

.reddit-icon circle:last-child {
  fill: white;
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
  border: 1px solid var(--color-border);
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
  border: 1px solid #fecaca;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  border: 3px solid var(--color-border-light);
  border-top: 3px solid var(--color-accent);
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

.input-label-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.input-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.input-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.url-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-accent-bg);
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid var(--color-accent-light);
}

.url-count {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-accent-dark);
}

.url-count-label {
  font-size: 0.875rem;
  color: var(--color-accent);
  font-weight: 500;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  background: rgba(254, 226, 226, 0.8);
}

.url-item-error:hover {
  border-color: var(--color-error);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.url-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-text-muted);
  cursor: grab;
  flex-shrink: 0;
}

.url-drag-handle:hover {
  color: var(--color-text);
}

.drag-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 1.5;
}

.url-input-wrapper {
  flex: 1;
  position: relative;
}

.url-input-item {
  width: 100%;
  padding: 0.625rem 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
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

.url-duplicate-btn {
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-light);
}

.url-duplicate-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  transform: scale(1.05);
}

.url-remove-btn {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error-light);
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

/* Quick Actions */
.url-quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(248, 250, 252, 0.8);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.1);
}

.quick-action-clear:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
}

.quick-icon {
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
  border: 2px solid var(--color-border);
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
  border: 1px solid var(--color-border-light);
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
  background: white;
  width: 100%;
  max-width: 600px;
  height: 100%;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.comments-panel {
  max-width: 700px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}

.detail-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
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
  padding: 1.5rem;
}

.comments-list-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item-sidebar {
  padding: 1.25rem;
  border-radius: var(--radius-md);
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.comment-item-sidebar:hover {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(13, 148, 136, 0.2);
}

.comment-header-sidebar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-author-sidebar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.author-name {
  font-weight: 500;
}

.comment-date-sidebar {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  white-space: nowrap;
}

.comment-content-sidebar {
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  white-space: pre-wrap;
}

.comment-context-sidebar {
  background: var(--color-bg-subtle);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-accent-light);
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.comment-actions-sidebar {
  display: flex;
  justify-content: flex-end;
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
  }

  .comment-header-sidebar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>