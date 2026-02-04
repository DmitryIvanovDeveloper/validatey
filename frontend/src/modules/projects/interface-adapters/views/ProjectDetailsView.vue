<template>
  <div class="project-details-view">
    <header class="page-header" v-if="project">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ project.name }}</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">{{ project.name }}</h1>
        <div class="header-actions">
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">Manage Invitations</router-link>
          <router-link :to="`/projects/${projectId}/progress`" class="btn btn-secondary">Progress</router-link>
          <router-link :to="`/projects/${projectId}/report`" class="btn btn-primary">Report</router-link>
        </div>
      </div>
    </header>

    <div v-if="viewModel.loading.value" class="loading-state">
      <LoadingSpinner />
      <p>Loading project...</p>
    </div>

    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>

    <div v-else-if="project" class="details-content">
      <p v-if="formatError" class="format-error">{{ formatError }}</p>
      <Card :title="project.name" class="project-card">
        <div class="project-info">
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span :class="['status-badge', `status-${project.status}`]">
              {{ getStatusLabel(project.status) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Created:</span>
            <span>{{ formatDate(project.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Updated:</span>
            <span>{{ formatDate(project.updatedAt) }}</span>
          </div>
        </div>
      </Card>

      <Card class="segment-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Segment</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.segment?.description?.trim() || project.segment.description === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatSegmentDescription"
            >
              {{ formatLoadingKey === 'segment-description' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <p class="formatted-text">{{ project.segment?.description || 'Not specified' }}</p>
        </div>
      </Card>

      <Card class="demographics-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Demographics</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!getSegmentDemographicsText().trim() || getSegmentDemographicsText() === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatSegmentDemographics"
            >
              {{ formatLoadingKey === 'segment-demographics' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <p v-if="project.segment?.demographics" class="formatted-text">
            <template v-if="typeof project.segment.demographics === 'string'">
              {{ project.segment.demographics }}
            </template>
            <template v-else>
              <template v-for="(value, key) in project.segment.demographics" :key="key">
                <strong>{{ key }}:</strong> {{ value }}<br />
              </template>
            </template>
          </p>
          <p v-else>Not specified</p>
        </div>
      </Card>

      <Card class="market-context-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Market Picture</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.marketContext?.marketPicture?.trim() || project.marketContext.marketPicture === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatMarketPicture"
            >
              {{ formatLoadingKey === 'market-picture' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <p class="formatted-text">{{ project.marketContext?.marketPicture || 'Not specified' }}</p>
        </div>
      </Card>

      <Card class="market-context-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Market Fit</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.marketContext?.marketFit?.trim() || project.marketContext.marketFit === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatMarketFit"
            >
              {{ formatLoadingKey === 'market-fit' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <p class="formatted-text">{{ project.marketContext?.marketFit || 'Not specified' }}</p>
        </div>
      </Card>

      <Card class="market-context-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Differentiation</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.marketContext?.differentiation?.trim() || project.marketContext.differentiation === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatDifferentiation"
            >
              {{ formatLoadingKey === 'differentiation' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <p class="formatted-text">{{ project.marketContext?.differentiation || 'Not specified' }}</p>
        </div>
      </Card>

      <Card class="hypothesis-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Hypothesis</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.hypothesis?.description?.trim() || project.hypothesis.description === 'Not specified' || formatLoadingKey !== null"
              @click="onFormatHypothesisDescription"
            >
              {{ formatLoadingKey === 'hypothesis-description' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="hypothesis-content">
          <div class="content-item">
            <h4>Description</h4>
            <p class="formatted-text">{{ project.hypothesis?.description || 'Not specified' }}</p>
          </div>
        </div>
      </Card>

      <Card v-if="project.hypothesis?.assumptions?.length" class="hypothesis-card assumptions-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Assumptions</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!project.hypothesis?.assumptions?.length || formatLoadingKey !== null"
              @click="onFormatHypothesisAssumptions"
            >
              {{ formatLoadingKey === 'hypothesis-assumptions' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <div class="segment-content">
          <ul class="assumptions-list">
            <li v-for="(assumption, index) in project.hypothesis.assumptions" :key="index" class="formatted-text">
              {{ assumption }}
            </li>
          </ul>
        </div>
      </Card>

      <Card v-if="scenarioLoading" title="Scenario" class="scenario-card">
        <p class="scenario-loading">Loading scenario...</p>
      </Card>
      <Card v-else-if="scenarioContent" class="scenario-card">
        <template #header>
          <div class="card-header-row">
            <h3 class="card-title">Scenario</h3>
            <button
              type="button"
              class="btn btn-format"
              :disabled="!scenarioContent?.trim() || !scenarioId || formatLoadingKey !== null"
              @click="onFormatScenario"
            >
              {{ formatLoadingKey === 'scenario' ? 'Formatting…' : 'AI-Format' }}
            </button>
          </div>
        </template>
        <ScenarioViewer :content="scenarioContent" />
      </Card>
      <Card v-else-if="scenarioError" title="Scenario" class="scenario-card">
        <p class="scenario-error">{{ scenarioError }}</p>
      </Card>
      <Card v-else title="Scenario" class="scenario-card">
        <p class="scenario-empty">No scenario generated yet. Create the project via the wizard to generate one.</p>
      </Card>

      <Card title="Audience" class="audience-card">
        <p class="audience-description">Manage your target audience and send invitations from the Invitations page.</p>
        <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">Manage Invitations</router-link>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import ScenarioViewer from './components/ScenarioViewer.vue';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '@/infrastructure/bootstrap/types';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import type { ScenarioRepositoryPort } from '../../../scenarios/application/ports/scenario-repository.port';
import type { HttpClientPort } from '@/infrastructure/http/ports/http-client.port';
import { ProjectStatus } from '../../domain/entities/project.entity';
import { API_CONFIG } from '@/infrastructure/config/api.config';

const route = useRoute();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const scenarioRepository = container.get<ScenarioRepositoryPort>(SCENARIO_TYPES.ScenarioRepository);
const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const scenarioContent = ref<string>('');
const scenarioId = ref<string | null>(null);
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);

const formatLoadingKey = ref<string | null>(null);
const formatError = ref<string | null>(null);

const project = computed(() => {
  return viewModel.project.value;
});

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    'in-progress': 'In progress',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

async function loadScenario() {
  if (!projectId) return;
  scenarioLoading.value = true;
  scenarioError.value = null;
  scenarioContent.value = '';
  scenarioId.value = null;
  const result = await scenarioRepository.getLatestByProjectId(projectId);
  scenarioLoading.value = false;
  if (result.isSuccess) {
    scenarioContent.value = result.data.content;
    scenarioId.value = result.data.id;
    scenarioError.value = null;
  } else {
    // 404 / not found = no scenario yet → show empty state, not error
    const isNotFound =
      result.error.name === 'ScenarioNotFoundError' ||
      (result.error.message && result.error.message.includes('No scenario found'));
    scenarioContent.value = '';
    scenarioError.value = isNotFound ? null : result.error.message;
  }
}

async function callFormatText(text: string): Promise<string | null> {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  try {
    const res = await httpClient.post<{ formatted: string }>(
      API_CONFIG.ENDPOINTS.AI_FORMAT_TEXT,
      { text: trimmed }
    );
    return res?.formatted != null ? String(res.formatted).trim() : null;
  } catch {
    return null;
  }
}

function getSegmentDemographicsText(): string {
  const p = project.value;
  if (!p?.segment?.demographics) return '';
  const d = p.segment.demographics;
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

async function onFormatSegmentDescription() {
  const p = project.value;
  const text = p?.segment?.description?.trim() || '';
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'segment-description';
  formatError.value = null;
  const formatted = await callFormatText(text);
  if (formatted != null) {
    const result = await presenter.updateProject(
      projectId,
      undefined,
      formatted,
      p?.segment?.demographics,
      undefined,
      undefined,
      undefined,
      undefined
    );
    if (result.ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = result.error || 'Failed to save';
  } else {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatSegmentDemographics() {
  const text = getSegmentDemographicsText();
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'segment-demographics';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const demographics = formatted.trim() ? { text: formatted } : p.segment?.demographics;
    const result = await presenter.updateProject(
      projectId,
      undefined,
      p.segment?.description,
      demographics,
      undefined,
      undefined,
      undefined,
      undefined
    );
    if (result.ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = result.error || 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatMarketPicture() {
  const text = (project.value?.marketContext?.marketPicture || '').trim();
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'market-picture';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const mc = { ...p.marketContext, marketPicture: formatted };
    const result = await presenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mc
    );
    if (result.ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = result.error || 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatMarketFit() {
  const text = (project.value?.marketContext?.marketFit || '').trim();
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'market-fit';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const mc = { ...p.marketContext, marketFit: formatted };
    const ok = await presenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mc
    );
    if (ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatDifferentiation() {
  const text = (project.value?.marketContext?.differentiation || '').trim();
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'differentiation';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const mc = { ...p.marketContext, differentiation: formatted };
    const result = await presenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mc
    );
    if (result.ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = result.error || 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatHypothesisDescription() {
  const text = (project.value?.hypothesis?.description || '').trim();
  if (!text || text === 'Not specified') return;
  formatLoadingKey.value = 'hypothesis-description';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const ok = await presenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      formatted,
      p.hypothesis?.assumptions,
      undefined,
      undefined
    );
    if (ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatHypothesisAssumptions() {
  const assumptions = project.value?.hypothesis?.assumptions;
  const text = Array.isArray(assumptions) ? assumptions.filter(Boolean).join('\n') : '';
  if (!text.trim()) return;
  formatLoadingKey.value = 'hypothesis-assumptions';
  formatError.value = null;
  const formatted = await callFormatText(text);
  const p = project.value;
  if (formatted != null && p) {
    const lines = formatted
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await presenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      p.hypothesis?.description,
      lines.length ? lines : undefined,
      undefined,
      undefined
    );
    if (result.ok) await presenter.loadProject(projectId, viewModel);
    else formatError.value = result.error || 'Failed to save';
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

async function onFormatScenario() {
  const text = (scenarioContent.value || '').trim();
  if (!text || !scenarioId.value) return;
  formatLoadingKey.value = 'scenario';
  formatError.value = null;
  const formatted = await callFormatText(text);
  if (formatted != null && scenarioId.value) {
    const result = await scenarioRepository.update(projectId, scenarioId.value, formatted);
    if (result.isSuccess) {
      scenarioContent.value = result.data.content;
    } else {
      formatError.value = 'Failed to save scenario';
    }
  } else if (formatted == null) {
    formatError.value = 'Formatting failed';
  }
  formatLoadingKey.value = null;
}

onMounted(() => {
  if (projectId) {
    presenter.loadProject(projectId, viewModel);
  }
});

watch(project, (p) => {
  if (p && projectId) {
    loadScenario();
  }
}, { immediate: true });
</script>

<style scoped>
.project-details-view {
  padding: 2rem 0;
}

.page-header { margin-bottom: 2rem; }
.breadcrumb { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--color-text-muted, #64748b); margin-bottom: 0.5rem; }
.breadcrumb-link { color: var(--color-text-muted); text-decoration: none; }
.breadcrumb-link:hover { color: var(--color-accent); }
.breadcrumb-sep { opacity: 0.5; }
.breadcrumb-current { color: var(--color-text); font-weight: 600; }
.header-main { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0; }
.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.project-card,
.segment-card,
.demographics-card,
.market-context-card,
.hypothesis-card {
  margin-bottom: 2rem;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-label {
  font-weight: 500;
  color: var(--color-text-muted);
  min-width: 120px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-draft { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.status-active,
.status-in-progress { background: var(--color-success-bg); color: var(--color-success); }
.status-completed { background: var(--color-info-bg); color: var(--color-info); }
.status-archived { background: var(--color-bg-subtle); color: var(--color-text-subtle); }

.scenario-card {
  margin-bottom: 2rem;
}

.audience-description {
  color: #4a5568;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.scenario-loading,
.scenario-error,
.scenario-empty {
  color: #4a5568;
  margin: 0;
  padding: 0.5rem 0;
}

.scenario-error {
  color: #c53030;
}

.segment-content,
.hypothesis-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-item h4 {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.content-item p {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Preserve paragraphs and bullet lines from AI-formatted text */
.formatted-text {
  white-space: pre-line;
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.assumptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.assumptions-list li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #4a5568;
}

.assumptions-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4299e1;
  font-weight: bold;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
}

.btn-secondary {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.btn-secondary:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.card-header-row .card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.card-header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-format {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent-light);
  color: var(--color-accent-hover);
  border: 1px solid var(--color-accent);
}

.btn-format:hover:not(:disabled) {
  background: var(--color-accent);
  color: white;
}

.btn-format:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.format-error {
  color: var(--color-error);
  margin: 0 0 1rem 0;
  padding: 0.5rem 0;
}

@media (max-width: 768px) {
  .header-actions .btn {
    flex: 1;
    text-align: center;
  }
}
</style>
