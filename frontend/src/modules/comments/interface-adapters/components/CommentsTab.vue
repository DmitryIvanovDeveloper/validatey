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
            <p class="section-subtitle">Choose a source and start collecting comments</p>
          </div>
        </div>
      </template>

      <div class="comments-content">
        <!-- Comments Table Header -->
        <div v-if="viewModel.comments.length > 0" class="comments-table-header">
          <div class="comments-stats">
            <div class="comments-count">
              <span class="count-number">{{ viewModel.comments.length }}</span>
              <span class="count-label">comments</span>
            </div>
            <div class="comments-sources" v-if="getSourceStats.length > 0">
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
            <button
              @click="exportComments"
              class="btn btn-secondary btn-sm"
            >
              <svg viewBox="0 0 24 24" class="btn-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <!-- Source Selector -->
        <div class="source-selector">
          <label class="source-selector-label">Select Source:</label>
          <div class="source-options">
            <label class="source-option">
              <input
                type="radio"
                value="reddit"
                v-model="viewModel.selectedSource"
                @change="handleSourceChange"
              />
              <span class="source-option-text">
                <svg viewBox="0 0 24 24" class="source-icon reddit-icon">
                  <circle cx="12" cy="12" r="10" fill="#FF4500"/>
                  <circle cx="12" cy="12" r="6" fill="white"/>
                  <circle cx="12" cy="12" r="2" fill="#FF4500"/>
                </svg>
                Reddit
              </span>
            </label>
            <label class="source-option">
              <input
                type="radio"
                value="hackernews"
                v-model="viewModel.selectedSource"
                @change="handleSourceChange"
              />
              <span class="source-option-text">
                <svg viewBox="0 0 24 24" class="source-icon hn-icon">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Hacker News
              </span>
            </label>
          </div>
        </div>

        <!-- Reddit Input -->
        <div v-if="viewModel.selectedSource === 'reddit'" class="input-section" :key="'reddit-' + viewModel.selectedSource">
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
        </div>

        <!-- Hacker News Input -->
        <div v-if="viewModel.selectedSource === 'hackernews'" class="input-section" :key="'hn-' + viewModel.selectedSource">
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
        </div>

        <!-- Comments Table -->
        <div v-if="viewModel.comments.length > 0" class="comments-table-section">
          <div class="table-wrap">
            <table class="comments-table" aria-label="Collected comments">
              <thead>
                <tr>
                  <th class="col-author">Author</th>
                  <th class="col-content">Content</th>
                  <th class="col-date">Date</th>
                  <th class="col-source">Source</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(comment, index) in paginatedComments"
                  :key="comment.id"
                  :class="{ 'row-selected': detailCommentId === comment.id }"
                  @click="openDetail(comment.id)"
                >
                  <td class="col-author">
                    <div class="author-info">
                      <span class="source-badge" :class="comment.sourceType">
                        {{ comment.sourceType === 'reddit' ? 'R' : 'HN' }}
                      </span>
                      {{ comment.author || 'Anonymous' }}
                    </div>
                  </td>
                  <td class="col-content">
                    <span class="cell-text">{{ truncateText(comment.content, 100) }}</span>
                    <span v-if="comment.content.length > 100" class="read-more">...</span>
                  </td>
                  <td class="col-date">{{ formatDate(comment.createdAt) }}</td>
                  <td class="col-source">
                    <span class="source-label" :class="comment.sourceType">
                      {{ comment.sourceType === 'reddit' ? 'Reddit' : 'HN' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-bar">
            <span class="pagination-info">
              {{ filteredComments.length }} comment(s)
              <template v-if="totalPages > 1">
                · Page {{ currentPage }} of {{ totalPages }}
              </template>
            </span>
            <div class="pagination-controls">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="currentPage = Math.max(1, currentPage - 1)">
                Previous
              </button>
              <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage >= totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!viewModel.isFetching && viewModel.comments.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <svg viewBox="0 0 24 24" class="empty-icon" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1"/>
              <circle cx="12" cy="10" r="1"/>
              <circle cx="15" cy="10" r="1"/>
            </svg>
            <div class="empty-icon-glow"></div>
          </div>
          <div class="empty-content">
            <p class="empty-title">No comments collected yet</p>
            <p class="empty-desc">Start by selecting a source above and clicking "Fetch Comments" to begin collecting insights from Reddit and Hacker News.</p>
          </div>
        </div>

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

    <!-- Detail panel -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div v-if="detailCommentId" class="detail-overlay" @click.self="closeDetail">
          <div class="detail-panel">
            <div class="detail-header">
              <h3>Comment details</h3>
              <button type="button" class="btn-close" aria-label="Close" @click="closeDetail">×</button>
            </div>
            <div v-if="detailComment" class="detail-body">
              <section class="detail-section">
                <h4>Content</h4>
                <div class="detail-content">
                  {{ detailComment.content }}
                </div>
              </section>

              <section class="detail-section">
                <h4>Source Information</h4>
                <div class="detail-meta">
                  <div class="meta-item">
                    <span class="meta-label">Author:</span>
                    <span class="meta-value">{{ detailComment.author || 'Anonymous' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Source:</span>
                    <span class="meta-value">{{ detailComment.sourceType === 'reddit' ? 'Reddit' : 'Hacker News' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Posted:</span>
                    <span class="meta-value">{{ formatDate(detailComment.createdAt) }}</span>
                  </div>
                  <div v-if="detailComment.contextTitle" class="meta-item">
                    <span class="meta-label">From:</span>
                    <span class="meta-value">{{ detailComment.contextTitle }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Comment ID:</span>
                    <span class="meta-value">{{ detailComment.id }}</span>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h4>Actions</h4>
                <a
                  :href="detailComment.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="view-source-link"
                >
                  View on {{ detailComment.sourceType === 'reddit' ? 'Reddit' : 'Hacker News' }}
                  <svg viewBox="0 0 24 24" class="external-link-icon">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15,3 21,3 21,9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </section>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  if (viewModel.selectedSource === 'reddit') {
    return viewModel.redditUrls.length === 0 || viewModel.redditUrls.some(url => !url.trim());
  }
  if (viewModel.selectedSource === 'hackernews') {
    return viewModel.hnUrls.length === 0 || viewModel.hnUrls.some(url => !url.trim());
  }
  return false;
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

const filteredComments = computed(() => {
  return viewModel.comments;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredComments.value.length / pageSize)));

const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredComments.value.slice(start, start + pageSize);
});

const detailComment = computed(() =>
  detailCommentId.value ? viewModel.comments.find((c) => c.id === detailCommentId.value) ?? null : null
);

// Watchers
watch(totalPages, (n) => { if (currentPage.value > n) currentPage.value = Math.max(1, n); });

// Methods
const handleSourceChange = () => {
  // Clear any previous errors when switching sources
  viewModel.error = null;
  // Notify presenter about source change
  presenter.setSelectedSource(viewModel.selectedSource);
};

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

const openDetail = (id: string) => {
  detailCommentId.value = id;
};

const closeDetail = () => {
  detailCommentId.value = null;
};

// Reactive data
const newUrl = ref('');
const newUrlInput = ref<HTMLInputElement>();
const newHnUrl = ref('');
const newHnUrlInput = ref<HTMLInputElement>();
const detailCommentId = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = 20;

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

/* Source selector */
.source-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.source-selector-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.source-options {
  display: flex;
  gap: 1rem;
}

.source-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.source-option:hover {
  background: var(--color-bg-hover);
}

.source-option input[type="radio"] {
  margin: 0;
}

.source-option-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
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

/* Comments list */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.comment-item {
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.comment-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.comment-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: rgba(13, 148, 136, 0.2);
}

.comment-item:hover::before {
  opacity: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.source-badge.reddit {
  background: linear-gradient(135deg, #FF4500, #FF6B35);
}

.source-badge.hackernews {
  background: linear-gradient(135deg, #ff6600, #ff8533);
}

.source-badge::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.comment-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  background: var(--color-bg-subtle);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  white-space: nowrap;
}

.comment-content {
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.read-more {
  color: var(--color-accent);
  font-weight: 500;
}

.comment-actions {
  margin-bottom: 0.75rem;
}

.view-source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
  background: var(--color-accent-bg);
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-accent-light);
  transition: all 0.2s ease;
}

.view-source-link:hover {
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.15);
}

.external-link-icon {
  width: 0.875rem;
  height: 0.875rem;
  stroke: currentColor;
  stroke-width: 2;
}

.comment-context {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg-subtle);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--color-accent-light);
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

/* Comment list animations */
.comment-list-enter-active,
.comment-list-leave-active {
  transition: all 0.5s ease;
}

.comment-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.comment-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.comment-list-move {
  transition: transform 0.5s ease;
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


/* Comments Table Header */
.comments-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--resp-shadow);
}

.comments-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

/* Comments Table */
.comments-table-section {
  margin-top: 1.5rem;
}

.table-wrap {
  overflow-x: auto;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--resp-radius);
  box-shadow: var(--resp-shadow);
  margin-bottom: 1rem;
}

.comments-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.comments-table th,
.comments-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  vertical-align: top;
}

.comments-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.comments-table th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle, #f8fafc);
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}

.comments-table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.12s ease;
  cursor: pointer;
}

.comments-table tbody tr:last-child {
  border-bottom: none;
}

.comments-table tbody tr:hover {
  background: var(--color-bg-subtle, #f8fafc);
}

.comments-table td {
  max-width: 300px;
}

.col-author {
  width: 200px;
  font-variant-numeric: tabular-nums;
}

.col-content {
  min-width: 300px;
}

.col-date {
  width: 140px;
  white-space: nowrap;
}

.col-source {
  width: 100px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.source-badge.reddit {
  background: linear-gradient(135deg, #FF4500, #FF6B35);
}

.source-badge.hackernews {
  background: linear-gradient(135deg, #ff6600, #ff8533);
}

.source-badge::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.cell-text {
  display: block;
  max-height: 3.2em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  color: var(--color-text);
}

.read-more {
  color: var(--color-accent);
  font-weight: 500;
}

.source-label {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.source-label.reddit {
  background: var(--color-accent-bg);
  color: var(--color-accent-dark);
  border: 1px solid var(--color-accent-light);
}

.source-label.hackernews {
  background: linear-gradient(135deg, #ff6600, #ff8533);
  color: white;
}

tr.row-selected {
  background: rgba(13, 148, 136, 0.06);
}

tr.row-selected:hover {
  background: rgba(13, 148, 136, 0.1);
}

/* Pagination */
.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.pagination-info {
  font-variant-numeric: tabular-nums;
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
}

.pagination-controls .btn {
  min-width: 5rem;
}

/* Detail Panel */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: overlay-in 0.2s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-panel {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-radius: var(--resp-radius) 0 0 var(--resp-radius);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
  flex-shrink: 0;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.btn-close {
  background: var(--color-bg-subtle, #f1f5f9);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-close:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}

.detail-body {
  padding: 1.25rem 1.5rem;
  flex: 1;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}

.detail-content {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: 8px;
  white-space: pre-wrap;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  word-break: break-word;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.meta-label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  min-width: 80px;
  flex-shrink: 0;
}

.meta-value {
  font-size: 0.8125rem;
  color: var(--color-text);
  word-break: break-word;
}

.view-source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
  background: var(--color-accent-bg);
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-accent-light);
  transition: all 0.2s ease;
}

.view-source-link:hover {
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.15);
}

.external-link-icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 2;
}

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

  .comments-table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .table-wrap {
    border-radius: 0;
  }

  .detail-panel {
    max-width: 100%;
    border-radius: 0;
  }
}

@media (max-width: 640px) {
  .source-options {
    flex-direction: column;
    gap: 0.5rem;
  }

  .count-number {
    font-size: 1.5rem;
  }

  .comments-table th,
  .comments-table td {
    padding: 0.5rem;
  }

  .col-author {
    width: 150px;
  }

  .col-content {
    min-width: 200px;
  }

  .col-date {
    width: 120px;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .detail-header {
    padding: 1rem;
  }

  .detail-body {
    padding: 1rem;
  }
}
</style>