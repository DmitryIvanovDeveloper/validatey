<template>
  <header class="page-header" :class="{ 'page-header-compact': compact }">
    <nav v-if="breadcrumbs?.length" class="breadcrumb" aria-label="Breadcrumb">
      <template v-for="(item, i) in (breadcrumbs ?? [])" :key="item.path ?? i">
        <router-link v-if="item.path" :to="item.path" class="breadcrumb-link">{{ item.label }}</router-link>
        <span v-else class="breadcrumb-current">{{ item.label }}</span>
        <span v-if="i < (breadcrumbs?.length ?? 0) - 1" class="breadcrumb-sep" aria-hidden="true">/</span>
      </template>
    </nav>
    <div class="header-main">
      <h1 v-if="title" class="page-title">{{ title }}</h1>
      <slot v-else name="title" />
      <div v-if="$slots.actions" class="header-actions">
        <slot name="actions" />
      </div>
    </div>
    <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  compact?: boolean;
}>();
</script>

<style scoped>
.page-header {
  margin-bottom: var(--space-8, 2rem);
  padding-bottom: var(--space-6, 1.5rem);
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.page-header-compact {
  margin-bottom: var(--space-6, 1.5rem);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted, #64748b);
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: var(--color-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--color-accent);
}

.breadcrumb-sep {
  opacity: 0.5;
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: 600;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.page-subtitle {
  font-size: var(--text-base, 0.875rem);
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
  max-width: 42rem;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
