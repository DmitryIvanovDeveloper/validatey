<template>
  <div class="comments-view">
    <CommentsTab :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CommentsTab from '../components/CommentsTab.vue';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);
</script>

<style scoped>
.comments-view {
  padding: 0 1rem 2rem;
  max-width: 100%;
  background: var(--color-bg-page);
}
</style>
