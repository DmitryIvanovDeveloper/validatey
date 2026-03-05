<template>
  <div class="project-landing-widget">

  

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>{{ presenter.labels.loading }}</span>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-message">{{ error }}</div>
      <button @click="clearError" class="error-dismiss">×</button>
    </div>

    <div v-else-if="!hasLanding" class="no-landing-state">
      <div class="upload-section">
        <div class="upload-info">
          <h4>{{ presenter.labels.uploadButton }}</h4>
          <p>{{ presenter.labels.uploadHint }}</p>
          <ul class="requirements">
            <li>{{ presenter.labels.fileRequirements }}</li>
            <li>{{ presenter.labels.maxSize }}</li>
          </ul>
        </div>

        <div class="upload-controls">
          <input
            ref="fileInput"
            type="file"
            accept=".zip"
            @change="onFileSelected"
            :disabled="uploading"
            class="file-input"
          />
          <div class="upload-hint">
            {{ presenter.labels.uploadHint }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="landing-info">
      <header class="preview-header">
        <div class="landing-details">
          <a :href="landing?.url" target="_blank" class="landing-url">{{ landing?.url }}</a>
          <span class="detail-meta">{{ landing?.fileCount }} files · {{ landing?.getFormattedSize() }} · {{ landing?.getUploadedAtFormatted() }}</span>
        </div>
        <div class="landing-actions">
          <button
            type="button"
            class="action-button icon-button"
            @click="copyLandingUrl"
            :title="copyLinkTitle"
            aria-label="Copy link"
          >
            <svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <button @click="confirmDelete" :disabled="loading" class="action-button danger">{{ presenter.labels.deleteButton }}</button>
        </div>
      </header>

      <div class="landing-preview-section" v-if="previewUrl">
        <h4 class="landing-preview-title">Preview</h4>
        <iframe
          :src="previewUrl"
          class="landing-preview-iframe"
          title="Landing preview"
        />
      </div>

      <div class="embed-section">
        <button type="button" class="embed-toggle" :aria-expanded="showEmbed" @click="showEmbed = !showEmbed">
          Add waitlist to your landing
        </button>
        <div v-show="showEmbed" class="embed-snippet-wrap">
          <p class="embed-hint">Add this to your landing page HTML so visitors can join the project waitlist.</p>
          <pre class="embed-snippet"><code>{{ embedSnippet }}</code></pre>
          <button type="button" class="copy-button" @click="copyEmbedSnippet">Copy</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h4>Confirm Deletion</h4>
        <p>{{ presenter.labels.deleteConfirm }}</p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="cancel-button">Cancel</button>
          <button @click="executeDelete" class="delete-button">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { ProjectLandingPresenter } from '../../presenters/project-landing.presenter';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import { API_CONFIG } from '../../../../../infrastructure/config/api.config';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

let presenter: ProjectLandingPresenter;
try {
  presenter = container.get<ProjectLandingPresenter>(TYPES.ProjectLandingPresenter);
} catch (error) {
  console.error('[ProjectLandingWidget] Failed to get presenter:', error);
  // Fallback: create mock presenter
  presenter = {
    landing: computed(() => null),
    loading: computed(() => false),
    uploading: computed(() => false),
    error: computed(() => 'DI container error'),
    hasLanding: computed(() => false),
    loadLanding: () => Promise.resolve(),
    uploadLanding: () => Promise.resolve(false),
    deleteLanding: () => Promise.resolve(false),
    clearError: () => {},
    labels: {
      title: 'Landing Page',
      description: 'Host your custom landing page on a subdomain',
      uploadButton: 'Upload Landing',
      deleteButton: 'Remove Landing',
      viewButton: 'View Landing',
      uploading: 'Uploading...',
      loading: 'Loading...',
      noLanding: 'No landing page uploaded yet',
      uploadHint: 'Upload a ZIP archive containing your landing page files',
      fileRequirements: 'Must include index.html. Supports HTML, CSS, JS, and images.',
      maxSize: 'Maximum size: 50MB',
      deleteConfirm: 'Are you sure you want to remove the landing page?',
      uploadSuccess: 'Landing page uploaded successfully!',
      deleteSuccess: 'Landing page removed successfully!',
    }
  } as any;
}

const fileInput = ref<HTMLInputElement>();
const showDeleteConfirm = ref(false);
const showEmbed = ref(false);

const apiBaseForEmbed = computed(() => API_CONFIG.BASE_URL.replace(/\/api\/?$/, ''));
const embedSnippet = computed(() => {
  const api = apiBaseForEmbed.value;
  return `<div id="validatey-waitlist"></div>
<script src="${api}/embed/waitlist.js" data-api="${api}" data-target="validatey-waitlist" data-project-id="${props.projectId}"><\\/script>`;
});

async function copyEmbedSnippet() {
  try {
    await navigator.clipboard.writeText(embedSnippet.value);
  } catch (_) {}
}

// Reactive bindings
const landing = computed(() => presenter.landing.value);
/** Preview URL: same host as API so iframe works when backend is on localhost. */
const previewUrl = computed(() => {
  const slug = landing.value?.slug;
  if (!slug) return '';
  const base = apiBaseForEmbed.value;
  return `${base.replace(/\/$/, '')}/l/${encodeURIComponent(slug)}/`;
});
const loading = computed(() => presenter.loading.value);
const uploading = computed(() => presenter.uploading.value);
const error = computed(() => presenter.error.value);
const hasLanding = computed(() => presenter.hasLanding.value);

const loadLanding = async () => {
  await presenter.loadLanding(props.projectId);
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    const success = await presenter.uploadLanding(props.projectId, file);
    if (success) {
      target.value = ''; // Clear input
    }
  }
};


const copyLinkTitle = ref('Copy link');
async function copyLandingUrl() {
  const url = landing.value?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    copyLinkTitle.value = 'Copied!';
    setTimeout(() => { copyLinkTitle.value = 'Copy link'; }, 1500);
  } catch (_) {}
}

const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

const executeDelete = async () => {
  showDeleteConfirm.value = false;
  await presenter.deleteLanding(props.projectId);
};

const clearError = () => {
  presenter.clearError();
};

onMounted(() => {
  loadLanding();
});

watch(() => props.projectId, () => {
  loadLanding();
});
</script>

<style scoped>
.project-landing-widget {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}

.landing-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.landing-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.landing-description {
  font-size: 14px;
  color: #6b7280;
}

.loading-state, .error-state, .no-landing-state, .landing-info {
  margin-top: 16px;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #2563eb;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
}

.error-dismiss {
  color: #dc2626;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.error-dismiss:hover {
  color: #b91c1c;
}

.upload-section {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 24px;
}

.upload-info h4 {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 8px;
}

.upload-info p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.requirements {
  font-size: 14px;
  color: #6b7280;
}

.requirements li {
  list-style: disc;
  list-style-position: inside;
  margin-bottom: 4px;
}

.upload-controls {
  margin-top: 16px;
}

.upload-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.upload-button.primary {
  background: #2563eb;
  color: white;
}

.upload-button.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.upload-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  color: #9ca3af;
}

.preview-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.landing-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  font-size: 13px;
}

.landing-url {
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.landing-url:hover {
  text-decoration: underline;
  color: #1e40af;
}

.detail-meta {
  color: #6b7280;
  flex-shrink: 0;
}

.landing-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.action-button.icon-button {
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
}

.action-button.icon-button:hover {
  background: #e5e7eb;
}

.action-button.icon-button .icon-copy {
  display: block;
}

.action-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-button.secondary:hover {
  background: #e5e7eb;
}

.action-button.danger {
  background: #dc2626;
  color: white;
}

.action-button.danger:hover:not(:disabled) {
  background: #b91c1c;
}

.action-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  color: #9ca3af;
}

.landing-preview-section {
  margin-top: 16px;
  padding-top: 0;
  border-top: none;
}

.landing-preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px;
}

.landing-preview-iframe {
  width: 100%;
  height: 480px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: block;
}

.embed-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.embed-toggle {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: #2563eb;
  cursor: pointer;
}

.embed-toggle:hover {
  text-decoration: underline;
}

.embed-snippet-wrap {
  margin-top: 12px;
}

.embed-hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.embed-snippet {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0 0 8px 0;
}

.embed-snippet code {
  font-family: ui-monospace, monospace;
}

.copy-button {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}

.copy-button:hover {
  background: #f9fafb;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 28rem;
  width: 100%;
  margin: 0 16px;
}

.modal-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.modal-content p {
  color: #6b7280;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-button {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.delete-button {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

.delete-button:hover {
  background: #b91c1c;
}

.file-input {
  display: block;
  width: 100%;
  padding: 12px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-input:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.file-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>