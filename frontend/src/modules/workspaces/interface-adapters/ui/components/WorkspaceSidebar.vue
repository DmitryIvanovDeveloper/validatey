<template>
  <div class="workspace-sidebar">
    <h2 class="workspace-sidebar__title">{{ presenter.labels.sidebarTitle }}</h2>
    <button
      type="button"
      class="workspace-sidebar__btn-new"
      @click="goToCreateWorkspace"
    >
      <span class="workspace-sidebar__btn-new-icon" aria-hidden="true">+</span>
      {{ presenter.labels.sidebarNewWorkspace }}
    </button>
    <router-link
      to="/workspaces"
      class="workspace-sidebar__link workspace-sidebar__link--all"
      :class="{ 'workspace-sidebar__link--active': route.name === 'workspaces' }"
    >
      {{ presenter.labels.sidebarAllWorkspaces }}
    </router-link>
    <div v-if="presenter?.viewModel?.loading" class="workspace-sidebar__loading">
      <span class="workspace-sidebar__loading-dot"></span>
      <span class="workspace-sidebar__loading-dot"></span>
      <span class="workspace-sidebar__loading-dot"></span>
    </div>
    <nav v-else class="workspace-sidebar__nav" aria-label="Workspace list">
      <div
        v-for="ws in presenter?.viewModel?.workspaces ?? []"
        :key="ws.id"
        class="workspace-sidebar__item"
      >
        <router-link
          :to="`/workspaces/${ws.id}/projects`"
          class="workspace-sidebar__link"
          :class="{ 'workspace-sidebar__link--active': isWorkspaceActive(ws.id) }"
        >
          <span v-if="ws.iconUrl" class="workspace-sidebar__link-icon">
            <img :src="ws.iconUrl" :alt="ws.name" />
          </span>
          <span v-else class="workspace-sidebar__link-letter">{{ workspaceInitial(ws.name) }}</span>
          <span class="workspace-sidebar__link-name">{{ ws.name }}</span>
        </router-link>
        <div class="workspace-sidebar__item-menu" @click.stop>
          <button
            type="button"
            class="workspace-sidebar__menu-trigger"
            :aria-label="presenter.labels.sidebarManageAria(ws.name)"
            :aria-expanded="sidebarOpenId === ws.id"
            @click="toggleSidebarMenu(ws.id)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="6" cy="12" r="1.5"/>
              <circle cx="18" cy="12" r="1.5"/>
            </svg>
          </button>
          <div v-if="sidebarOpenId === ws.id" class="workspace-sidebar__dropdown">
            <button type="button" class="workspace-sidebar__dropdown-item" @click="goToEditWorkspace(ws.id)">
              Edit
            </button>
            <button type="button" class="workspace-sidebar__dropdown-item workspace-sidebar__dropdown-item--danger" @click="goToDeleteWorkspace(ws.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import type { WorkspaceListPresenter } from '../../presenters/workspace-list.presenter';
import type { AuthSession } from '@/modules/auth/application/ports/auth-service.port';
import { sessionManager } from '@/shared/services/session-manager';

const route = useRoute();
const router = useRouter();
const presenter = container.get<WorkspaceListPresenter>(TYPES.WorkspaceListPresenter);

const session = ref<AuthSession | null>(null);

const sidebarOpenId = ref<string | null>(null);

function isWorkspaceActive(workspaceId: string): boolean {
  return route.params.workspaceId === workspaceId;
}

function workspaceInitial(name: string): string {
  const char = (name?.trim().charAt(0) ?? '?').toUpperCase();
  return char || '?';
}

function toggleSidebarMenu(workspaceId: string): void {
  sidebarOpenId.value = sidebarOpenId.value === workspaceId ? null : workspaceId;
}

function closeSidebarMenu(): void {
  sidebarOpenId.value = null;
}

function goToCreateWorkspace(): void {
  closeSidebarMenu();
  router.push({ path: '/workspaces', query: { new: '1' } });
}

function goToEditWorkspace(workspaceId: string): void {
  closeSidebarMenu();
  router.push({ path: '/workspaces', query: { edit: workspaceId } });
}

function goToDeleteWorkspace(workspaceId: string): void {
  closeSidebarMenu();
  router.push({ path: '/workspaces', query: { delete: workspaceId } });
}

function handleClickOutside(event: Event): void {
  if (!(event.target as Element).closest('.workspace-sidebar__item-menu')) {
    closeSidebarMenu();
  }
}

function loadWorkspaces(): void {
  presenter.loadWorkspaces();
}

watch(session, (newSession) => {
  if (newSession?.user) {
    loadWorkspaces();
  }
}, { immediate: true });

let unsubscribeSession: (() => void) | null = null;

onMounted(() => {
  session.value = sessionManager.currentSession;
  unsubscribeSession = sessionManager.subscribe((newSession) => {
    session.value = newSession;
  });
  if (sessionManager.isSessionReady && sessionManager.currentUserId) {
    loadWorkspaces();
  }
  window.addEventListener('validatey-session-ready', loadWorkspaces);
  window.addEventListener('validatey-user-id-synced', loadWorkspaces);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  unsubscribeSession?.();
  window.removeEventListener('validatey-session-ready', loadWorkspaces);
  window.removeEventListener('validatey-user-id-synced', loadWorkspaces);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.workspace-sidebar {
  padding: 1rem 0.75rem;
  position: sticky;
  top: 0;
}

.workspace-sidebar__title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
  margin: 0 0 0.75rem;
  padding: 0 0.5rem;
}

.workspace-sidebar__btn-new {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px dashed var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent, #0d9488);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.workspace-sidebar__btn-new:hover {
  background: var(--color-bg-subtle, #f1f5f9);
  border-color: var(--color-accent, #0d9488);
  color: var(--color-accent-hover, #0f766e);
}

.workspace-sidebar__btn-new-icon {
  font-size: 1rem;
  line-height: 1;
}

.workspace-sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-text, #334155);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  margin-bottom: 0.125rem;
}

.workspace-sidebar__link:hover {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-accent, #0d9488);
}

.workspace-sidebar__link--active {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-accent, #0d9488);
  font-weight: 500;
}

.workspace-sidebar__link--all {
  margin-bottom: 0.5rem;
}

.workspace-sidebar__link-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.workspace-sidebar__link-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-sidebar__link-letter {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  background: var(--color-bg-subtle, #e2e8f0);
  color: var(--color-text-muted, #64748b);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workspace-sidebar__link-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-sidebar__item {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0.125rem;
}

.workspace-sidebar__item .workspace-sidebar__link {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}

.workspace-sidebar__item-menu {
  position: relative;
  flex-shrink: 0;
}

.workspace-sidebar__menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.workspace-sidebar__menu-trigger:hover {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-text, #334155);
}

.workspace-sidebar__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  min-width: 8rem;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: white;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.workspace-sidebar__dropdown-item {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  text-align: left;
  background: transparent;
  color: var(--color-text, #334155);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.workspace-sidebar__dropdown-item:hover {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-accent, #0d9488);
}

.workspace-sidebar__dropdown-item--danger:hover {
  background: var(--color-danger-bg, #fef2f2);
  color: var(--color-danger, #dc2626);
}

.workspace-sidebar__loading {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
}

.workspace-sidebar__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent, #0d9488);
  opacity: 0.6;
  animation: workspace-sidebar-dot 1.2s ease-in-out infinite both;
}

.workspace-sidebar__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.workspace-sidebar__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes workspace-sidebar-dot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}
</style>
