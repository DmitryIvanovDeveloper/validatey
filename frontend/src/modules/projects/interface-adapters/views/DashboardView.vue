<template>
  <div class="dashboard-view">
    <!-- Empty State when no projects -->
    <EmptyState
      v-if="viewModel.projects.value.length === 0 && !viewModel.loading.value"
      title="Welcome to Validatey!"
      description="Start by creating your first project to validate your product hypothesis"
      :icon="true"
    >
      <template #icon>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      </template>
      <template #action>
        <router-link to="/projects/new" class="btn btn-primary btn-large">
          Create First Project
        </router-link>
      </template>
    </EmptyState>

    <!-- Dashboard with projects -->
    <div v-else>
      <PageHeader
        title="My Projects"
        subtitle="Manage validation of your product hypotheses"
        :breadcrumbs="[{ label: 'Home', path: '/' }]"
      >
        <template #actions>
          <router-link to="/projects/new" class="btn btn-primary">+ Create Project</router-link>
        </template>
      </PageHeader>

      <div v-if="viewModel.loading.value" class="loading-state">
        <div class="projects-grid">
          <div class="skeleton-project-card project-card">
            <div class="skeleton-card-inner project-card__inner">
              <div class="skeleton-card-header project-card__header">
                <div class="skeleton-line skeleton-title project-card__title"></div>
                <div class="skeleton-menu project-card__menu" aria-hidden="true">
                  <div class="skeleton-menu-trigger project-card__menu-trigger"></div>
                </div>
              </div>
              <div class="skeleton-card-meta project-card__meta">
                <div class="skeleton-line skeleton-date project-card__date"></div>
              </div>
              <div class="skeleton-card-footer project-card__footer">
                <div class="skeleton-line skeleton-footer-link project-card__link"></div>
              </div>
            </div>
          </div>
          <div class="skeleton-project-card project-card">
            <div class="skeleton-card-inner project-card__inner">
              <div class="skeleton-card-header project-card__header">
                <div class="skeleton-line skeleton-title project-card__title"></div>
                <div class="skeleton-menu project-card__menu" aria-hidden="true">
                  <div class="skeleton-menu-trigger project-card__menu-trigger"></div>
                </div>
              </div>
              <div class="skeleton-card-meta project-card__meta">
                <div class="skeleton-line skeleton-date project-card__date"></div>
              </div>
              <div class="skeleton-card-footer project-card__footer">
                <div class="skeleton-line skeleton-footer-link project-card__link"></div>
              </div>
            </div>
          </div>
          <div class="skeleton-project-card project-card">
            <div class="skeleton-card-inner project-card__inner">
              <div class="skeleton-card-header project-card__header">
                <div class="skeleton-line skeleton-title project-card__title"></div>
                <div class="skeleton-menu project-card__menu" aria-hidden="true">
                  <div class="skeleton-menu-trigger project-card__menu-trigger"></div>
                </div>
              </div>
              <div class="skeleton-card-meta project-card__meta">
                <div class="skeleton-line skeleton-date project-card__date"></div>
              </div>
              <div class="skeleton-card-footer project-card__footer">
                <div class="skeleton-line skeleton-footer-link project-card__link"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="viewModel.error.value" class="error-state">
        <ErrorDisplay :error="viewModel.error.value" />
      </div>

      <div v-else class="projects-grid">
        <ProjectCard
          v-for="project in viewModel.projects.value"
          :key="project.id"
          :project="project"
          @click="goToProject(project.id)"
        >
          <template #footer>
            <div class="dashboard-card-footer">
              <router-link :to="`/projects/${project.id}`" class="project-card__link" @click.stop>
                Details
                <svg class="project-card__link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </router-link>
            </div>
          </template>
        </ProjectCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from '../../../../shared/components/Card.vue';
import EmptyState from '../../../../shared/components/EmptyState.vue';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner.vue';
import ErrorDisplay from '../../../../shared/components/ErrorDisplay.vue';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { sessionManager } from '../../../../shared/services/session-manager';

const router = useRouter();
const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

function refetchProjects() {
  presenter.loadProjects(viewModel);
}

onMounted(() => {
  if (sessionManager.isSessionReady) {
    refetchProjects();
  }
  window.addEventListener('validatey-session-ready', refetchProjects);
  window.addEventListener('validatey-user-id-synced', refetchProjects);
});

onUnmounted(() => {
  window.removeEventListener('validatey-session-ready', refetchProjects);
  window.removeEventListener('validatey-user-id-synced', refetchProjects);
});

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

</script>

<style scoped>
.dashboard-view {
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

.dashboard-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.dashboard-card-progress {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.dashboard-card-progress:hover {
  color: var(--color-accent);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}

/* Skeleton Loading Styles */
.skeleton-project-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
}

.skeleton-card-inner {
  padding: 1.25rem 1.5rem;
}

.skeleton-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  height: 1rem;
  border-radius: 0.25rem;
}

.skeleton-title {
  width: 60%;
  height: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
}

.skeleton-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
}

.skeleton-menu-trigger:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.skeleton-menu-svg {
  width: 16px;
  height: 16px;
  opacity: 0.8;
}

/* Добавим специфичные стили для элементов, имитирующих кнопки действия */
.skeleton-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skeleton-menu-action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
  height: 2rem;
}

.skeleton-menu-action-btn:hover {
  background: var(--color-bg-subtle);
}

.skeleton-menu-action-btn svg {
  width: 16px;
  height: 16px;
}

.skeleton-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 160px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.08);
  padding: 0.5rem 0;
  margin-top: 4px;
  display: none; /* Initially hidden */
}

.skeleton-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
}

.skeleton-menu-action-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
  height: 2rem;
}

.skeleton-card-meta {
  margin-bottom: 1rem;
}

.skeleton-date {
  width: 120px;
  height: 1rem;
  border-radius: 0.25rem;
}

.skeleton-date-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
}

.skeleton-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.skeleton-footer-link {
  width: 100px;
  height: 1rem;
  border-radius: 0.25rem;
}

.skeleton-link-arrow {
  width: 16px;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
}

@keyframes skeleton-pulse {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
</style>
