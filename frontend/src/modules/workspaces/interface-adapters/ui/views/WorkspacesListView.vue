<template>
  <div class="workspaces-list-view">
    <div v-if="!presenter" style="background: red; color: white; padding: 10px; margin: 10px;">
      ERROR: Presenter not initialized!
    </div>

    <PageHeader
      :title="presenter?.labels?.pageTitle ?? 'Workspaces'"
      :subtitle="presenter?.labels?.pageSubtitle ?? ''"
      :breadcrumbs="[{ label: presenter?.labels?.breadcrumbWorkspaces ?? 'Workspaces' }]"
    >
      <template #actions>
        <Button
          type="button"
          variant="primary"
          @click="openCreateModal"
        >
          {{ presenter?.labels?.newWorkspace ?? '+ New Workspace' }}
        </Button>
      </template>
    </PageHeader>

    <div v-if="presenter?.viewModel?.loading" class="loading-state">
      <LoadingSpots :message="presenter?.labels?.loadingWorkspaces ?? 'Loading workspaces…'" size="lg" />
    </div>

    <ErrorDisplay
      v-else-if="presenter?.viewModel?.error"
      :error="presenter?.viewModel?.error || ''"
      @close="presenter?.clearError()"
    />
    <div v-else-if="!presenter?.viewModel?.loading && presenter?.viewModel?.workspaces?.length === 0" class="empty-state">
      <div class="onboarding-block">
        <h2 class="onboarding-title">{{ presenter?.labels?.emptyTitle ?? 'Create your first workspace' }}</h2>
        <p class="onboarding-description">{{ presenter?.labels?.emptyDescription ?? 'Workspaces help you organize your projects. Create your first workspace to get started.' }}</p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          @click="openCreateModal"
        >
          {{ presenter?.labels?.createWorkspace ?? 'Create workspace' }}
        </Button>
      </div>
    </div>

    <div v-else-if="presenter?.viewModel?.workspaces" class="workspaces-grid">
      <WorkspaceCard
        v-for="workspace in presenter.viewModel.workspaces"
        :key="workspace.id"
        :workspace="workspace"
        :labels="presenter.labels"
        :is-updating="presenter.viewModel.updatingWorkspaceId === workspace.id"
        :is-deleting="presenter.viewModel.deletingWorkspaceId === workspace.id"
        @select="goToWorkspace(workspace.id)"
        @icon-file-selected="handleIconFileSelected"
      >
        <template #footer-actions>
          <router-link
            :to="`/workspaces/${workspace.id}/projects/new`"
            class="workspace-create-project-btn"
            @click.stop
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ presenter.labels.createProject }}
          </router-link>
        </template>
        <template #actions>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="workspace-card-menu-btn"
            :aria-label="presenter.labels.editAria(workspace.name)"
            @click.stop="openEditModal(workspace)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {{ presenter.labels.edit }}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            :loading="presenter.viewModel.deletingWorkspaceId === workspace.id"
            :show-spinner="true"
            :aria-label="presenter.labels.deleteAria(workspace.name)"
            @click.stop="openDeleteModal(workspace)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            {{ presenter.viewModel.deletingWorkspaceId === workspace.id ? presenter.labels.deleting : presenter.labels.delete }}
          </Button>
        </template>
      </WorkspaceCard>
    </div>

    <CreateWorkspaceModal
      v-model="createModalOpen"
      :loading="presenter?.viewModel?.creatingWorkspace || false"
      :labels="presenter?.labels"
      @create="handleCreateWorkspace"
    />

    <EditWorkspaceModal
      v-model="editModalOpen"
      :workspace="selectedWorkspace"
      :loading="presenter?.viewModel?.updatingWorkspaceId !== null"
      :labels="presenter?.labels"
      @update="handleUpdateWorkspace"
      @icon-file-selected="handleIconFileSelected"
    />

    <DeleteWorkspaceModal
      v-model="deleteModalOpen"
      :workspace="selectedWorkspace"
      :loading="presenter?.viewModel?.deletingWorkspaceId !== null"
      :labels="presenter?.labels"
      @delete="handleDeleteWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { container } from '@/infrastructure/bootstrap/container';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import { sessionManager } from '@/shared/services/session-manager';
import { WorkspaceListPresenter } from '../../presenters/workspace-list.presenter';
import type { Workspace } from '../../view-models/workspace-list.view-model';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import PageHeader from '@/shared/components/PageHeader.vue';
import LoadingSpots from '@/shared/components/LoadingSpots.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import Button from '@/shared/components/atoms/Button.vue';
import WorkspaceCard from '../components/WorkspaceCard.vue';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal.vue';
import EditWorkspaceModal from '../components/EditWorkspaceModal.vue';
import DeleteWorkspaceModal from '../components/DeleteWorkspaceModal.vue';

const route = useRoute();
const router = useRouter();

let presenter: WorkspaceListPresenter | null = null;
try {
  presenter = container.get<WorkspaceListPresenter>(TYPES.WorkspaceListPresenter);
} catch {
  presenter = null;
}

const createModalOpen = ref<boolean>(false);
const editModalOpen = ref<boolean>(false);
const deleteModalOpen = ref<boolean>(false);
const selectedWorkspace = ref<Workspace | null>(null);

function refetchWorkspaces(): void {
  if (presenter) presenter.loadWorkspaces();
}

watch(
  () => route.query,
  async (query) => {
    if (query.new === '1') {
      await router.replace({ path: '/workspaces' });
      await nextTick();
      openCreateModal();
    }
    const editId = query.edit;
    if (editId && typeof editId === 'string') {
      const ws = presenter?.viewModel?.workspaces?.find((w) => w.id === editId);
      if (ws) openEditModal(ws);
      await router.replace({ path: '/workspaces' });
    }
    const deleteId = query.delete;
    if (deleteId && typeof deleteId === 'string') {
      const ws = presenter?.viewModel?.workspaces?.find((w) => w.id === deleteId);
      if (ws) openDeleteModal(ws);
      await router.replace({ path: '/workspaces' });
    }
  },
  { immediate: true }
);

onMounted((): void => {
  if (sessionManager.isSessionReady && sessionManager.currentUserId) refetchWorkspaces();
  window.addEventListener('validatey-session-ready', refetchWorkspaces);
  window.addEventListener('validatey-user-id-synced', refetchWorkspaces);
});

onUnmounted((): void => {
  window.removeEventListener('validatey-session-ready', refetchWorkspaces);
  window.removeEventListener('validatey-user-id-synced', refetchWorkspaces);
});

const openCreateModal = (): void => { createModalOpen.value = true; };
const openEditModal = (workspace: Workspace): void => {
  selectedWorkspace.value = workspace;
  nextTick(() => { editModalOpen.value = true; });
};
const openDeleteModal = (workspace: Workspace): void => {
  selectedWorkspace.value = workspace;
  deleteModalOpen.value = true;
};

const handleIconFileSelected = async (workspace: Workspace, file: File): Promise<void> => {
  if (!presenter) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `workspace-icons/${workspace.id}/${Date.now()}`);
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/storage/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      presenter.viewModel.error = (data?.error as string) ?? presenter.labels.errorUploadIcon;
      return;
    }
    const data = await res.json();
    const url = data?.file?.url ?? data?.url ?? null;
    if (url) await presenter.updateWorkspaceIcon(workspace.id, url);
    else presenter.viewModel.error = presenter.labels.errorInvalidUploadResponse;
  } catch (err) {
    presenter.viewModel.error = err instanceof Error ? err.message : presenter.labels.errorUploadIcon;
  }
};

const handleCreateWorkspace = async (name: string, iconFile?: File): Promise<void> => {
  if (!presenter) return;
  try {
    const workspace = await presenter.createWorkspace(name);
    createModalOpen.value = false;
    if (workspace && iconFile) await handleIconFileSelected(workspace, iconFile);
  } catch (error: unknown) {
    console.error('Failed to create workspace:', error);
  }
};

const handleUpdateWorkspace = async (workspaceId: string, name: string): Promise<void> => {
  if (!presenter) return;
  try {
    await presenter.updateWorkspace(workspaceId, name);
    editModalOpen.value = false;
    selectedWorkspace.value = null;
  } catch (error: unknown) {
    console.error('Failed to update workspace:', error);
  }
};

const handleDeleteWorkspace = async (workspaceId: string): Promise<void> => {
  if (!presenter) return;
  try {
    await presenter.deleteWorkspace(workspaceId);
    deleteModalOpen.value = false;
    selectedWorkspace.value = null;
  } catch (error: unknown) {
    console.error('Failed to delete workspace:', error);
  }
};

const goToWorkspace = (workspaceId: string): void => {
  if (!workspaceId || typeof workspaceId !== 'string' || workspaceId.trim() === '') return;
  router.push(`/workspaces/${workspaceId}/projects`);
};
</script>

<style scoped>
.workspaces-list-view {
  padding: 2rem;
  background: var(--color-bg-page);
}

.loading-state,
.empty-state,
.auth-required-state {
  text-align: center;
  padding: 4rem 2rem;
}

.workspaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.workspaces-grid > * {
  position: relative;
}

.workspaces-grid > *::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 0;
  bottom: -1.5rem;
  margin-left: 0.75rem;
  width: 0;
  border-left: 1px dashed var(--color-border-dashed, var(--color-border));
  pointer-events: none;
}

.workspaces-grid > *::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: -1.5rem;
  margin-top: 0.75rem;
  height: 0;
  border-top: 1px dashed var(--color-border-dashed, var(--color-border));
  pointer-events: none;
}

.onboarding-block {
  max-width: 500px;
  margin: 0 auto;
}

.onboarding-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.onboarding-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
