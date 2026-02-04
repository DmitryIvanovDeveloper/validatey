<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    :closable="closable"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p class="confirm-message">{{ message }}</p>
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
