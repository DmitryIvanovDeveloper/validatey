<template>
  <div class="project-dashboard-view">
    <header class="dashboard-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link :to="workspaceId ? `/workspaces/${workspaceId}/projects` : '/workspaces'" class="breadcrumb-link">{{ presenter.labels.dashboardBreadcrumbProjects }}</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ projectName }}</span>
      </nav>
      <nav class="dashboard-tabs" role="tablist">
        <router-link
          :to="projectBase"
          class="tab-link"
          :class="{ active: isTabActive('overview') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabOverview }}
        </router-link>
        <router-link
          v-if="false"
          :to="`${projectBase}/scraper`"
          class="tab-link"
          :class="{ active: isTabActive('scraper') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabScraper }}
        </router-link>
        <router-link
          :to="`${projectBase}/invitations`"
          class="tab-link"
          :class="{ active: isTabActive('invitations') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabInvitations }}
        </router-link>
        <router-link
          :to="`${projectBase}/responses`"
          class="tab-link"
          :class="{ active: isTabActive('responses') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabResponses }}
        </router-link>
        <router-link
          :to="`${projectBase}/comments`"
          class="tab-link"
          :class="{ active: isTabActive('comments') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabComments }}
        </router-link>
        <router-link
          v-if="false"
          :to="`${projectBase}/report`"
          class="tab-link"
          :class="{ active: isTabActive('report') }"
          role="tab"
        >
          {{ presenter.labels.dashboardTabReport }}
        </router-link>
      </nav>
      <!-- Sub-header for round context -->
      <div v-if="isTabActive('round')" class="round-sub-header">
        <router-link :to="projectBase" class="round-back-link">
          {{ presenter.labels.dashboardBackToOverview }}
        </router-link>
      </div>
    </header>
    <main class="dashboard-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import { ProjectPresenter } from '../../presenters/project.presenter';
import { ProjectViewModel } from '../../view-models/project.view-model';

const route = useRoute();
const workspaceId = computed(() => route.params.workspaceId as string);
const projectId = computed(() => route.params.projectId as string);
const projectBase = computed(() => `/workspaces/${workspaceId.value}/projects/${projectId.value}`);
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

const projectName = computed(() => viewModel.project.value?.name ?? presenter.labels.dashboardDefaultProjectName);

function isTabActive(tab: string): boolean {
  const name = route.name as string;
  if (tab === 'overview') return name === 'project-details' || name === 'project-overview';
  if (tab === 'invitations') return name === 'project-invitations';
  if (tab === 'responses') return name === 'project-responses';
  if (tab === 'comments') return name === 'project-comments';
  if (tab === 'round') return name === 'round-detail';
  return false;
}

onMounted(() => {
  if (projectId.value) {
    presenter.loadProject(projectId.value, viewModel);
  }
});
</script>

<style scoped>
.project-dashboard-view {
  padding: 0 1rem 2rem;
  max-width: 100%;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.breadcrumb {
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.breadcrumb-link {
  color: var(--color-accent);
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  color: var(--color-text-muted);
  margin: 0 0.25rem;
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: 500;
}

.dashboard-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.tab-link {
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.tab-link:hover {
  color: var(--color-text);
}

.tab-link.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.dashboard-content {
  min-height: 200px;
}

.round-sub-header {
  padding: 0.5rem 0 0 0;
}

.round-back-link {
  font-size: 0.8125rem;
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.round-back-link:hover {
  text-decoration: underline;
}
</style>
