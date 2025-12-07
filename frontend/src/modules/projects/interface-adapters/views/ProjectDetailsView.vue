<template>
  <div class="project-details-view">
    <div class="details-header">
      <router-link to="/projects" class="back-link">← Back to Projects</router-link>
      <div class="header-actions">
        <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">
          Manage Invitations
        </router-link>
        <router-link :to="`/projects/${projectId}/progress`" class="btn btn-secondary">
          Progress
        </router-link>
        <router-link :to="`/projects/${projectId}/report`" class="btn btn-primary">
          Report
        </router-link>
      </div>
    </div>

    <div v-if="viewModel.loading.value" class="loading-state">
      <LoadingSpinner />
      <p>Loading project...</p>
    </div>

    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>

    <div v-else-if="project" class="details-content">
      <Card :title="project.name" class="project-card">
        <div class="project-info">
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span :class="['status-badge', `status-${project.status}`]">
              {{ getStatusLabel(project.status) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Created:</span>
            <span>{{ formatDate(project.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Updated:</span>
            <span>{{ formatDate(project.updatedAt) }}</span>
          </div>
        </div>
      </Card>

      <Card title="Segment" class="segment-card">
        <div class="segment-content">
          <div class="content-item">
            <h4>Description</h4>
            <p>{{ project.segment?.description || 'Not specified' }}</p>
          </div>
          <div class="content-item">
            <h4>Demographics</h4>
            <p v-if="project.segment?.demographics">
              <template v-if="typeof project.segment.demographics === 'string'">
                {{ project.segment.demographics }}
              </template>
              <template v-else>
                <template v-for="(value, key) in project.segment.demographics" :key="key">
                  <strong>{{ key }}:</strong> {{ value }}<br />
                </template>
              </template>
            </p>
            <p v-else>Not specified</p>
          </div>
        </div>
      </Card>

      <Card title="Hypothesis" class="hypothesis-card">
        <div class="hypothesis-content">
          <div class="content-item">
            <h4>Description</h4>
            <p>{{ project.hypothesis?.description || 'Not specified' }}</p>
          </div>
          <div class="content-item" v-if="project.hypothesis?.assumptions?.length">
            <h4>Assumptions</h4>
            <ul class="assumptions-list">
              <li v-for="(assumption, index) in project.hypothesis.assumptions" :key="index">
                {{ assumption }}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectStatus } from '../../domain/entities/project.entity';

const route = useRoute();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

const project = computed(() => {
  return viewModel.project.value;
});

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
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

onMounted(() => {
  if (projectId) {
    presenter.loadProject(projectId, viewModel);
  }
});
</script>

<style scoped>
.project-details-view {
  padding: 2rem 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.back-link {
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.project-card,
.segment-card,
.hypothesis-card {
  margin-bottom: 2rem;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-label {
  font-weight: 500;
  color: #4a5568;
  min-width: 120px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-draft {
  background: #edf2f7;
  color: #4a5568;
}

.status-active {
  background: #c6f6d5;
  color: #22543d;
}

.status-completed {
  background: #bee3f8;
  color: #2c5282;
}

.status-archived {
  background: #f7fafc;
  color: #718096;
}

.segment-content,
.hypothesis-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.content-item p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

.assumptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.assumptions-list li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #4a5568;
}

.assumptions-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4299e1;
  font-weight: bold;
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

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

@media (max-width: 768px) {
  .details-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
    text-align: center;
  }
}
</style>
