<template>
      <ProjectLandingWidget :project-id="projectId" />
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