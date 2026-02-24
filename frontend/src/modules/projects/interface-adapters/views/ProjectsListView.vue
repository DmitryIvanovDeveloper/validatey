<template>
  <div class="projects-list-view">
    <PageHeader
      :title="presenter.labels.title"
      :subtitle="presenter.labels.subtitle"
      :breadcrumbs="[{ label: presenter.labels.breadcrumb }]"
    >
      <template #actions>
        <div class="header-actions-row">
          <div class="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              :class="['view-toggle__btn', { active: viewMode === 'cards' }]"
              :aria-pressed="viewMode === 'cards'"
              @click="viewMode = 'cards'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              {{ presenter.labels.viewCards }}
            </button>
            <button
              type="button"
              :class="['view-toggle__btn', { active: viewMode === 'table' }]"
              :aria-pressed="viewMode === 'table'"
              @click="viewMode = 'table'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              {{ presenter.labels.viewTable }}
            </button>
          </div>
          <router-link :to="`/workspaces/${workspaceId}/projects/new`" class="btn btn-primary">{{ presenter.labels.newValidation }}</router-link>
        </div>
      </template>
    </PageHeader>

    <div v-if="viewModel.loading.value" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>{{ presenter.labels.loading }}</p>
    </div>
    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>
    <div v-else-if="!viewModel.loading.value && viewModel.projects.value.length === 0" class="empty-state">
      <!-- Guided onboarding for first-time users -->
      <div v-if="!onboardingCompleted" class="onboarding-block">
        <h2 class="onboarding-title">{{ presenter.labels.onboardingTitle }}</h2>
        <p class="onboarding-description">{{ presenter.labels.onboardingDescription }}</p>
        <form class="onboarding-form" @submit.prevent="startOnboarding">
          <input
            v-model="onboardingHypothesis"
            type="text"
            class="onboarding-input"
            :placeholder="presenter.labels.onboardingPlaceholder"
            required
          />
          <button type="submit" class="btn btn-primary btn-large">{{ presenter.labels.createFirstProject }}</button>
        </form>
      </div>
      <EmptyState
        v-else
        :title="presenter.labels.emptyTitle"
        :description="presenter.labels.emptyDescription"
      >
        <template #action>
          <router-link :to="`/workspaces/${workspaceId}/projects/new`" class="btn btn-primary btn-large">{{ presenter.labels.createProject }}</router-link>
        </template>
      </EmptyState>
    </div>
    <div v-else-if="viewMode === 'cards'" class="projects-grid">
      <ProjectCard
        v-for="project in viewModel.projects.value"
        :key="project.id"
        :project="project"
        @click="goToProject(project.id)"
      >
        <template #footer>
          <router-link :to="`/projects/${project.id}`" class="project-card__link" @click.stop>
            {{ presenter.labels.viewProject }}
            <svg class="project-card__link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </router-link>
        </template>
        <template #actions>
          <button
            type="button"
            class="project-card-edit"
            :aria-label="presenter.labels.editAria(project.name)"
            @click.stop="goToProjectEdit(project.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {{ presenter.labels.edit }}
          </button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            :loading="viewModel.deletingId.value === project.id"
            :show-spinner="true"
            :text="presenter.labels.delete"
            :aria-label="presenter.labels.deleteAria(project.name)"
            @click.stop="openDeleteModal(project)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            {{ viewModel.deletingId.value === project.id ? presenter.labels.deleting : presenter.labels.delete }}
          </Button>
        </template>
      </ProjectCard>
    </div>
    <div v-else class="projects-table-wrap">
      <table class="projects-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Created</th>
            <th class="projects-table__actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in viewModel.projects.value"
            :key="project.id"
            class="projects-table__row"
            @click="goToProject(project.id)"
          >
            <td>
              <span class="projects-table__name">{{ project.name }}</span>
            </td>
            <td>
              <span :class="['projects-table__status', `projects-table__status--${project.status}`]">
                {{ statusLabels[project.status] ?? project.status }}
              </span>
            </td>
            <td>
              <span class="projects-table__date">{{ formatDate(project.createdAt) }}</span>
            </td>
            <td class="projects-table__actions-col" @click.stop>
              <div class="projects-table__actions">
                <button
                  type="button"
                  class="projects-table__action-text"
                  :aria-label="presenter.labels.editAria(project.name)"
                  @click.stop="goToProjectEdit(project.id)"
                >
                  {{ presenter.labels.edit }}
                </button>
                <button
                  type="button"
                  class="projects-table__action-text projects-table__action-text--delete"
                  :disabled="!!viewModel.deletingId.value"
                  :aria-label="presenter.labels.deleteAria(project.name)"
                  @click.stop="openDeleteModal(project)"
                >
                  {{ viewModel.deletingId.value === project.id ? presenter.labels.deleting : presenter.labels.delete }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <DeleteProjectModal
      v-model="deleteModalOpen"
      :project="projectToDelete"
      :loading="!!viewModel.deletingId.value"
      @delete="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import ProjectCard from './components/ProjectCard.vue';
import EmptyState from '../../../../shared/components/EmptyState.vue';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner.vue';
import ErrorDisplay from '../../../../shared/components/ErrorDisplay.vue';
import Button from '../../../../shared/components/atoms/Button.vue';
import DeleteProjectModal from './components/DeleteProjectModal.vue';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { sessionManager } from '../../../../shared/services/session-manager';
import type { Project } from '../../domain/entities/project.entity';

const ONBOARDING_STORAGE_KEY = 'validatey_onboarding_completed';
const ONBOARDING_HYPOTHESIS_KEY = 'validatey_onboarding_hypothesis';
const PROJECTS_VIEW_MODE_KEY = 'validatey_projects_view_mode';

type ViewMode = 'cards' | 'table';

const viewMode = ref<ViewMode>(
  (typeof localStorage !== 'undefined' ? localStorage.getItem(PROJECTS_VIEW_MODE_KEY) : null) as ViewMode || 'cards'
);

watch(viewMode, (v) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PROJECTS_VIEW_MODE_KEY, v);
  }
});

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In progress',
  completed: 'Completed',
  archived: 'Archived',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const router = useRouter();
const route = useRoute();
const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

// Get workspaceId from route params
const workspaceId = computed(() => route.params.workspaceId as string);

// Redirect to workspaces if no workspaceId; load projects when workspaceId changes
watch(workspaceId, (newWorkspaceId) => {
  if (!newWorkspaceId) {
    console.log('No workspaceId, redirecting to workspaces');
    router.replace('/workspaces');
    return;
  }
  refetchProjects();
}, { immediate: true });

// Refetch when navigating back to the list (e.g. from project/invitations) so new projects appear
watch(
  () => route.fullPath,
  (path) => {
    const wid = route.params.workspaceId as string;
    if (wid && path === `/workspaces/${wid}/projects`) {
      refetchProjects();
    }
  }
);

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
  router.push({ path: `/workspaces/${workspaceId.value}/projects/new`, query: { onboarding: '1' } });
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

async function confirmDelete(projectId: string) {
  await presenter.deleteProject(viewModel, projectId, workspaceId.value);
  projectToDelete.value = null;
}

const goToProject = (projectId: string) => {
  router.push(`/workspaces/${workspaceId.value}/projects/${projectId}`);
};

const goToProjectEdit = (projectId: string) => {
  router.push(`/workspaces/${workspaceId.value}/projects/${projectId}/edit`);
};

function refetchProjects() {
  if (workspaceId.value) {
    presenter.loadProjects(viewModel, workspaceId.value);
  }
}

onMounted(() => {
  // Load projects immediately if we already have session and userId
  if (sessionManager.isSessionReady && sessionManager.currentUserId) {
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

/* View toggle */
.header-actions-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.view-toggle {
  display: inline-flex;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 2px;
}

.view-toggle__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.view-toggle__btn svg {
  width: 16px;
  height: 16px;
}

.view-toggle__btn:hover {
  color: var(--color-text);
}

.view-toggle__btn.active {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

/* Projects table */
.projects-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.projects-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
}

.projects-table th:first-child {
  border-radius: var(--radius-md) 0 0 0;
}

.projects-table th:last-child {
  border-radius: 0 var(--radius-md) 0 0;
}

.projects-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.projects-table__row {
  cursor: pointer;
  transition: background 0.15s;
}

.projects-table__row:hover {
  background: var(--color-bg-subtle);
}

.projects-table__row:last-child td {
  border-bottom: none;
}

.projects-table__name {
  font-weight: 600;
  color: var(--color-text);
}

.projects-table__status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 9999px;
}

.projects-table__status--draft {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.projects-table__status--in-progress {
  background: var(--color-accent-light);
  color: var(--color-accent-hover);
}

.projects-table__status--completed {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.projects-table__status--archived {
  background: var(--color-bg-subtle);
  color: var(--color-text-subtle);
}

.projects-table__date {
  color: var(--color-text-muted);
}

.projects-table__actions-col {
  width: 1%;
  white-space: nowrap;
}

.projects-table__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.projects-table__action-text {
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--color-text);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
}

.projects-table__action-text:hover:not(:disabled) {
  text-decoration: underline;
}

.projects-table__action-text--delete {
  color: var(--color-error);
}

.projects-table__action-text:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
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
  gap: 0.25rem;
  text-align: center;
}

.project-card-edit svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.project-card-edit:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent-hover);
}

.project-card-delete {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error-bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.project-card-delete svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.project-card-delete:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* Delete button - red text (in cards) */
.projects-grid :deep(.btn-danger) {
  color: var(--color-error);
  background: transparent;
  border-color: var(--color-error-bg);
}

.projects-grid :deep(.btn-danger:hover:not(.btn-disabled)) {
  background: var(--color-error-bg);
  border-color: var(--color-error-bg);
  color: var(--color-error-hover);
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

