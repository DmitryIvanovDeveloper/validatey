<template>
  <div class="responses-table-view">
    <div class="view-header">
      <h2 class="view-title">Responses</h2>
      <p class="view-desc">Raw answers by respondent. Click a cell to see full details.</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-filters">
        <input
          v-model="searchText"
          type="search"
          class="input-search"
          placeholder="Search in answers..."
          aria-label="Search responses"
        />
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-export btn-sm" :disabled="exportLoading" @click="exportResponses('json')">
          {{ exportLoading ? 'Exporting…' : 'Export JSON' }}
        </button>
        <button type="button" class="btn btn-export btn-sm" :disabled="exportLoading" @click="exportResponses('csv')">
          Export CSV
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading responses...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
    </div>
    <template v-else>
      <div class="table-wrap">
        <table class="responses-table" aria-label="Responses by respondent and question">
          <thead>
            <tr>
              <th class="col-respondent">#</th>
              <th v-for="qId in questionIds" :key="qId" class="col-question" :title="getQuestionLabel(qId)">
                {{ truncate(getQuestionLabel(qId), 28) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(response, rowIndex) in paginatedResponses"
              :key="response.id"
              :class="{ 'row-selected': detailResponseId === response.id }"
            >
              <td class="col-respondent">
                <button type="button" class="btn-cell" @click="openDetail(response.id)">
                  #{{ (currentPage - 1) * pageSize + rowIndex + 1 }}
                </button>
              </td>
              <td
                v-for="qId in questionIds"
                :key="qId"
                class="col-answer"
                @click="openDetail(response.id)"
              >
                <span class="cell-text">{{ formatCell(response.answers[qId]) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredResponses.length === 0" class="empty-state">
        <p v-if="searchText">No responses match your search.</p>
        <p v-else>No responses yet. Send invitations to collect answers.</p>
      </div>
      <div v-else class="pagination-bar">
        <span class="pagination-info">
          {{ filteredResponses.length }} response(s)
          <template v-if="totalPages > 1">
            · Page {{ currentPage }} of {{ totalPages }}
          </template>
        </span>
        <div v-if="totalPages > 1" class="pagination-controls">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="currentPage = Math.max(1, currentPage - 1)">
            Previous
          </button>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage >= totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </template>

    <!-- Detail panel -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div v-if="detailResponseId" class="detail-overlay" @click.self="closeDetail">
          <div class="detail-panel">
            <div class="detail-header">
              <h3>Response details</h3>
              <button type="button" class="btn-close" aria-label="Close" @click="closeDetail">×</button>
            </div>
            <div v-if="detailResponse" class="detail-body">
              <section class="detail-section">
                <h4>All answers</h4>
                <dl class="detail-answers">
                  <template v-for="qId in questionIds" :key="qId">
                    <dt>{{ getQuestionLabel(qId, detailResponse) }}</dt>
                    <dd>{{ formatAnswerFull(detailResponse.answers[qId]) }}</dd>
                  </template>
                </dl>
              </section>
              <section v-if="detailResponse.transcript" class="detail-section">
                <h4>Transcript</h4>
                <p class="detail-transcript">{{ detailResponse.transcript }}</p>
              </section>
              <section class="detail-section">
                <h4>Metadata</h4>
                <p class="detail-meta">Response ID: {{ detailResponse.id }}</p>
                <p class="detail-meta">Submitted: {{ formatDate(detailResponse.createdAt) }}</p>
                <p class="detail-meta text-muted">Tags and notes — coming soon</p>
              </section>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ResponsePresenter, ResponseListItem } from '../presenters/response.presenter';

const route = useRoute();
const projectId = route.params.projectId as string;
const responsePresenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

const loading = ref(true);
const error = ref<string | null>(null);
const responses = ref<ResponseListItem[]>([]);
const questionLabels = ref<Record<string, string>>({});
const searchText = ref('');
const exportLoading = ref(false);
const detailResponseId = ref<string | null>(null);
const pageSize = 20;
const currentPage = ref(1);

const questionIds = computed(() => {
  const ids = new Set<string>();
  responses.value.forEach((r) => Object.keys(r.answers || {}).forEach((k) => ids.add(k)));
  const arr = Array.from(ids);
  const numeric = arr.filter((id) => /^q_?\d+$/i.test(id));
  const rest = arr.filter((id) => !/^q_?\d+$/i.test(id));
  numeric.sort((a, b) => {
    const n = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
    return n(a) - n(b);
  });
  return [...numeric, ...rest];
});

const filteredResponses = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return responses.value;
  return responses.value.filter((r) => {
    const text = [
      ...Object.values(r.answers || {}).map((v) => (typeof v === 'string' ? v : JSON.stringify(v))),
      r.transcript || '',
    ].join(' ').toLowerCase();
    return text.includes(q);
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredResponses.value.length / pageSize)));

const paginatedResponses = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredResponses.value.slice(start, start + pageSize);
});

const detailResponse = computed(() =>
  detailResponseId.value ? responses.value.find((r) => r.id === detailResponseId.value) ?? null : null
);

watch(searchText, () => { currentPage.value = 1; });
watch(totalPages, (n) => { if (currentPage.value > n) currentPage.value = Math.max(1, n); });

function parseQuestionsFromScenario(content: string): Record<string, string> {
  const labels: Record<string, string> = {};
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    const questions = data?.questions ?? [];
    (questions as Array<{ id?: string; text?: string }>).forEach((q: { id?: string; text?: string }, i: number) => {
      const text = (q.text || q.id || `Q${i + 1}`).slice(0, 120);
      const id = (q.id && q.id.trim()) || `q_${i + 1}`;
      labels[id] = text;
      const alt = id.startsWith('q_') ? id.replace('q_', 'q') : `q_${id.replace(/^q/, '')}`;
      if (alt !== id) labels[alt] = text;
    });
  } catch {
    // ignore
  }
  return labels;
}

function getQuestionLabel(questionId: string, response?: ResponseListItem): string {
  // Сначала проверяем questionLabels в конкретном response
  if (response?.questionLabels?.[questionId]) {
    return response.questionLabels[questionId];
  }

  // Альтернативные варианты ID для response
  const altResponse = questionId.startsWith('q_') ? questionId.replace('q_', 'q') : `q_${questionId.replace(/^q/, '')}`;
  if (response?.questionLabels?.[altResponse]) {
    return response.questionLabels[altResponse];
  }

  // Fallback к глобальным labels (для обратной совместимости)
  const labels = questionLabels.value;
  if (labels[questionId]) return labels[questionId];
  if (labels[altResponse]) return labels[altResponse];

  // Последний fallback
  const match = questionId.match(/^q_?(\d+)$/i);
  return match ? `Question ${match[1]}` : questionId;
}

function formatCell(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value.length > 80 ? value.slice(0, 80) + '…' : value;
  if (Array.isArray(value)) return value.join(', ').slice(0, 80) + (value.join(', ').length > 80 ? '…' : '');
  if (typeof value === 'object' && value !== null && 'text' in value) return String((value as { text: string }).text).slice(0, 80);
  const s = JSON.stringify(value);
  return s.length > 80 ? s.slice(0, 80) + '…' : s;
}

function formatAnswerFull(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null && 'text' in value) return String((value as { text: string }).text);
  return JSON.stringify(value, null, 2);
}

function truncate(s: string, max: number): string {
  if (!s || s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function formatDate(date: Date): string {
  if (!date) return '—';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function openDetail(id: string) {
  detailResponseId.value = id;
}

function closeDetail() {
  detailResponseId.value = null;
}

async function exportResponses(format: 'json' | 'csv') {
  if (exportLoading.value) return;
  try {
    exportLoading.value = true;
    const result = await responsePresenter.exportResponses(projectId, format);
    if (result.error) {
      error.value = result.error;
      return;
    }

    const filename = `responses-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    const url = URL.createObjectURL(result.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Export failed';
  } finally {
    exportLoading.value = false;
  }
}

async function loadResponses() {
  if (!projectId) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await responsePresenter.getResponses(projectId);
    if (result.error) {
      error.value = result.error;
      responses.value = [];
    } else {
      responses.value = result.responses;

      // Extract question labels from the first response (all responses should have the same labels)
      if (responses.value.length > 0 && responses.value[0].questionLabels) {
        questionLabels.value = { ...responses.value[0].questionLabels };
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load responses';
    responses.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadResponses();
});
</script>

<style scoped>
.responses-table-view {
  padding: 0 0 2rem;
  --resp-radius: 12px;
  --resp-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  --resp-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.view-header {
  margin-bottom: 1.5rem;
}
.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.35rem 0;
  color: var(--color-text);
}
.view-desc {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.45;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--resp-radius);
  box-shadow: var(--resp-shadow);
}
.toolbar-filters {
  flex: 1;
  min-width: 200px;
}
.input-search {
  width: 100%;
  max-width: 320px;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input-search::placeholder {
  color: var(--color-text-muted);
  opacity: 0.9;
}
.input-search:hover {
  border-color: var(--color-border, #cbd5e1);
}
.input-search:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}
.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state,
.error-state {
  padding: 2.5rem;
  text-align: center;
  background: var(--color-bg);
  border-radius: var(--resp-radius);
  border: 1px solid var(--color-border-light);
}
.loading-state p,
.error-state .error-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
.error-text {
  color: var(--color-error, #b91c1c);
}

.table-wrap {
  overflow-x: auto;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--resp-radius);
  box-shadow: var(--resp-shadow);
  margin-bottom: 1rem;
}
.responses-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.responses-table th,
.responses-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  vertical-align: top;
}
.responses-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
.responses-table th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle, #f8fafc);
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}
.responses-table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.12s ease;
}
.responses-table tbody tr:last-child {
  border-bottom: none;
}
.responses-table tbody tr:hover {
  background: var(--color-bg-subtle, #f8fafc);
}
.responses-table td {
  max-width: 260px;
}
.col-respondent {
  width: 4rem;
  font-variant-numeric: tabular-nums;
}
.cell-text {
  display: block;
  max-height: 3.2em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  color: var(--color-text);
}
.btn-cell {
  background: none;
  border: none;
  padding: 0.25rem 0;
  font: inherit;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-accent, #0d9488);
  cursor: pointer;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}
.btn-cell:hover {
  color: var(--color-accent-hover, #0f766e);
  background: rgba(13, 148, 136, 0.08);
}
tr.row-selected {
  background: rgba(13, 148, 136, 0.06);
}
tr.row-selected:hover {
  background: rgba(13, 148, 136, 0.1);
}
.col-answer {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.empty-state {
  padding: 2.5rem 1.5rem;
  text-align: center;
  background: var(--color-bg);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--resp-radius);
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
.empty-state p {
  margin: 0;
}

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.pagination-info {
  font-variant-numeric: tabular-nums;
}
.pagination-controls {
  display: flex;
  gap: 0.5rem;
}
.pagination-controls .btn {
  min-width: 5rem;
}

/* Detail panel — modern slide-over */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: overlay-in 0.2s ease;
}
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.detail-panel {
  width: 100%;
  max-width: 440px;
  background: var(--color-bg);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-radius: var(--resp-radius) 0 0 var(--resp-radius);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
  flex-shrink: 0;
}
.detail-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
}
.btn-close {
  background: var(--color-bg-subtle, #f1f5f9);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.btn-close:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}
.detail-body {
  padding: 1.25rem 1.5rem;
  flex: 1;
}
.detail-section {
  margin-bottom: 1.5rem;
}
.detail-section:last-child {
  margin-bottom: 0;
}
.detail-section h4 {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}
.detail-answers {
  margin: 0;
}
.detail-answers dt {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text);
  margin-top: 0.75rem;
  padding-bottom: 0.2rem;
}
.detail-answers dt:first-of-type {
  margin-top: 0;
}
.detail-answers dd {
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
}
.detail-transcript {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: 8px;
  white-space: pre-wrap;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
}
.detail-meta {
  margin: 0.35rem 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.text-muted {
  color: var(--color-text-muted);
  font-style: italic;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.25s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}
.slide-panel-enter-active .detail-panel,
.slide-panel-leave-active .detail-panel {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-panel-enter-from .detail-panel,
.slide-panel-leave-to .detail-panel {
  transform: translateX(100%);
}
</style>