<template>
  <div class="dashboard-view">
    <!-- Empty State for new users -->
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
        <Card
          v-for="project in viewModel.projects.value"
          :key="project.id"
          :title="project.name"
          hover
          clickable
          @click="goToProject(project.id)"
        >
          <template #header>
            <div class="project-card-header">
              <h3>{{ project.name }}</h3>
              <span :class="['status-badge', `status-${project.status}`]">
                {{ getStatusLabel(project.status) }}
              </span>
            </div>
          </template>
          
          <div class="project-card-body">
            <div class="project-meta">
              <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ formatDate(project.createdAt) }}
              </span>
            </div>
          </div>

          <template #footer>
            <div class="project-card-footer">
              <router-link :to="`/projects/${project.id}`" class="btn-link">
                Details →
              </router-link>
              <router-link v-if="project.status === 'in-progress'" :to="`/projects/${project.id}/progress`" class="btn-link">
                Progress
              </router-link>
            </div>
          </template>
        </Card>
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
import { ProjectStatus } from '../../domain/entities/project.entity';

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

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
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

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.project-card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
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

.project-card-body {
  margin-top: 1rem;
}

.project-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.project-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.btn-link:hover {
  color: var(--color-accent-hover);
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
