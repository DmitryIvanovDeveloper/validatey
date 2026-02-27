<template>
  <div class="workspace-card" @click="handleSelect">
    <div class="workspace-card__header">
      <div
        class="workspace-card__icon-wrap"
        :class="{ 'workspace-card__icon-wrap--placeholder': !workspace.iconUrl }"
      >
        <img
          v-if="workspace.iconUrl"
          :src="workspace.iconUrl"
          :alt="workspace.name"
          class="workspace-card__icon-img"
        />
        <span v-else class="workspace-card__icon-placeholder">{{ workspaceInitial }}</span>
      </div>
      <h3 class="workspace-card__title">{{ workspace.name }}</h3>
      <div class="workspace-card__menu" @click.stop>
        <button
          type="button"
          class="workspace-card__menu-trigger"
          :aria-label="`Menu for ${workspace.name}`"
          @click="toggleMenu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
        <div v-if="menuOpen" class="workspace-card__menu-dropdown" @click.stop>
          <div v-if="$slots.actions" class="workspace-card__menu-actions" @click.stop>
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>

    <div class="workspace-card__content">
      <div class="workspace-card__meta">
        <span class="workspace-card__date">
          {{ cardLabels.cardCreated }} {{ formatDate(workspace.createdAt) }}
        </span>
      </div>
    </div>

    <div class="workspace-card__footer">
      <div class="workspace-card__footer-actions">
        <slot name="footer-actions" />
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        class="workspace-card__select-btn"
        @click.stop="handleSelect"
      >
        {{ cardLabels.cardOpenWorkspace }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="workspace-card__arrow">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from '@/shared/components/atoms/Button.vue';
import type { Workspace } from '../../view-models/workspace-list.view-model';

const DEFAULT_CARD_LABELS = {
  cardCreated: 'Created',
  cardOpenWorkspace: 'Open workspace'
} as const;

interface Props {
  workspace: Workspace;
  isUpdating?: boolean;
  isDeleting?: boolean;
  labels?: Partial<Record<keyof typeof DEFAULT_CARD_LABELS, string>>;
}

interface Emits {
  (e: 'select', workspaceId: string): void;
  (e: 'edit', workspace: Workspace): void;
  (e: 'delete', workspace: Workspace): void;
  (e: 'icon-file-selected', workspace: Workspace, file: File): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cardLabels = computed(() => ({ ...DEFAULT_CARD_LABELS, ...(props.labels ?? {}) }));

const menuOpen = ref(false);
const iconFileInput = ref<HTMLInputElement | null>(null);

const workspaceInitial = computed(() =>
  props.workspace.name?.charAt(0)?.toUpperCase() || '?'
);

function triggerIconUpload() {
  closeMenu();
  iconFileInput.value?.click();
}

function onIconFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit('icon-file-selected', props.workspace, file);
    input.value = '';
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleClickOutside(event: Event) {
  if (!(event.target as Element).closest('.workspace-card__menu')) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleSelect = () => {
  emit('select', props.workspace.id);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};
</script>

<style scoped>
.workspace-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.workspace-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.workspace-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.workspace-card__icon-wrap {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.workspace-card__icon-wrap:hover {
  opacity: 0.9;
}

.workspace-card__icon-wrap--placeholder {
  background: #e9ecef;
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.workspace-card__icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-card__icon-placeholder {
  line-height: 1;
}

.workspace-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.workspace-card__menu {
  position: relative;
}

.workspace-card__menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.workspace-card__menu-trigger:hover {
  background: #f1f3f5;
  color: #333;
}

.workspace-card__menu-trigger svg {
  width: 14px;
  height: 14px;
}

.workspace-card__menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 140px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.08);
  padding: 0.25rem 0;
  margin-top: 4px;
}

.workspace-card__menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.workspace-card__menu-actions :deep(.workspace-card-menu-btn),
.workspace-card__menu-actions :deep(.btn) {
  width: 100%;
  justify-content: flex-start;
  padding: 0.35rem 0.75rem;
  border: none;
  background: transparent;
  color: #333;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: auto;
}

.workspace-card__menu-actions :deep(.workspace-card-menu-btn svg),
.workspace-card__menu-actions :deep(.btn svg) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.workspace-card__menu-actions :deep(.workspace-card-menu-btn:hover),
.workspace-card__menu-actions :deep(.btn:not(.btn-danger):hover) {
  background: #f1f3f5;
}

.workspace-card__menu-actions :deep(.btn-danger) {
  color: #dc3545;
}

.workspace-card__menu-actions :deep(.btn-danger:hover) {
  background: #fff5f5;
  color: #c82333;
}

.workspace-card__content {
  margin-bottom: 1.5rem;
}

.workspace-card__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.workspace-card__date {
  font-size: 0.875rem;
  color: #666;
}

.workspace-card__footer {
  border-top: 1px solid #e1e5e9;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.workspace-card__footer-actions {
  display: flex;
  gap: 0.5rem;
}

.workspace-card__footer-actions :deep(.workspace-create-project-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0d9488;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;
  flex: 1;
  cursor: pointer;
}

.workspace-card__footer-actions :deep(.workspace-create-project-btn:hover) {
  background: #ccfbf1;
  border-color: #5eead4;
  color: #0f766e;
}

.workspace-card__footer-actions :deep(.workspace-create-project-btn svg) {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.workspace-card__select-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.workspace-card__arrow {
  width: 16px;
  height: 16px;
}
</style>