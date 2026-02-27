<template>
  <!-- ── Col 1: Project identity (name + hypothesis) ── -->
  <td ref="firstCell" class="ptable__cell ptable__cell--project" @click="emit('open')">
    <span class="ptable__name">{{ project.name }}</span>
    <span v-if="hypothesisText" class="ptable__hypothesis">{{ hypothesisText }}</span>
  </td>

  <!-- ── Col 2: Status + AI verdict ── -->
  <td class="ptable__cell ptable__cell--status">
    <div class="ptable__status-stack">
      <span
        v-if="project.status !== 'draft'"
        :class="['ptable__status-badge', `ptable__status-badge--${project.status}`]"
      >
        <span class="ptable__status-dot" aria-hidden="true" />
        {{ statusLabel }}
      </span>
      <HypothesisStatusWidget
        v-if="isVisible"
        :project-id="project.id"
        class="ptable__verdict"
      />
    </div>
  </td>

  <!-- ── Col 3: Responses progress ── -->
  <td class="ptable__cell ptable__cell--responses">
    <ResponsesWidget v-if="isVisible" :project-id="project.id" />
    <div v-else class="ptable__skeleton ptable__skeleton--responses" />
  </td>

  <!-- ── Col 4: Assumption statuses ── -->
  <td class="ptable__cell ptable__cell--assumptions">
    <AssumptionsWidget v-if="isVisible" :project-id="project.id" />
    <div v-else class="ptable__skeleton ptable__skeleton--bar" />
  </td>

  <!-- ── Col 5: Social signals ── -->
  <td class="ptable__cell ptable__cell--social">
    <CommentsWidgetCompact v-if="isVisible" :project-id="project.id" />
    <div v-else class="ptable__skeleton ptable__skeleton--number" />
  </td>

  <!-- ── Col 6: Created date ── -->
  <td class="ptable__cell ptable__cell--date">
    <span class="ptable__date">{{ formattedDate }}</span>
  </td>

  <!-- ── Col 7: Actions ── -->
  <td class="ptable__cell ptable__cell--actions" @click.stop>
    <div :class="['ptable__actions', { 'ptable__actions--visible': isHovered }]">
      <button
        type="button"
        class="ptable__action-btn ptable__action-btn--edit"
        :aria-label="`Edit ${project.name}`"
        title="Edit"
        @click.stop="emit('edit')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        type="button"
        class="ptable__action-btn ptable__action-btn--open"
        :aria-label="`Open ${project.name}`"
        @click.stop="emit('open')"
      >
        Open
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <button
        type="button"
        class="ptable__action-btn ptable__action-btn--delete"
        :disabled="deleting"
        :aria-label="`Delete ${project.name}`"
        title="Delete"
        @click.stop="emit('delete')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
          <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  </td>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { Project, ProjectStatus } from '../../../domain/entities/project.entity';
import AssumptionsWidget from '../../../../research/interface-adapters/components/AssumptionsWidget.vue';
import CommentsWidgetCompact from '../../../../comments/interface-adapters/ui/components/CommentsWidgetCompact.vue';
import ResponsesWidget from '../../../../overview/interface-adapters/components/ResponsesWidget.vue';
import { HypothesisStatusWidget } from '../../../../research/interface-adapters';

const props = defineProps<{
  project: Project;
  deleting?: boolean;
}>();

const emit = defineEmits<{
  open: [];
  edit: [];
  delete: [];
}>();

// ── Refs & state ───────────────────────────────────────────────
const firstCell = ref<HTMLElement>();
const isVisible = ref(false);
const isHovered = ref(false);
let observer: IntersectionObserver | null = null;

function setupObserver() {
  const row = firstCell.value?.parentElement;
  if (!row) return;

  // Lazy-load widgets when row enters viewport
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !isVisible.value) {
        isVisible.value = true;
        observer?.disconnect();
      }
    },
    { threshold: 0.05, rootMargin: '80px' }
  );
  observer.observe(row);

  // Track row hover to show/hide action buttons
  row.addEventListener('mouseenter', () => { isHovered.value = true; });
  row.addEventListener('mouseleave', () => { isHovered.value = false; });
}

onMounted(() => nextTick(() => setupObserver()));
onUnmounted(() => {
  observer?.disconnect();
  // Listeners are on the <tr> which is removed from DOM — no manual cleanup needed
});

// ── Computed ───────────────────────────────────────────────────
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
/* ── Cell base ─────────────────────────────────────────────── */
.ptable__cell {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

/* ── Col 1: Project ─────────────────────────────────────────── */
.ptable__cell--project {
  cursor: pointer;
}

.ptable__name {
  display: block;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptable__hypothesis {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Col 2: Status stack ────────────────────────────────────── */
.ptable__status-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

/* Status badge */
.ptable__status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.1875rem 0.5625rem 0.1875rem 0.4375rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.ptable__status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ptable__status-badge--draft        { background: var(--color-bg-subtle); color: var(--color-text-subtle); }
.ptable__status-badge--draft .ptable__status-dot { background: #94a3b8; }

.ptable__status-badge--in-progress  { background: var(--color-accent-light); color: var(--color-accent-hover); }
.ptable__status-badge--in-progress .ptable__status-dot {
  background: var(--color-accent);
  animation: pulse-dot 2s ease-in-out infinite;
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
}

.ptable__status-badge--completed    { background: var(--color-success-bg); color: var(--color-success); }
.ptable__status-badge--completed .ptable__status-dot { background: var(--color-success); }

.ptable__status-badge--archived     { background: var(--color-bg-subtle); color: var(--color-text-subtle); }
.ptable__status-badge--archived .ptable__status-dot { background: #94a3b8; }

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2); }
  50%       { box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.08); }
}

/* AI verdict badge (HypothesisStatusWidget) */
.ptable__verdict :deep(.hypothesis-status-badge) {
  font-size: 0.625rem;
  padding: 0.125rem 0.4375rem;
  border-radius: 9999px;
}

/* ── Col 3: Responses ───────────────────────────────────────── */
.ptable__cell--responses :deep(.responses-widget) { display: block; }

.ptable__cell--responses :deep(.widget-content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.ptable__cell--responses :deep(.widget-label) { display: none; }

.ptable__cell--responses :deep(.widget-value) {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.ptable__cell--responses :deep(.widget-rate) {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

/* ── Col 4: Assumptions ─────────────────────────────────────── */
.ptable__cell--assumptions :deep(.assumptions-widget) { display: block; }

.ptable__cell--assumptions :deep(.widget-content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.ptable__cell--assumptions :deep(.widget-label) { display: none; }

.ptable__cell--assumptions :deep(.widget-value) {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

/* Show horizontal status bar in table */
.ptable__cell--assumptions :deep(.widget-status-bar) {
  display: flex;
  width: 80px;
  margin-top: 0.25rem;
}

/* Show micro counts in table */
.ptable__cell--assumptions :deep(.widget-status-counts) {
  display: flex;
  margin-top: 0.1875rem;
}

/* Hide donut in table */
.ptable__cell--assumptions :deep(.widget-chart-container) { display: none; }

/* ── Col 5: Social ──────────────────────────────────────────── */
.ptable__cell--social :deep(.comments-widget-compact) { display: block; }

.ptable__cell--social :deep(.widget-content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.ptable__cell--social :deep(.widget-label) {
  font-size: 0.625rem;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.ptable__cell--social :deep(.widget-value) {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

/* ── Col 6: Date ────────────────────────────────────────────── */
.ptable__date {
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
}

/* ── Col 7: Actions ─────────────────────────────────────────── */
.ptable__cell--actions {}

.ptable__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.ptable__actions--visible,
.ptable__actions:focus-within {
  opacity: 1;
}

.ptable__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.ptable__action-btn svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.ptable__action-btn--edit {
  padding: 0.3125rem;
  background: transparent;
  color: var(--color-text-muted);
}

.ptable__action-btn--edit:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.ptable__action-btn--open {
  padding: 0.3125rem 0.625rem;
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.ptable__action-btn--open:hover {
  background: var(--color-accent-muted);
  color: var(--color-accent-hover);
}

.ptable__action-btn--open svg {
  width: 12px;
  height: 12px;
  transition: transform 0.15s ease;
}

.ptable__action-btn--open:hover svg { transform: translateX(2px); }

.ptable__action-btn--delete {
  padding: 0.3125rem;
  background: transparent;
  color: var(--color-text-subtle);
}

.ptable__action-btn--delete:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.ptable__action-btn--delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Skeletons ──────────────────────────────────────────────── */
.ptable__skeleton {
  border-radius: 4px;
  background: var(--color-bg-subtle);
  animation: shimmer 1.6s ease-in-out infinite;
}

.ptable__skeleton--responses {
  height: 32px;
  width: 64px;
}

.ptable__skeleton--bar {
  height: 28px;
  width: 80px;
}

.ptable__skeleton--number {
  height: 20px;
  width: 32px;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
</style>
