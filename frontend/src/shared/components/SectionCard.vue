<template>
  <div class="section-card">
    <div v-if="$slots.header || title" class="section-card-header">
      <slot name="header">
        <h2 v-if="title" class="heading-3 text-gray-900 mb-6">{{ title }}</h2>
      </slot>
    </div>
    <div class="section-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style scoped>
.section-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  margin-bottom: 1.5rem;
}

.section-card-body {
  /* Additional body styles can be added here if needed */
}
</style>