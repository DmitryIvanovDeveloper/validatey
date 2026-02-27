<template>
  <article
    ref="cardRef"
    :class="['project-card', `project-card--${project.status}`]"
    @click="emit('click')"
  >
    <div class="project-card__inner">

      <!-- Zone 1: Orientation — project status + AI verdict + menu -->
      <div class="project-card__header">
        <div class="project-card__badges">
          <span
            v-if="project.status !== 'draft'"
            :class="['project-card__status-badge', `project-card__status-badge--${project.status}`]"
          >
            <span class="project-card__status-dot" aria-hidden="true" />
            {{ statusLabel }}
          </span>
          <HypothesisStatusWidget
            v-if="isVisible"
            :project-id="project.id"
            class="project-card__verdict-badge"
          />
        </div>
        <div class="project-card__menu" @click.stop>
          <button
            type="button"
            class="project-card__menu-trigger"
            :aria-label="`Menu for ${project.name}`"
            @click="toggleMenu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          <div v-if="menuOpen" class="project-card__menu-dropdown">
            <div v-if="$slots.actions" class="project-card__menu-actions">
              <slot name="actions" />
            </div>
          </div>
        </div>
      </div>

      <!-- Zone 2: Identity — project name + hypothesis snippet -->
      <div class="project-card__identity">
        <h3 class="project-card__title">{{ project.name }}</h3>
        <p v-if="hypothesisText" class="project-card__hypothesis">{{ hypothesisText }}</p>
      </div>

      <!-- Zone 3: Progress — 3 metric chips -->
      <div class="project-card__metrics">
        <template v-if="isVisible">
          <!-- Responses chip -->
          <div class="metric-chip">
            <span class="metric-chip__label">Responses</span>
            <ResponsesWidget :project-id="project.id" />
          </div>
          <!-- Hypothesis chip -->
          <div class="metric-chip metric-chip--border">
            <span class="metric-chip__label">Hypothesis</span>
            <AssumptionsWidget :project-id="project.id" />
          </div>
          <!-- Social signals chip -->
          <div class="metric-chip metric-chip--border">
            <span class="metric-chip__label">Social</span>
            <CommentsWidgetCompact :project-id="project.id" />
          </div>
        </template>
        <template v-else>
          <div class="metric-chip metric-chip--skeleton">
            <div class="skeleton-label" />
            <div class="skeleton-value" />
          </div>
          <div class="metric-chip metric-chip--skeleton metric-chip--border">
            <div class="skeleton-label" />
            <div class="skeleton-value" />
          </div>
          <div class="metric-chip metric-chip--skeleton metric-chip--border">
            <div class="skeleton-label" />
            <div class="skeleton-value" />
          </div>
        </template>
      </div>

      <!-- Zone 4: Footer — date + CTA -->
      <footer class="project-card__footer">
        <span class="project-card__date">
          <svg class="project-card__date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {{ formattedDate }}
        </span>
        <slot name="footer">
          <router-link :to="`/projects/${project.id}`" class="project-card__cta" @click.stop>
            Open project
            <svg class="project-card__cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </router-link>
        </slot>
      </footer>

    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { Project, ProjectStatus } from '../../../domain/entities/project.entity';
import AssumptionsWidget from '../../../../research/interface-adapters/components/AssumptionsWidget.vue';
import CommentsWidgetCompact from '../../../../comments/interface-adapters/ui/components/CommentsWidgetCompact.vue';
import ResponsesWidget from '../../../../overview/interface-adapters/components/ResponsesWidget.vue';
import { HypothesisStatusWidget } from '../../../../research/interface-adapters';

const props = defineProps<{ project: Project }>();
const emit = defineEmits<{ click: [] }>();

const menuOpen = ref(false);
const isVisible = ref(false);
const cardRef = ref<HTMLElement>();

function toggleMenu() { menuOpen.value = !menuOpen.value; }

function handleClickOutside(event: Event) {
  if (!(event.target as Element).closest('.project-card__menu')) {
    menuOpen.value = false;
  }
}

let observer: IntersectionObserver | null = null;
function setupIntersectionObserver() {
  if (!cardRef.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true;
          observer?.disconnect();
        }
      });
    },
    { threshold: 0.1, rootMargin: '50px' }
  );
  observer.observe(cardRef.value);
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  nextTick(() => setupIntersectionObserver());
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  observer?.disconnect();
});

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-progress': 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

const statusLabel = computed(() => statusLabels[props.project.status] ?? props.project.status);

const hypothesisText = computed(() => props.project.hypothesis?.description?.trim() || null);

const formattedDate = computed(() => {
  const d = typeof props.project.createdAt === 'string'
    ? new Date(props.project.createdAt)
    : props.project.createdAt;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
});
</script>

<style scoped>
/* ─── Card shell ──────────────────────────────────────────────── */
.project-card {
  position: relative;
  background: var(--color-bg);
  border-radius: 14px;
  border: 1px solid var(--color-border-light);
  box-shadow: 0 1px 4px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.18s ease;
}

.project-card__inner {
  padding: 1.25rem 1.5rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ─── Zone 1: Header (orientation) ───────────────────────────── */
.project-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.project-card__badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

/* Project lifecycle status badge */
.project-card__status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.625rem 0.1875rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.project-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Status-specific badge colors */
.project-card__status-badge--draft {
  background: var(--color-bg-subtle);
  color: var(--color-text-subtle);
}
.project-card__status-badge--draft .project-card__status-dot { background: #94a3b8; }

.project-card__status-badge--in-progress {
  background: var(--color-accent-light);
  color: var(--color-accent-hover);
}
.project-card__status-badge--in-progress .project-card__status-dot {
  background: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25);
  animation: pulse-dot 2s ease-in-out infinite;
}

.project-card__status-badge--completed {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.project-card__status-badge--completed .project-card__status-dot { background: var(--color-success); }

.project-card__status-badge--archived {
  background: var(--color-bg-subtle);
  color: var(--color-text-subtle);
}
.project-card__status-badge--archived .project-card__status-dot { background: #94a3b8; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25); }
  50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1); }
}

/* AI verdict badge — HypothesisStatusWidget rendered inside */
.project-card__verdict-badge :deep(.hypothesis-status-badge) {
  font-size: 0.6875rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
}

/* ─── Zone 2: Identity ────────────────────────────────────────── */
.project-card__identity {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
}

.project-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.35;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  letter-spacing: -0.015em;
}

.project-card__hypothesis {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.45;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ─── Zone 3: Metrics chips ───────────────────────────────────── */
.project-card__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-bg-subtle);
}

.metric-chip {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  background: var(--color-bg);
  min-width: 0;
  position: relative;
}

.metric-chip--border::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 1px;
  background: var(--color-border-light);
}

.metric-chip__label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Widget content inside chips — override child styles */
.metric-chip :deep(.widget-content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1875rem;
}

.metric-chip :deep(.widget-label) { display: none; } /* label is in metric-chip__label */
.metric-chip :deep(.widget-value) {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}
.metric-chip :deep(.widget-rate) {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

/* Assumptions: hide donut, show horizontal status bar + micro-counts instead */
.metric-chip :deep(.widget-chart-container) { display: none; }

.metric-chip :deep(.assumptions-widget) {
  display: flex;
  flex-direction: column;
}

.metric-chip :deep(.widget-content) {
  flex-direction: column;
  align-items: flex-start;
}

/* Show horizontal bar in chip context */
.metric-chip :deep(.widget-status-bar) {
  display: flex;
  width: 100%;
  margin-top: 0.25rem;
}

/* Show micro status counts in chip context */
.metric-chip :deep(.widget-status-counts) {
  display: flex;
  margin-top: 0.125rem;
}
.metric-chip :deep(.widget-loading),
.metric-chip :deep(.widget-error) {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Skeleton loading */
.metric-chip--skeleton {
  background: var(--color-bg);
}
.skeleton-label {
  height: 8px;
  width: 48px;
  border-radius: 4px;
  background: var(--color-bg-subtle);
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-value {
  height: 18px;
  width: 36px;
  border-radius: 4px;
  background: var(--color-bg-subtle);
  animation: shimmer 1.6s ease-in-out infinite 0.2s;
  margin-top: 0.25rem;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── Zone 4: Footer ──────────────────────────────────────────── */
.project-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--color-border-light);
}

.project-card__date {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.75rem;
  color: var(--color-text-subtle);
  font-weight: 500;
}

.project-card__date-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  opacity: 0.7;
}

/* CTA link */
.project-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.3125rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-accent-light);
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, gap 0.15s ease;
  white-space: nowrap;
}

.project-card__cta:hover {
  background: var(--color-accent-muted);
  color: var(--color-accent-hover);
  gap: 0.5rem;
}

.project-card__cta-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.15s ease;
}

.project-card__cta:hover .project-card__cta-arrow {
  transform: translateX(2px);
}

/* Slot-provided link (from ProjectsListView) inherits same CTA style */
.project-card__footer :deep(.project-card__link) {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.3125rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  background: transparent;
  border-radius: 8px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.project-card__footer :deep(.project-card__link:hover) {
  background: transparent;
  color: var(--color-accent-hover);
}

.project-card__footer :deep(.project-card__link-arrow) {
  width: 14px;
  height: 14px;
  transition: transform 0.15s ease;
}

.project-card__footer :deep(.project-card__link:hover .project-card__link-arrow) {
  transform: translateX(2px);
}

/* ─── Menu ────────────────────────────────────────────────────── */
.project-card__menu { position: relative; }

.project-card__menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-subtle);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.project-card__menu-trigger:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.project-card__menu-trigger svg { width: 14px; height: 14px; }

.project-card__menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 148px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.08);
  padding: 0.25rem 0;
}

.project-card__menu-actions { display: flex; flex-direction: column; }

.project-card__menu-actions :deep(.project-card-edit),
.project-card__menu-actions :deep(.btn) {
  width: 100%;
  justify-content: flex-start;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.project-card__menu-actions :deep(.project-card-edit svg),
.project-card__menu-actions :deep(.btn svg) { width: 14px; height: 14px; flex-shrink: 0; }

.project-card__menu-actions :deep(.project-card-edit:hover),
.project-card__menu-actions :deep(.btn:not(.btn-danger):hover) { background: var(--color-bg-subtle); }

.project-card__menu-actions :deep(.btn-danger) { color: var(--color-error); }
.project-card__menu-actions :deep(.btn-danger:hover) {
  background: var(--color-error-bg);
  color: var(--color-error);
}
</style>
