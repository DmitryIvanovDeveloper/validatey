<template>
  <div class="project-landing-widget">

    <div class="landing-header">
      <h3 class="landing-title">{{ presenter.labels.title }}</h3>
      <p class="landing-description">{{ presenter.labels.description }}</p>
    </div>

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
      <div class="landing-details">
        <div class="detail-row">
          <span class="label">URL:</span>
          <a :href="landing?.url" target="_blank" class="landing-url">{{ landing?.url }}</a>
        </div>
        <div class="detail-row">
          <span class="label">Files:</span>
          <span>{{ landing?.fileCount }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Size:</span>
          <span>{{ landing?.getFormattedSize() }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Uploaded:</span>
          <span>{{ landing?.getUploadedAtFormatted() }}</span>
        </div>
      </div>

      <div class="landing-actions">
        <button
          @click="viewLanding"
          class="action-button secondary"
        >
          {{ presenter.labels.viewButton }}
        </button>
        <button
          @click="confirmDelete"
          :disabled="loading"
          class="action-button danger"
        >
          {{ presenter.labels.deleteButton }}
        </button>
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

// Reactive bindings
const landing = computed(() => presenter.landing.value);
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


const viewLanding = () => {
  if (landing.value?.url) {
    window.open(landing.value.url, '_blank');
  }
};

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
  background: white;
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

.landing-details {
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row .label {
  font-weight: 500;
  color: #374151;
}

.landing-url {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

.landing-url:hover {
  color: #1e40af;
}

.landing-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
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