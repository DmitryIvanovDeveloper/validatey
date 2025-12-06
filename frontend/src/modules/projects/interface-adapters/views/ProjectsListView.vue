<template>
  <div class="projects-list-view">
    <h1>Projects</h1>
    <div v-if="viewModel.loading.value">Loading...</div>
    <div v-else-if="viewModel.error.value" class="error">{{ viewModel.error.value }}</div>
    <div v-else>
      <div v-for="project in viewModel.projects.value" :key="project.id" class="project-item">
        <router-link :to="`/projects/${project.id}`">{{ project.name }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ProjectListPresenter } from '../presenters/project-list.presenter';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';

const viewModel = new ProjectListViewModel();
const presenter = container.get<ProjectListPresenter>(TYPES.ProjectListPresenter);

onMounted(() => {
  presenter.loadProjects(viewModel);
});
</script>

<style scoped>
.projects-list-view {
  padding: 2rem;
}

.project-item {
  padding: 1rem;
  margin: 0.5rem 0;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error {
  color: red;
  padding: 1rem;
}
</style>

