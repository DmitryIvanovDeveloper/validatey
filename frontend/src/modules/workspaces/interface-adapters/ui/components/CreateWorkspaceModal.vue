<template>
  <Modal
    v-model="isOpen"
    :title="labels.createModalTitle"
    :closable="!loading"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group form-group--icon">
        <label class="form-label">{{ labels.createModalIconLabel }}</label>
        <div
          class="icon-upload"
          :class="{ 'icon-upload--disabled': loading }"
          @click="!loading && triggerIconInput()"
        >
          <input
            ref="iconFileInput"
            type="file"
            accept="image/*"
            class="icon-upload__input"
            @change="onIconFileChange"
          />
          <div
            class="icon-upload__preview"
            :class="{ 'icon-upload__preview--placeholder': !pendingIconUrl }"
          >
            <img
              v-if="pendingIconUrl"
              :src="pendingIconUrl"
              alt="Preview"
              class="icon-upload__img"
            />
            <span v-else class="icon-upload__letter">?</span>
          </div>
          <span class="icon-upload__label">{{ labels.createModalLoadIcon }}</span>
        </div>
      </div>

      <div class="form-group">
        <label for="workspace-name" class="form-label">{{ labels.createModalNameLabel }}</label>
        <input
          id="workspace-name"
          v-model="workspaceName"
          type="text"
          class="form-input"
          :placeholder="labels.createModalNamePlaceholder"
          required
          :disabled="loading"
          maxlength="255"
        />
        <div class="form-help">
          {{ labels.createModalNameHelp }}
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
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="!workspaceName.trim()"
        >
          {{ loading ? labels.creating : labels.createWorkspaceButton }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Modal from '@/shared/components/Modal.vue';
import Button from '@/shared/components/atoms/Button.vue';

const DEFAULT_LABELS = {
  createModalTitle: 'Create New Workspace',
  createModalIconLabel: 'Icon (optional)',
  createModalLoadIcon: 'Load icon',
  createModalNameLabel: 'Workspace Name',
  createModalNamePlaceholder: 'e.g. Product Validation, Marketing Research',
  createModalNameHelp: 'Choose a descriptive name for your workspace. You can change it later.',
  cancel: 'Cancel',
  createWorkspaceButton: 'Create Workspace',
  creating: 'Creating...',
};

interface Props {
  modelValue: boolean;
  loading?: boolean;
  labels?: Partial<typeof DEFAULT_LABELS>;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create', name: string, iconFile?: File): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const labels = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }));

const isOpen = ref(false);
const workspaceName = ref('');
const iconFileInput = ref<HTMLInputElement | null>(null);
const pendingIconUrl = ref<string | null>(null);
const pendingIconFile = ref<File | null>(null);

function triggerIconInput() {
  iconFileInput.value?.click();
}

function onIconFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    pendingIconUrl.value = URL.createObjectURL(file);
    pendingIconFile.value = file;
    input.value = '';
  }
}

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
  if (newValue) {
    workspaceName.value = '';
    pendingIconUrl.value = null;
    pendingIconFile.value = null;
  }
});

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleSubmit = () => {
  const name = workspaceName.value.trim();
  if (name) {
    emit('create', name, pendingIconFile.value ?? undefined);
  }
};

const handleCancel = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-help {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.form-group--icon {
  margin-bottom: 1.5rem;
}

.icon-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-upload__preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-upload__preview--placeholder {
  background: #e9ecef;
  color: #495057;
  font-weight: 600;
  font-size: 1.25rem;
}

.icon-upload__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-upload__letter {
  line-height: 1;
}

.icon-upload__label {
  font-size: 0.875rem;
  color: #495057;
}

.icon-upload__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
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