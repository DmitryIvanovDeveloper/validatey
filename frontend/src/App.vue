<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { RouterView } from 'vue-router';
import AppLayout from './shared/components/layouts/AppLayout.vue';
import EmptyLayout from './shared/components/layouts/EmptyLayout.vue';

const route = useRoute();

// Определяем какой layout использовать на основе meta
const layout = computed(() => {
  return route.meta.layout === 'empty' ? EmptyLayout : AppLayout;
});
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
