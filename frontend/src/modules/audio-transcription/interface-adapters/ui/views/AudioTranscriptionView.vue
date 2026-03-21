<template>
  <div class="audio-transcription-view">
    <div class="top-nav">
      <Button type="button" variant="ghost" size="sm" @click="goBack">
        Back
      </Button>
    </div>

    <section class="card upload-card">
      <div class="upload-row">
        <div class="upload-field upload-file-field">
          <FileInputField id="audio-file" accept="audio/*" :disabled="loading" @select="onFileSelected" />
        </div>

        <div class="upload-field upload-language-field">
          <select id="lang-optional" v-model="languageHint" class="text-input language-select" :disabled="loading">
            <option value="">Auto-detect</option>
            <option v-for="option in languageOptions" :key="option.code" :value="option.code">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="upload-actions">
          <Button
            type="button"
            variant="primary"
            :loading="loading"
            :disabled="!selectedFile"
            @click="runTranscribe"
          >
            Transcribe
          </Button>
        </div>
      </div>

      <p v-if="listing" class="muted">Refreshing history…</p>
    </section>

    <Modal
      v-model="errorPopupOpen"
      title="Error"
      :closable="true"
      @close="presenter.clearError()"
    >
      <div class="error-popup-message">
        {{ error }}
      </div>
    </Modal>

    <ConfirmDialog
      v-model="confirmDeleteOpen"
      title="Delete from history"
      message="Remove this transcript from history?"
      variant="danger"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />

      <h2 class="section-title">History</h2>
      <div class="history-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          :loading="insightsLoading"
          :disabled="listing || !history.length"
          @click="runInsights"
        >
          Generate AI Summary & Insights
        </Button>
      </div>
      <p v-if="!history.length && !listing" class="muted">No transcripts yet.</p>
      <div v-else class="table-wrap">
        <table class="history-table" aria-label="Transcription history">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-date">Date</th>
              <th class="col-file">Audio file</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, rowIndex) in history"
              :key="item.id"
              :class="{ 'row-selected': detailHistoryId === item.id }"
              @click="openDetail(item.id)"
            >
              <td class="col-index">{{ rowIndex + 1 }}</td>
              <td class="col-date">{{ formatDate(item.createdAt) }}</td>
              <td class="col-file" :title="item.originalFilename || 'Audio file'">
                {{ item.originalFilename || 'Audio file' }}
              </td>
              <td class="col-actions" @click.stop>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="history-delete-btn"
                  :loading="deletingId === item.id"
                  :disabled="deletingId === item.id || loading"
                  aria-label="Delete transcript"
                  @click.stop="requestDelete(item.id)"
                  title="Delete from history"
                >
                  <svg viewBox="0 0 24 24" class="history-delete-icon" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2z" />
                    <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z" />
                    <path d="M10 11v7" />
                    <path d="M14 11v7" />
                  </svg>
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    <section v-if="insights" class="card insights-card">
      <h2 class="section-title">AI Summary & Insights</h2>
      <p class="meta muted">Generated: {{ formatDate(insights.generatedAt) }}</p>

      <div class="insights-block">
        <h3 class="insights-title">Summary</h3>
        <p class="insights-text">{{ insights.summary }}</p>
      </div>

      <div v-if="insights.insights.length" class="insights-block">
        <h3 class="insights-title">Insights</h3>
        <ul class="insights-list">
          <li v-for="(item, idx) in insights.insights" :key="`insight-${idx}`">{{ item }}</li>
        </ul>
      </div>

      <div v-if="insights.themes.length" class="insights-block">
        <h3 class="insights-title">Themes</h3>
        <ul class="insights-list">
          <li v-for="(item, idx) in insights.themes" :key="`theme-${idx}`">{{ item }}</li>
        </ul>
      </div>

      <div v-if="insights.risks.length" class="insights-block">
        <h3 class="insights-title">Risks</h3>
        <ul class="insights-list">
          <li v-for="(item, idx) in insights.risks" :key="`risk-${idx}`">{{ item }}</li>
        </ul>
      </div>

      <div v-if="insights.nextActions.length" class="insights-block">
        <h3 class="insights-title">Next actions</h3>
        <ul class="insights-list">
          <li v-for="(item, idx) in insights.nextActions" :key="`action-${idx}`">{{ item }}</li>
        </ul>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="slide-panel">
        <div v-if="detailHistoryId" class="detail-overlay" @click.self="closeDetail">
          <div class="detail-panel comments-panel">
            <div class="detail-header">
              <h3>Transcript details</h3>
              <button type="button" class="btn-close" aria-label="Close" @click="closeDetail">
                <svg viewBox="0 0 24 24" class="close-icon">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div v-if="detailHistoryItem" class="detail-body">
              <section class="detail-section">
                <h4>File</h4>
                <p class="detail-meta">{{ detailHistoryItem.originalFilename || 'Audio file' }}</p>
                <p class="detail-meta">Created: {{ formatDate(detailHistoryItem.createdAt) }}</p>
              </section>
              <section class="detail-section">
                <h4>Full transcript</h4>
                <p class="detail-transcript">{{ detailHistoryItem.transcript }}</p>
              </section>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import { AudioTranscriptionPresenter } from '../../presenters/audio-transcription.presenter';
import type {
  ProjectTranscriptionEntity,
  TranscribeApiResponse,
  TranscriptionInsightsData,
} from '../../../domain/entities/project-transcription.entity';
import Modal from '@/shared/components/Modal.vue';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import Button from '@/shared/components/atoms/Button.vue';
import FileInputField from '@/shared/components/inputs/FileInputField.vue';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.projectId as string);
const workspaceId = computed(() => route.params.workspaceId as string | undefined);
const presenter = container.get<AudioTranscriptionPresenter>(TYPES.AudioTranscriptionPresenter);

const selectedFile = ref<File | null>(null);
const languageHint = ref('');
const languageOptions = [
  { code: 'en', label: 'English (en)' },
  { code: 'ru', label: 'Russian (ru)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'de', label: 'German (de)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'it', label: 'Italian (it)' },
  { code: 'pt', label: 'Portuguese (pt)' },
  { code: 'tr', label: 'Turkish (tr)' },
  { code: 'pl', label: 'Polish (pl)' },
  { code: 'uk', label: 'Ukrainian (uk)' },
];

const loading = computed(() => presenter.loading.value);
const listing = computed(() => presenter.listing.value);
const error = computed(() => presenter.error.value);
const lastResult = computed<TranscribeApiResponse | null>(() => presenter.lastResult.value);
const history = computed(() => presenter.history.value);
const deletingId = computed(() => presenter.deletingId.value);
const insightsLoading = computed(() => presenter.insightsLoading.value);
const insights = computed<TranscriptionInsightsData | null>(() => presenter.insights.value);

const errorPopupOpen = ref(false);
watch(error, (val) => {
  errorPopupOpen.value = Boolean(val);
});

const confirmDeleteOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);
const detailHistoryId = ref<string | null>(null);
const detailHistoryItem = computed<ProjectTranscriptionEntity | null>(() => {
  if (!detailHistoryId.value) return null;
  return history.value.find((item) => item.id === detailHistoryId.value) ?? null;
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US');
  } catch {
    return iso;
  }
}

function onFileSelected(file: File | null): void {
  selectedFile.value = file;
}

function goBack(): void {
  if (workspaceId.value && projectId.value) {
    router.push(`/workspaces/${workspaceId.value}/projects/${projectId.value}`);
    return;
  }
  router.back();
}

async function runTranscribe(): Promise<void> {
  const f = selectedFile.value;
  if (!f) return;
  await presenter.transcribe(projectId.value, f, languageHint.value || undefined);
}

async function runInsights(): Promise<void> {
  await presenter.generateInsights(projectId.value);
}

function requestDelete(transcriptionId: string): void {
  pendingDeleteId.value = transcriptionId;
  confirmDeleteOpen.value = true;
}

function openDetail(transcriptionId: string): void {
  detailHistoryId.value = transcriptionId;
}

function closeDetail(): void {
  detailHistoryId.value = null;
}

async function handleConfirmDelete(): Promise<void> {
  const id = pendingDeleteId.value;
  if (!id) return;
  pendingDeleteId.value = null;
  if (detailHistoryId.value === id) {
    closeDetail();
  }
  await presenter.deleteTranscription(projectId.value, id);
}

function handleCancelDelete(): void {
  pendingDeleteId.value = null;
}

onMounted(() => {
  void presenter.loadHistory(projectId.value);
});
</script>

<style scoped>
.audio-transcription-view {
  margin: 0 auto;
}

.top-nav {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.view-header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.5rem;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted, #64748b);
  font-size: 0.9375rem;
}

.card {
  background: transparent;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.card.upload-card {
  background: transparent;
}

.upload-row {
  display: flex;
  align-items: flex-end;
  gap: 0.9rem;
  flex-wrap: nowrap;
}

.upload-field {
  min-width: 0;
}

.upload-file-field {
  flex: 1 1 auto;
}

.upload-language-field {
  flex: 0 0 12.5rem;
}

.upload-actions {
  flex: 0 0 auto;
}

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text, #334155);
  margin-bottom: 0.35rem;
}

.file-input,
.text-input {
  width: 100%;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  background: transparent;
}

.file-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-input {
  display: none !important;
  background: transparent;
}

.file-name {
  min-width: 0;
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
}

.language-select {
  margin-bottom: 0;
  min-height: 2.25rem;
  background: transparent;
}

#lang-optional {
  background: transparent;
}

:deep(.file-choose-btn) {
  background: transparent;
}

:deep(.file-choose-btn:hover:not(.btn-disabled)) {
  background: transparent;
}

.error-popup-message {
  color: var(--color-error, #b91c1c);
  font-size: 0.925rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.modal-container) {
  background: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
}

:deep(.modal-header) {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

:deep(.modal-title) {
  color: var(--color-text, #0f172a);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.meta {
  font-size: 0.8125rem;
  margin: 0 0 0.5rem;
}

.muted {
  color: var(--color-text-muted, #64748b);
  font-size: 0.875rem;
}

.transcript-area {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border, #e2e8f0);
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
}

.history-actions {
  margin-bottom: 0.75rem;
}

.history-filename-inline {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text, #334155);
}

.table-wrap {
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.875rem;
}

.history-table th,
.history-table td {
  padding: 0.75rem 0.85rem;
  text-align: left;
  vertical-align: middle;
}

.history-table thead {
  background: var(--color-bg-subtle, #f8fafc);
}

.history-table th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.history-table tbody tr {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  transition: background-color 0.12s ease;
  cursor: pointer;
}

.history-table tbody tr:last-child {
  border-bottom: none;
}

.history-table tbody tr:hover {
  background: var(--color-bg-subtle, #f8fafc);
}

tr.row-selected {
  background: rgba(13, 148, 136, 0.08);
}

tr.row-selected:hover {
  background: rgba(13, 148, 136, 0.12);
}

.col-index {
  width: 3.2rem;
  color: var(--color-text-muted, #64748b);
}

.col-date {
  width: 11.5rem;
  color: var(--color-text-muted, #64748b);
  font-variant-numeric: tabular-nums;
}

.col-file {
  color: var(--color-text, #334155);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-actions {
  width: 7.5rem;
}

:deep(.history-delete-btn) {
  min-width: auto;
  padding: 0.2rem;
  border: none;
  background: transparent;
  color: var(--color-error, #ef4444);
  border-radius: 6px;
}

:deep(.history-delete-btn:hover:not(.btn-disabled)) {
  background: transparent;
  color: var(--color-error-hover, #dc2626);
}

:deep(.history-delete-btn:focus-visible) {
  outline: 2px solid rgba(239, 68, 68, 0.35);
  outline-offset: 2px;
}

:deep(.history-delete-icon) {
  width: 0.95rem;
  height: 0.95rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.insights-card {
  background: transparent;
}

.insights-block {
  margin-bottom: 1rem;
}

.insights-block:last-child {
  margin-bottom: 0;
}

.insights-title {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}

.insights-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-text, #334155);
  white-space: pre-wrap;
  word-break: break-word;
}

.insights-list {
  margin: 0;
  padding-left: 1rem;
  color: var(--color-text, #334155);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Detail panel — slide-over */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
}

.detail-panel {
  background: var(--color-bg);
  width: 100%;
  max-width: 500px;
  height: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.comments-panel {
  max-width: 500px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.detail-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  fill: none;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}

.detail-transcript {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  background: var(--color-bg-subtle, #f8fafc);
  font-size: 0.875rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-meta {
  margin: 0.2rem 0;
  color: var(--color-text-muted, #64748b);
  font-size: 0.85rem;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-active .detail-panel,
.slide-panel-leave-active .detail-panel {
  transition: transform 0.22s ease;
}

.slide-panel-enter-from .detail-panel,
.slide-panel-leave-to .detail-panel {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .upload-row {
    flex-direction: column;
    align-items: stretch;
  }

  .upload-file-field,
  .upload-language-field,
  .upload-actions {
    flex: 1 1 auto;
    width: 100%;
  }

  .upload-actions :deep(.btn) {
    width: 100%;
  }

  .detail-overlay {
    padding: 0.5rem;
  }

  .detail-panel,
  .comments-panel {
    max-width: none;
  }
}

</style>
