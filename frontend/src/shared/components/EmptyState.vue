<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-state-icon">
      <slot name="icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </slot>
    </div>
    <h3 v-if="title" class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
  icon?: boolean;
}>();
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
}

.empty-state-icon {
  margin-bottom: 1.5rem;
  color: #cbd5e0;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  font-size: 1rem;
  margin: 0 0 2rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-state-action {
  margin-top: 1.5rem;
}
</style>


