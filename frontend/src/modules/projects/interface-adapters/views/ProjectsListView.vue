<template>
  <div class="projects-list-view">
    <PageHeader
      title="Projects"
      subtitle="Manage and validate your product hypotheses"
      :breadcrumbs="[{ label: 'Projects' }]"
    >
      <template #actions>
        <router-link to="/projects/new" class="btn btn-primary">+ New Project</router-link>
      </template>
    </PageHeader>

    <div v-if="viewModel.loading.value" class="loading-state">
      <LoadingSpinner />
      <p>Loading projects...</p>
    </div>
    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>
    <div v-else-if="viewModel.projects.value.length === 0" class="empty-state">
      <EmptyState
        title="No projects yet"
        description="Create your first project to validate a hypothesis and collect feedback."
      >
        <template #action>
          <router-link to="/projects/new" class="btn btn-primary btn-large">Create project</router-link>
        </template>
      </EmptyState>
    </div>
    <div v-else class="projects-grid">
      <Card
        v-for="project in viewModel.projects.value"
        :key="project.id"
        hover
        clickable
        @click="goToProject(project.id)"
      >
        <template #header>
          <div class="project-card-header">
            <h3 class="project-name">{{ project.name }}</h3>
            <span :class="['status-badge', `status-${project.status}`]">{{ getStatusLabel(project.status) }}</span>
          </div>
        </template>
        <div class="project-meta">
          <span class="meta-item">{{ formatDate(project.createdAt) }}</span>
        </div>
        <template #footer>
          <div class="project-card-footer">
            <router-link :to="`/projects/${project.id}`" class="btn-link">Details →</router-link>
            <button
              type="button"
              class="btn-delete"
              :disabled="viewModel.deletingId.value === project.id"
              :aria-label="`Delete ${project.name}`"
              @click.stop="openDeleteModal(project)"
            >
              Delete
            </button>
          </div>
        </template>
      </Card>
    </div>

    <Modal
      v-model="deleteModalOpen"
      title="Delete project"
      :closable="!viewModel.deletingId.value"
      @close="projectToDelete = null"
    >
      <div v-if="projectToDelete" class="delete-modal-content">
        <div class="delete-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <p class="delete-modal-text">
          Are you sure you want to delete
          <strong class="delete-modal-project-name">«{{ projectToDelete.name }}»</strong>?
        </p>
        <p class="delete-modal-warning">This action cannot be undone.</p>
      </div>
      <template #footer>
        <button
          type="button"
          class="delete-modal-btn delete-modal-btn-cancel"
          :disabled="!!viewModel.deletingId.value"
          @click="closeDeleteModal"
        >
          Cancel
        </button>
        <button
          type="button"
          class="delete-modal-btn delete-modal-btn-confirm"
          :disabled="!!viewModel.deletingId.value"
          @click="confirmDelete"
        >
          {{ viewModel.deletingId.value ? 'Deleting…' : 'Delete project' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import Card from '@/shared/components/Card.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import Modal from '@/shared/components/Modal.vue';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { Project } from '../../domain/entities/project.entity';
import { ProjectStatus } from '../../domain/entities/project.entity';

const router = useRouter();
const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

const projectToDelete = ref<Project | null>(null);
const deleteModalOpen = computed({
  get: () => projectToDelete.value !== null,
  set: (v) => { if (!v) projectToDelete.value = null; }
});

function openDeleteModal(project: Project) {
  projectToDelete.value = project;
}

function closeDeleteModal() {
  projectToDelete.value = null;
}

async function confirmDelete() {
  if (!projectToDelete.value) return;
  const id = projectToDelete.value.id;
  await presenter.deleteProject(viewModel, id);
  projectToDelete.value = null;
}

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    'in-progress': 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

function refetchProjects() {
  presenter.loadProjects(viewModel);
}

onMounted(() => {
  refetchProjects();
  window.addEventListener('validatey-user-id-synced', refetchProjects);
});

onUnmounted(() => {
  window.removeEventListener('validatey-user-id-synced', refetchProjects);
});
</script>

<style scoped>
.projects-list-view {
  padding: 0;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.project-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-draft { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.status-active,
.status-in-progress { background: var(--color-success-bg); color: var(--color-success); }
.status-completed { background: var(--color-info-bg); color: var(--color-info); }
.status-archived { background: var(--color-bg-subtle); color: var(--color-text-subtle); }

.project-meta {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.project-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.btn-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-link:hover { color: var(--color-accent-hover); text-decoration: underline; }

.btn-delete {
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error-bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-delete:hover:not(:disabled) {
  background: var(--color-error-bg);
}

.btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: background 0.15s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover { background: var(--color-accent-hover); box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3); }

.btn-large { padding: 1rem 2rem; font-size: 1.0625rem; }

.empty-state {
  padding: 2rem;
}

/* Delete confirmation modal content */
.delete-modal-content {
  text-align: center;
  padding: 0.5rem 0;
}

.delete-modal-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1.25rem;
  color: #dc2626;
  opacity: 0.9;
}

.delete-modal-icon svg {
  width: 100%;
  height: 100%;
}

.delete-modal-text {
  margin: 0 0 0.5rem;
  font-size: 1.0625rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.delete-modal-project-name {
  color: var(--color-text);
  font-weight: 600;
}

.delete-modal-warning {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

.delete-modal-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.delete-modal-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.delete-modal-btn-cancel {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.delete-modal-btn-cancel:hover:not(:disabled) {
  background: var(--color-border);
}

.delete-modal-btn-confirm {
  background: var(--color-error);
  color: white;
  border: none;
}

.delete-modal-btn-confirm:hover:not(:disabled) {
  background: #b91c1c;
}
</style>

