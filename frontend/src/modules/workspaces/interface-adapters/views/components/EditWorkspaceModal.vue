<template>
  <Modal
    v-model="isOpen"
    title="Edit Workspace"
    :closable="!loading"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group form-group--icon">
        <label class="form-label">Icon</label>
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
            :class="{ 'icon-upload__preview--placeholder': !displayIconUrl }"
          >
            <img
              v-if="displayIconUrl"
              :src="displayIconUrl"
              :alt="workspace?.name"
              class="icon-upload__img"
            />
            <span v-else class="icon-upload__letter">{{ workspaceInitial }}</span>
          </div>
          <span class="icon-upload__label">Load icon</span>
        </div>
      </div>

      <div class="form-group">
        <label for="workspace-name" class="form-label">Workspace Name</label>
        <input
          id="workspace-name"
          v-model="workspaceName"
          type="text"
          class="form-input"
          :placeholder="workspace?.name || 'Workspace name'"
          required
          :disabled="loading"
          maxlength="255"
        />
      </div>

      <div class="modal-actions">
        <Button
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="!workspaceName.trim() || (workspaceName.trim() === workspace?.name && !pendingIconUrl)"
        >
          {{ loading ? 'Updating...' : 'Update Workspace' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from '@/shared/components/Modal.vue';
import Button from '@/shared/components/atoms/Button.vue';
import type { Workspace } from '../../view-models/workspace-list.view-model';

interface Props {
  modelValue: boolean;
  workspace: Workspace | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update', workspaceId: string, name: string): void;
  (e: 'icon-file-selected', workspace: Workspace, file: File): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);
const workspaceName = ref('');
const pendingIconUrl = ref<string | null>(null);
const iconFileInput = ref<HTMLInputElement | null>(null);

const displayIconUrl = computed(() => pendingIconUrl.value ?? props.workspace?.iconUrl ?? null);
const workspaceInitial = computed(() => (props.workspace?.name?.charAt(0) ?? '?').toUpperCase());

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
  if (newValue && props.workspace) {
    workspaceName.value = props.workspace.name;
    pendingIconUrl.value = null;
  }
}, { immediate: true });

watch(() => props.workspace, (newWorkspace) => {
  if (props.modelValue && newWorkspace) {
    workspaceName.value = newWorkspace.name;
    pendingIconUrl.value = null;
  }
}, { immediate: true });

function triggerIconInput() {
  iconFileInput.value?.click();
}

function onIconFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && props.workspace) {
    pendingIconUrl.value = URL.createObjectURL(file);
    emit('icon-file-selected', props.workspace, file);
    input.value = '';
  }
}

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleSubmit = () => {
  const name = workspaceName.value.trim();
  if (!name || !props.workspace) return;
  if (name !== props.workspace.name) {
    emit('update', props.workspace.id, name);
  }
  isOpen.value = false;
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

.icon-upload {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
}

.icon-upload--disabled {
  cursor: not-allowed;
  opacity: 0.6;
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