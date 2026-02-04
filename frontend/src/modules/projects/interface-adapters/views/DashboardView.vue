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
        <LoadingSpinner />
        <p>Loading projects...</p>
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
              <router-link
                v-if="project.status === 'in-progress'"
                :to="`/projects/${project.id}/progress`"
                class="dashboard-card-progress"
                @click.stop
              >
                Progress
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
import Card from '@/shared/components/Card.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
const router = useRouter();
const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

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
</style>
