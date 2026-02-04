<template>
  <article
    :class="['project-card', `project-card--${project.status}`]"
    @click="emit('click')"
  >
    <div class="project-card__accent" aria-hidden="true" />
    <div class="project-card__inner">
      <header class="project-card__header">
        <h3 class="project-card__title">{{ project.name }}</h3>
        <span :class="['project-card__status', `project-card__status--${project.status}`]">
          {{ statusLabel }}
        </span>
      </header>
      <div class="project-card__meta">
        <span class="project-card__date">
          <svg class="project-card__date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {{ formattedDate }}
        </span>
      </div>
      <footer v-if="$slots.footer || $slots.actions" class="project-card__footer">
        <slot name="footer">
          <router-link :to="`/projects/${project.id}`" class="project-card__link" @click.stop>
            View project
            <svg class="project-card__link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </router-link>
        </slot>
        <div v-if="$slots.actions" class="project-card__actions" @click.stop>
          <slot name="actions" />
        </div>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Project, ProjectStatus } from '../../../domain/entities/project.entity';

const props = defineProps<{
  project: Project;
}>();

const emit = defineEmits<{
  click: [];
}>();

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-progress': 'In progress',
  completed: 'Completed',
  archived: 'Archived',
};

const statusLabel = computed(() => statusLabels[props.project.status] ?? props.project.status);

const formattedDate = computed(() => {
  const d = typeof props.project.createdAt === 'string'
    ? new Date(props.project.createdAt)
    : props.project.createdAt;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
});
</script>

<style scoped>
.project-card {
  position: relative;
  background: var(--color-bg);
  border-radius: 16px;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.08);
  border-color: rgba(13, 148, 136, 0.25);
}

.project-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.project-card--draft .project-card__accent {
  background: linear-gradient(90deg, var(--color-bg-subtle) 0%, var(--color-border-light) 100%);
}

.project-card--in-progress .project-card__accent {
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-muted) 100%);
}

.project-card--completed .project-card__accent {
  background: linear-gradient(90deg, var(--color-info) 0%, #38bdf8 100%);
}

.project-card--archived .project-card__accent {
  background: linear-gradient(90deg, var(--color-text-subtle) 0%, var(--color-border) 100%);
}

.project-card__inner {
  padding: 1.25rem 1.5rem;
}

.project-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.project-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-card__status {
  flex-shrink: 0;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.project-card__status--draft {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.project-card__status--in-progress {
  background: var(--color-accent-light);
  color: var(--color-accent-hover);
}

.project-card__status--completed {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.project-card__status--archived {
  background: var(--color-bg-subtle);
  color: var(--color-text-subtle);
}

.project-card__meta {
  margin-bottom: 1rem;
}

.project-card__date {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.project-card__date-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.8;
}

.project-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.project-card__footer :deep(.project-card__link) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.15s ease;
}

.project-card__footer :deep(.project-card__link:hover) {
  color: var(--color-accent-hover);
}

.project-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.15s ease, gap 0.15s ease;
}

.project-card__link:hover {
  color: var(--color-accent-hover);
}

.project-card__link:hover :deep(.project-card__link-arrow) {
  transform: translateX(2px);
}

.project-card__link-arrow,
:deep(.project-card__link-arrow) {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.project-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
