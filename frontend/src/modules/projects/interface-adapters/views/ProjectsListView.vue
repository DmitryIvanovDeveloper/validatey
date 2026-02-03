<template>
  <div class="projects-list-view">
    <h1>Projects</h1>
    <div v-if="viewModel.loading.value">Loading...</div>
    <div v-else-if="viewModel.error.value" class="error">{{ viewModel.error.value }}</div>
    <div v-else-if="viewModel.projects.value.length === 0" class="empty-state">
      <p class="empty-state-text">No projects yet.</p>
      <p class="empty-state-hint">Create your first project to validate a hypothesis.</p>
      <router-link to="/projects/new" class="empty-state-cta">Create project</router-link>
    </div>
    <div v-else>
      <div v-for="project in viewModel.projects.value" :key="project.id" class="project-item">
        <router-link :to="`/projects/${project.id}`" class="project-link">{{ project.name }}</router-link>
        <button
          type="button"
          class="delete-btn"
          :disabled="viewModel.deletingId.value === project.id"
          :aria-label="`Delete ${project.name}`"
          @click="openDeleteModal(project)"
        >
          {{ viewModel.deletingId.value === project.id ? '…' : 'Delete' }}
        </button>
      </div>
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
import Modal from '../../../../shared/components/Modal.vue';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { Project } from '../../domain/entities/project.entity';

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
  padding: 2rem;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0.5rem 0;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.project-link {
  flex: 1;
}

.delete-btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
  background: transparent;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  cursor: pointer;
}

.delete-btn:hover:not(:disabled) {
  background: #fef2f2;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: red;
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px dashed #e2e8f0;
}

.empty-state-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: #334155;
  margin: 0 0 0.5rem;
}

.empty-state-hint {
  color: #64748b;
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
}

.empty-state-cta {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: #4299e1;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.empty-state-cta:hover {
  background: #3182ce;
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
  color: #374151;
  line-height: 1.5;
}

.delete-modal-project-name {
  color: #111827;
  font-weight: 600;
}

.delete-modal-warning {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.delete-modal-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.delete-modal-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.delete-modal-btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.delete-modal-btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.delete-modal-btn-confirm {
  background: #dc2626;
  color: white;
  border: none;
}

.delete-modal-btn-confirm:hover:not(:disabled) {
  background: #b91c1c;
}
</style>

