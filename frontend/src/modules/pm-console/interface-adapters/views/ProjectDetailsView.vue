<template>
  <div class="project-details-view">
    <h1>Детали проекта</h1>
    <p>Project ID: {{ $route.params.projectId }}</p>
    <router-link :to="`/projects/${$route.params.projectId}/report`">
      Посмотреть отчёт
    </router-link>
  </div>
</template>

<script setup lang="ts">
// Project Details View - детали проекта
</script>

<style scoped>
.project-details-view {
  padding: 2rem 0;
}

.project-details-view h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.project-details-view p {
  color: #718096;
  margin-bottom: 1rem;
}
</style>


