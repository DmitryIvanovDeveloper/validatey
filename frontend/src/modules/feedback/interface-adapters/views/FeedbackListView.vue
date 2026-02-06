<template>
  <div class="feedback-list-view">
    <div v-if="loading" class="feedback-list-view__loading">
      <LoadingSpinner />
      <p>Loading feedback…</p>
    </div>
    <div v-else-if="error" class="feedback-list-view__error">
      <ErrorDisplay :error="error" />
    </div>
    <template v-else>
      <div v-if="feedback.length === 0" class="feedback-list-view__empty">
        <div class="feedback-list-view__empty-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="feedback-list-view__empty-text">No feedback yet</p>
        <p class="feedback-list-view__empty-hint">Users can submit feedback via the "Share feedback" widget on app pages.</p>
      </div>
      <ul v-else class="feedback-list-view__list" role="list">
        <li v-for="f in feedback" :key="f.id" class="feedback-card">
          <div class="feedback-card__header">
            <span class="feedback-card__badge" :class="`feedback-card__badge--${f.type}`">
              {{ typeLabel(f.type) }}
            </span>
            <span class="feedback-card__id" :title="f.id">#{{ idShort(f.id) }}</span>
          </div>
          <p class="feedback-card__text">{{ f.text }}</p>
          <div class="feedback-card__meta">
            <span class="feedback-card__meta-item" :title="f.authorEmail ?? f.userId">
              <svg class="feedback-card__meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              {{ authorLabel(f) }}
            </span>
            <span class="feedback-card__meta-item">
              <svg class="feedback-card__meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {{ formatDate(f.createdAt) }}
            </span>
            <a
              v-if="f.screenshotUrl"
              :href="f.screenshotUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="feedback-card__link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              Screenshot
            </a>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';

interface FeedbackRow {
  id: string;
  type: string;
  text: string;
  screenshotUrl: string | null;
  userId: string;
  authorEmail: string | null;
  authorDisplayName: string | null;
  pageUrl: string | null;
  createdAt: string;
}

const feedback = ref<FeedbackRow[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function idShort(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function authorLabel(f: FeedbackRow): string {
  if (f.authorDisplayName?.trim()) return f.authorDisplayName.trim();
  if (f.authorEmail?.trim()) return f.authorEmail.trim();
  return idShort(f.userId);
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    feature_request: 'New feature',
    bug_report: 'Bug report',
    what_is_missing: "What's missing",
    other: 'Other',
  };
  return labels[type] ?? type;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_FEEDBACK}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error.value = data?.error ?? `Error: ${res.status}`;
      return;
    }
    const data = await res.json().catch(() => ({ feedback: [] }));
    feedback.value = Array.isArray(data?.feedback) ? data.feedback : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load feedback';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.feedback-list-view {
  max-width: 100%;
}

.feedback-list-view__loading,
.feedback-list-view__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
}

.feedback-list-view__loading p,
.feedback-list-view__error p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted, #475569);
}

.feedback-list-view__empty {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-bg-elevated, #f8fafc);
  border-radius: 1rem;
  border: 1px dashed var(--color-border, #cbd5e1);
}

.feedback-list-view__empty-icon {
  color: var(--color-text-subtle, #94a3b8);
  margin-bottom: 1rem;
}

.feedback-list-view__empty-text {
  margin: 0 0 0.375rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
}

.feedback-list-view__empty-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

.feedback-list-view__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.feedback-card:hover {
  border-color: var(--color-border, #cbd5e1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.feedback-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feedback-card__badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 2rem;
}

.feedback-card__badge--feature_request {
  color: var(--color-accent-dark, #0f766e);
  background: var(--color-accent-light, #ccfbf1);
}

.feedback-card__badge--bug_report {
  color: #b91c1c;
  background: var(--color-error-bg, #fee2e2);
}

.feedback-card__badge--what_is_missing {
  color: #b45309;
  background: var(--color-warning-bg, #fef3c7);
}

.feedback-card__badge--other {
  color: var(--color-text-muted, #475569);
  background: var(--color-bg-subtle, #e2e8f0);
}

.feedback-card__id {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--color-text-subtle, #94a3b8);
}

.feedback-card__text {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text, #0f172a);
  white-space: pre-wrap;
  word-break: break-word;
}

.feedback-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted, #475569);
}

.feedback-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.feedback-card__meta-icon {
  flex-shrink: 0;
  color: var(--color-text-subtle, #94a3b8);
}

.feedback-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-accent, #0d9488);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}

.feedback-card__link:hover {
  color: var(--color-accent-hover, #0f766e);
}
</style>
