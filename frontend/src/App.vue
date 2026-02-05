<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterView } from 'vue-router';
import AppLayout from './shared/components/layouts/AppLayout.vue';
import EmptyLayout from './shared/components/layouts/EmptyLayout.vue';

const route = useRoute();
const router = useRouter();

/** Don't show layout until initial navigation (and guards) have completed to avoid flashing app header. */
const ready = ref(false);
onMounted(async () => {
  await router.isReady();
  ready.value = true;
});

// Определяем какой layout использовать на основе meta
const layout = computed(() => {
  return route.meta.layout === 'empty' ? EmptyLayout : AppLayout;
});
</script>

<template>
  <template v-if="ready">
    <component :is="layout">
      <RouterView />
    </component>
  </template>
  <div v-else class="app-initial-loading" aria-live="polite">
    <span class="app-initial-loading__brand">Validatey</span>
  </div>
</template>

<style scoped>
.app-initial-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #fafafa);
}
.app-initial-loading__brand {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-accent, #0d9488);
  letter-spacing: -0.02em;
}
</style>
