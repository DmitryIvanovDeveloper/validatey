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
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>Loading projects…</p>
    </div>
    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>
    <div v-else-if="!viewModel.loading.value && viewModel.projects.value.length === 0" class="empty-state">
      <!-- Guided onboarding for first-time users -->
      <div v-if="!onboardingCompleted" class="onboarding-block">
        <h2 class="onboarding-title">Let's validate your first hypothesis</h2>
        <p class="onboarding-description">Describe what you want to test in one sentence. We'll create a project and a shareable survey link.</p>
        <form class="onboarding-form" @submit.prevent="startOnboarding">
          <input
            v-model="onboardingHypothesis"
            type="text"
            class="onboarding-input"
            placeholder="e.g. Young professionals would pay for a gamified learning app"
            required
          />
          <button type="submit" class="btn btn-primary btn-large">Create first project</button>
        </form>
      </div>
      <EmptyState
        v-else
        title="No projects yet"
        description="Create your first project to validate a hypothesis and collect feedback."
      >
        <template #action>
          <router-link to="/projects/new" class="btn btn-primary btn-large">Create project</router-link>
        </template>
      </EmptyState>
    </div>
    <div v-else class="projects-grid">
      <ProjectCard
        v-for="project in viewModel.projects.value"
        :key="project.id"
        :project="project"
        @click="goToProject(project.id)"
      >
        <template #footer>
          <router-link :to="`/projects/${project.id}`" class="project-card__link" @click.stop>
            View project
            <svg class="project-card__link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </router-link>
        </template>
        <template #actions>
          <router-link
            :to="`/projects/${project.id}/edit`"
            class="project-card-edit"
            :aria-label="`Edit ${project.name}`"
            @click.stop
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </router-link>
          <Button
            type="button"
            variant="danger"
            size="sm"
            :loading="viewModel.deletingId.value === project.id"
            :show-spinner="true"
            text="Delete"
            :aria-label="`Delete ${project.name}`"
            @click.stop="openDeleteModal(project)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            {{ viewModel.deletingId.value === project.id ? 'Deleting...' : 'Delete' }}
          </Button>
        </template>
      </ProjectCard>
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
        <Button
          type="button"
          variant="danger"
          :loading="!!viewModel.deletingId.value"
          :show-spinner="true"
          text="Delete project"
          :disabled="!!viewModel.deletingId.value"
          @click="confirmDelete"
        >
          {{ viewModel.deletingId.value ? 'Deleting…' : 'Delete project' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import ProjectCard from './components/ProjectCard.vue';
import EmptyState from '../../../../shared/components/EmptyState.vue';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner.vue';
import ErrorDisplay from '../../../../shared/components/ErrorDisplay.vue';
import Modal from '../../../../shared/components/Modal.vue';
import Button from '../../../../shared/components/atoms/Button.vue';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { userContextService } from '../../../../shared/services/user-context.service';
import type { Project } from '../../domain/entities/project.entity';

const ONBOARDING_STORAGE_KEY = 'validatey_onboarding_completed';
const ONBOARDING_HYPOTHESIS_KEY = 'validatey_onboarding_hypothesis';

const router = useRouter();
const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

const onboardingCompleted = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
);
const onboardingHypothesis = ref('');

function startOnboarding() {
  const hypothesis = onboardingHypothesis.value?.trim();
  if (!hypothesis) return;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ONBOARDING_HYPOTHESIS_KEY, hypothesis);
  }
  router.push({ path: '/projects/new', query: { onboarding: '1' } });
}

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

function refetchProjects() {
  presenter.loadProjects(viewModel);
}

onMounted(() => {
  // Load projects immediately if we already have session and userId
  if (userContextService.isSessionReady() && userContextService.getCurrentUserId()) {
    refetchProjects();
  }

  // Also listen for session/userId changes
  window.addEventListener('validatey-session-ready', refetchProjects);
  window.addEventListener('validatey-user-id-synced', refetchProjects);
});

onUnmounted(() => {
  window.removeEventListener('validatey-session-ready', refetchProjects);
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

.projects-grid > * {
  display: block !important;
  min-width: 0;
}

.loading-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.project-card-edit {
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-accent);
  background: transparent;
  border: 1px solid var(--color-accent-bg);
  border-radius: var(--radius-sm);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  text-align: center;
}

.project-card-edit svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.project-card-edit:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent-hover);
}

.project-card-delete {
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error-bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.project-card-delete svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.project-card-delete:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.project-card-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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

.onboarding-block {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.onboarding-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.onboarding-description {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
}

.onboarding-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-sizing: border-box;
}

.onboarding-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

</style>

