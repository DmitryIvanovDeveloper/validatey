<template>
  <div class="project-landing-view">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Landing Page</h1>
        <p class="text-gray-600">Host your custom landing page on a subdomain</p>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-8">
        <ProjectLandingWidget :project-id="projectId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ProjectLandingWidget from '../widgets/ProjectLandingWidget.vue';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);
</script>

<style scoped>
.project-landing-view {
  padding: 2rem;
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>