<template>
  <div class="insight-card">
    <div class="insight-header">
      <div class="insight-icon">
        <component :is="icon" class="insight-icon-svg" />
      </div>
      <h3 class="insight-title">{{ title }}</h3>
    </div>
    <p class="insight-content">{{ content }}</p>
    <div class="insight-source">Source: {{ source }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: any;
  title: string;
  content: string;
  source: string;
}

defineProps<Props>();
</script>

<style scoped>
.insight-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.insight-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.insight-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.insight-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

.insight-icon-svg {
  width: 1.25rem;
  height: 1.25rem;
}

.insight-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.insight-content {
  color: var(--color-text);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.insight-source {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>