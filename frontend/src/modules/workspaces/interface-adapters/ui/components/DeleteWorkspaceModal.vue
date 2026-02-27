<template>
  <Modal
    v-model="isOpen"
    :title="labels.deleteModalTitle"
    :closable="!loading"
  >
    <div class="delete-modal-content">
      <div class="warning-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>

      <div class="warning-message">
        <h3 class="warning-title">{{ labels.deleteModalConfirmTitle }}</h3>
        <p class="warning-description">
          {{ labels.deleteModalConfirmDescription }}
          <strong>{{ workspace?.name }}</strong> {{ labels.deleteModalConfirmSuffix }}
        </p>
      </div>

      <div class="confirmation-section">
        <label for="confirm-input" class="confirm-label">
          {{ labels.deleteModalTypeConfirm }} <strong>confirm</strong> {{ labels.deleteModalTypeConfirmSuffix }}
        </label>
        <input
          id="confirm-input"
          v-model="confirmText"
          type="text"
          class="confirm-input"
          :placeholder="labels.deleteModalConfirmPlaceholder"
          :disabled="loading"
          @input="handleInput"
        />
      </div>
    </div>

    <div class="modal-actions">
      <Button
        type="button"
        variant="secondary"
        :disabled="loading"
        @click="handleCancel"
      >
        {{ labels.cancel }}
      </Button>
      <Button
        type="button"
        variant="danger"
        :loading="loading"
        :disabled="confirmText !== 'confirm'"
        @click="handleDelete"
      >
        {{ loading ? labels.deletingButton : labels.deleteWorkspaceButton }}
      </Button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Modal from '@/shared/components/Modal.vue';
import Button from '@/shared/components/atoms/Button.vue';
import type { Workspace } from '../../view-models/workspace-list.view-model';

const DEFAULT_LABELS = {
  deleteModalTitle: 'Delete workspace',
  deleteModalConfirmTitle: 'Are you sure?',
  deleteModalConfirmDescription: 'This will permanently delete the workspace',
  deleteModalConfirmSuffix: 'and all its projects. This action cannot be undone.',
  deleteModalTypeConfirm: 'Type',
  deleteModalTypeConfirmSuffix: 'to confirm.',
  deleteModalConfirmPlaceholder: 'confirm',
  cancel: 'Cancel',
  deletingButton: 'Deleting…',
  deleteWorkspaceButton: 'Delete workspace'
} as const;

interface Props {
  modelValue: boolean;
  workspace: Workspace | null;
  loading?: boolean;
  labels?: Partial<Record<keyof typeof DEFAULT_LABELS, string>>;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'delete', workspaceId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);
const confirmText = ref('');

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
  if (newValue) {
    confirmText.value = '';
  }
});

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const labels = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }));

const handleInput = () => {
  // Convert to lowercase for easier matching
  confirmText.value = confirmText.value.toLowerCase();
};

const handleDelete = () => {
  if (confirmText.value === 'confirm' && props.workspace) {
    emit('delete', props.workspace.id);
  }
};

const handleCancel = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.delete-modal-content {
  text-align: center;
}

.warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #fee2e2;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.warning-icon svg {
  width: 32px;
  height: 32px;
}

.warning-message {
  margin-bottom: 2rem;
}

.warning-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.warning-description {
  color: #666;
  line-height: 1.5;
}

.confirmation-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.confirm-label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.75rem;
}

.confirm-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  text-align: center;
  font-weight: 500;
  transition: border-color 0.2s ease;
}

.confirm-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.confirm-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}
</style>