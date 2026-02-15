<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    :closable="closable"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="confirm-message" v-html="message"></div>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false); $emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        :class="['btn', variant === 'danger' ? 'btn-danger' : 'btn-primary']"
        @click="$emit('update:modelValue', false); $emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue';

withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    closable?: boolean;
  }>(),
  {
    title: 'Confirm',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    closable: true,
  }
);

defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped>
.confirm-message {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text, #334155);
}

.confirm-message :deep(.warning-icon) {
  color: #f59e0b;
  margin-right: 0.25rem;
  flex-shrink: 0;
}

.confirm-message :deep(.danger-icon) {
  color: #ef4444;
  margin-right: 0.25rem;
  flex-shrink: 0;
}

.confirm-message :deep(.url-text) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  word-break: break-word;
  margin: 0.5rem 0;
  display: block;
  max-height: 3rem;
  overflow: hidden;
}

.confirm-message :deep(.warning-box) {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.75rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.confirm-message :deep(.warning-box.danger) {
  background: #fef2f2;
  border-color: #ef4444;
}

.confirm-message :deep(.warning-title) {
  font-weight: 600;
  font-size: 0.875rem;
  color: #92400e;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.confirm-message :deep(.warning-text) {
  color: #92400e;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, color 0.15s;
}

.btn-ghost {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-text-muted, #64748b);
}

.btn-ghost:hover {
  background: var(--color-border, #e2e8f0);
  color: var(--color-text, #334155);
}

.btn-primary {
  background: var(--color-accent, #0d9488);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover, #0f766e);
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}
</style>
