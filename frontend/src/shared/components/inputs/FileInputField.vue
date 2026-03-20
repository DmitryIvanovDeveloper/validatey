<template>
  <div
    class="file-input-field"
    :class="{ 'is-drag-over': isDragOver, 'is-disabled': disabled }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      :id="id"
      ref="inputRef"
      type="file"
      :accept="accept"
      class="native-file-input"
      hidden
      aria-hidden="true"
      tabindex="-1"
      :disabled="disabled"
      @change="onChange"
    />
    <Button
      type="button"
      variant="secondary"
      size="sm"
      :disabled="disabled"
      @click="inputRef?.click()"
    >
      {{ buttonLabel }}
    </Button>
    <span v-if="showFileName" class="file-name" :title="selectedFileName">{{ selectedFileName }}</span>
    <span v-if="isDragOver" class="drop-hint">Drop file</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/shared/components/atoms/Button.vue';

interface Props {
  id?: string;
  accept?: string;
  disabled?: boolean;
  buttonLabel?: string;
  emptyLabel?: string;
  showFileName?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: 'file-input-field',
  accept: '*/*',
  disabled: false,
  buttonLabel: 'Choose file',
  emptyLabel: 'No file selected',
  showFileName: true,
});

const emit = defineEmits<{
  select: [file: File | null];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref(props.emptyLabel);
const isDragOver = ref(false);

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  selectedFileName.value = file?.name || props.emptyLabel;
  emit('select', file);
}

function onDragEnter(): void {
  if (props.disabled) return;
  isDragOver.value = true;
}

function onDragOver(): void {
  if (props.disabled) return;
  isDragOver.value = true;
}

function onDragLeave(event: DragEvent): void {
  if (props.disabled) return;
  const current = event.currentTarget as HTMLElement | null;
  const related = event.relatedTarget as Node | null;
  if (current && related && current.contains(related)) return;
  isDragOver.value = false;
}

function onDrop(event: DragEvent): void {
  if (props.disabled) return;
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0] ?? null;
  selectedFileName.value = file?.name || props.emptyLabel;
  if (inputRef.value) {
    try {
      inputRef.value.files = event.dataTransfer?.files ?? null;
    } catch {
      // Some browsers block assigning FileList; emit is enough.
    }
  }
  emit('select', file);
}

function clear(): void {
  if (inputRef.value) inputRef.value.value = '';
  selectedFileName.value = props.emptyLabel;
}

defineExpose({ clear });
</script>

<style scoped>
.file-input-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  border: 1px dashed var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  padding: 0.45rem 0.55rem;
  background: transparent;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.file-input-field.is-drag-over {
  border-color: var(--color-accent, #0d9488);
  background: rgba(13, 148, 136, 0.06);
}

.file-input-field.is-disabled {
  opacity: 0.7;
}

.native-file-input {
  display: none !important;
}

.file-name {
  min-width: 0;
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drop-hint {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent, #0d9488);
  white-space: nowrap;
}

:deep(.btn.btn-secondary) {
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.btn.btn-secondary:hover:not(.btn-disabled)) {
  background: transparent;
}
</style>
