<template>
  <div class="project-details-view">
    <header v-if="project && !isEmbeddedInDashboard" class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ project.name }}</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">{{ project.name }}</h1>
        <div class="header-actions">
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">Manage Invitations</router-link>
          <router-link :to="`/projects/${projectId}`" class="btn btn-secondary">Overview</router-link>
          <router-link :to="`/projects/${projectId}/research`" class="btn btn-secondary">Research</router-link>
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

    <div v-else-if="project" class="details-content overview-redesign">
      <!-- 1. EXECUTIVE SUMMARY (top) -->
      <section class="overview-executive">
        <div class="executive-header">
          <h2 class="executive-title">{{ project.name }}</h2>
          <span :class="['status-badge', `status-${project.status}`]">{{ getStatusLabel(project.status) }}</span>
        </div>
        <div class="executive-health-row">
          <HealthDonutChart
            :score="projectHealthScore"
            :score-class="healthScoreClass"
            label="Project Health"
            :size="80"
          />
          <div class="executive-metrics">
            <p class="executive-insight" v-if="overviewStats.sent > 0">
              {{ overviewStats.responded }} of {{ overviewStats.sent }} responded ({{ overviewResponseRate }}%)
              <template v-if="overviewStats.sent > overviewStats.responded"> · {{ overviewStats.sent - overviewStats.responded }} pending</template>
            </p>
            <p class="executive-insight" v-else>No responses yet. Send invitations to start.</p>
            <p class="executive-meta">Created {{ formatDate(project.createdAt) }}</p>
          </div>
        </div>
      </section>

      <!-- 2. QUICK ACTIONS -->
      <section class="overview-quick-actions">
        <h3 class="section-label">Quick actions</h3>
        <div class="quick-actions-grid">
          <router-link :to="`/projects/${projectId}/invitations`" class="quick-action-btn">
            <span class="quick-action-label">Send reminders</span>
            <span class="quick-action-hint">Invitations</span>
          </router-link>
          <router-link :to="`/projects/${projectId}/invitations`" class="quick-action-btn">
            <span class="quick-action-label">Share public link</span>
            <span class="quick-action-hint">Copy & share</span>
          </router-link>
          <router-link :to="`/projects/${projectId}/report`" class="quick-action-btn">
            <span class="quick-action-label">View report</span>
            <span class="quick-action-hint">Results</span>
          </router-link>
          <router-link :to="`/projects/${projectId}/research`" class="quick-action-btn">
            <span class="quick-action-label">Research Assistant</span>
            <span class="quick-action-hint">AI insights</span>
          </router-link>
        </div>
      </section>

      <!-- 2b. Response progress (quick access to responses) -->
      <section v-if="overviewStats.sent > 0" class="overview-response-progress">
        <h3 class="section-label">Response progress</h3>
        <div class="response-progress-card">
          <p class="response-progress-stats">{{ overviewResponseRate }}% ({{ overviewStats.responded }}/{{ overviewStats.sent }} responded)</p>
          <p v-if="latestInsightText" class="response-progress-insight">Latest insight: {{ latestInsightText }}</p>
          <div class="response-progress-actions">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="overviewStats.responded === 0" @click="openRecentResponsesModal">
              View 3 recent responses
            </button>
            <router-link v-if="overviewStats.responded > 0" :to="`/projects/${projectId}/responses`" class="btn btn-secondary btn-sm">See all responses</router-link>
          </div>
        </div>
      </section>

      <!-- 3. PROJECT HEALTH (metrics) -->
      <section class="overview-health-metrics">
        <h3 class="section-label">Project health</h3>
        <div class="health-grid">
          <div class="health-cell">
            <span class="health-cell-value">{{ overviewResponseRate }}%</span>
            <span class="health-cell-label">Response rate</span>
            <span class="health-cell-detail">{{ overviewStats.responded }}/{{ overviewStats.sent }}</span>
            <router-link :to="`/projects/${projectId}/invitations`" class="health-cell-action">Send more</router-link>
          </div>
          <div class="health-cell">
            <span class="health-cell-value">—</span>
            <span class="health-cell-label">Data quality</span>
            <span class="health-cell-detail">View report</span>
            <router-link :to="`/projects/${projectId}/report`" class="health-cell-action">View</router-link>
          </div>
          <div class="health-cell">
            <span class="health-cell-value">—</span>
            <span class="health-cell-label">Time remaining</span>
            <span class="health-cell-detail">No deadline set</span>
            <span class="health-cell-action mute">—</span>
          </div>
        </div>
      </section>

      <!-- 4. KEY INSIGHTS (placeholder until backend) -->
      <section class="overview-insights">
        <h3 class="section-label">Key insights</h3>
        <div v-if="overviewStats.responded > 0" class="insights-placeholder">
          <p>Run validation and view the Report tab for early signals and metrics.</p>
          <router-link :to="`/projects/${projectId}/report`" class="btn btn-secondary btn-sm">View report</router-link>
        </div>
        <div v-else class="insights-placeholder">
          <p>Collect responses to see automatic insights here.</p>
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary btn-sm">Send invitations</router-link>
        </div>
      </section>

      <!-- 5. PROJECT DETAILS (collapsed by default feel: compact) -->
      <section class="overview-details">
        <h3 class="section-label">Project details</h3>
        <p v-if="saveError" class="form-error">{{ saveError }}</p>

        <Card class="detail-card segment-card" id="segment">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Segment & demographics</h4>
              <button v-if="!editingSegment" type="button" class="btn-edit" @click="startEditSegment">Edit</button>
              <template v-else>
                <button type="button" class="btn-save" :disabled="savingSegment" @click="saveSegment">{{ savingSegment ? 'Saving…' : 'Save' }}</button>
                <button type="button" class="btn-cancel" :disabled="savingSegment" @click="cancelEditSegment">Cancel</button>
              </template>
            </div>
          </template>
          <template v-if="!editingSegment">
            <p class="formatted-text">{{ segmentDisplayText }}</p>
            <p v-if="demographicsDisplayText" class="demographics-inline">{{ demographicsDisplayText }}</p>
          </template>
          <template v-else>
            <label class="inline-label">Segment description</label>
            <textarea v-model="editSegmentDescription" class="overview-input overview-textarea" rows="2" placeholder="Describe your target segment" />
            <label class="inline-label">Demographics</label>
            <textarea v-model="editSegmentDemographics" class="overview-input overview-textarea" rows="1" placeholder="e.g. B2B, 25-45 or JSON" />
          </template>
        </Card>

        <Card class="detail-card market-context-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-title" @click="marketContextCollapsed = !marketContextCollapsed" style="cursor:pointer; user-select:none;">Market context {{ marketContextCollapsed ? '▼' : '▲' }}</span>
              <template v-if="!marketContextCollapsed">
                <button v-if="!editingMarket" type="button" class="btn-edit" @click="startEditMarket">Edit</button>
                <template v-else>
                  <button type="button" class="btn-save" :disabled="savingMarket" @click="saveMarketContext">{{ savingMarket ? 'Saving…' : 'Save' }}</button>
                  <button type="button" class="btn-cancel" :disabled="savingMarket" @click="cancelEditMarket">Cancel</button>
                </template>
              </template>
            </div>
          </template>
          <div v-show="!marketContextCollapsed" class="market-context-inner">
            <template v-if="!editingMarket">
              <p v-if="marketDisplayText" class="formatted-text">{{ marketDisplayText }}</p>
              <p v-else class="formatted-text text-muted">Not specified</p>
            </template>
            <template v-else>
              <label class="inline-label">Market picture</label>
              <textarea v-model="editMarketPicture" class="overview-input overview-textarea" rows="1" placeholder="Brief market overview" />
              <label class="inline-label">Market fit</label>
              <textarea v-model="editMarketFit" class="overview-input overview-textarea" rows="1" placeholder="How your solution fits" />
              <label class="inline-label">Differentiation</label>
              <textarea v-model="editDifferentiation" class="overview-input overview-textarea" rows="1" placeholder="What makes you different" />
            </template>
          </div>
        </Card>

        <Card class="detail-card hypothesis-card" id="hypothesis">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Hypothesis</h4>
              <button v-if="!editingHypothesis" type="button" class="btn-edit" @click="startEditHypothesis">Edit</button>
              <template v-else>
                <button type="button" class="btn-save" :disabled="savingHypothesis" @click="saveHypothesis">{{ savingHypothesis ? 'Saving…' : 'Save' }}</button>
                <button type="button" class="btn-cancel" :disabled="savingHypothesis" @click="cancelEditHypothesis">Cancel</button>
              </template>
            </div>
          </template>
          <template v-if="!editingHypothesis">
            <p class="formatted-text">{{ hypothesisDisplayText }}</p>
            <p v-if="assumptionsDisplayText" class="assumptions-compact" :title="assumptionsDisplayText">{{ assumptionsDisplayText }}</p>
          </template>
          <template v-else>
            <label class="inline-label">Hypothesis description</label>
            <textarea v-model="editHypothesisDescription" class="overview-input overview-textarea" rows="2" placeholder="What are we validating?" />
            <label class="inline-label">Assumptions (one per line)</label>
            <textarea v-model="editAssumptionsText" class="overview-input overview-textarea" rows="2" placeholder="One assumption per line" />
          </template>
        </Card>

        <Card class="detail-card scenario-card" id="scenario">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Scenario</h4>
              <router-link v-if="scenarioContent" :to="`/projects/${projectId}/report`" class="edit-link">View questions</router-link>
              <router-link v-else :to="`/projects/${projectId}/edit`" class="edit-link">Edit</router-link>
            </div>
          </template>
          <template v-if="scenarioLoading">
            <p class="scenario-loading">Loading scenario...</p>
          </template>
          <template v-else-if="scenarioContent">
            <p class="scenario-summary">{{ scenarioQuestionCount }} questions · ~{{ scenarioEstimateMin }} min</p>
            <details class="scenario-details-toggle">
              <summary>Show full scenario</summary>
              <ScenarioViewer :content="scenarioContent" class="scenario-viewer-embed" />
            </details>
          </template>
          <template v-else-if="scenarioError">
            <p class="scenario-error">{{ scenarioError }}</p>
          </template>
          <template v-else>
            <p class="scenario-empty">No scenario yet. Create via the wizard.</p>
          </template>
        </Card>

        <Card class="detail-card audience-card">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Audience</h4>
              <router-link :to="`/projects/${projectId}/invitations`" class="edit-link">Manage</router-link>
            </div>
          </template>
          <p class="audience-stats">{{ overviewStats.sent }} sent · {{ overviewStats.responded }} responded</p>
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary btn-sm">Manage invitations</router-link>
        </Card>
      </section>

      <!-- 6. NEXT STEPS -->
      <section class="overview-next-steps">
        <h3 class="section-label">Next steps</h3>
        <ol class="next-steps-list">
          <li v-if="overviewStats.sent === 0">Send invitations to start collecting responses</li>
          <li v-else-if="overviewStats.responded === 0">Wait for responses or send reminders from Invitations</li>
          <li v-else>View the Report tab for validation results and recommendations</li>
          <li>Use Research Assistant for market and competitor insights</li>
        </ol>
      </section>
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
import HealthDonutChart from '@/shared/components/HealthDonutChart.vue';
import Modal from '@/shared/components/Modal.vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '@/infrastructure/bootstrap/types';
import type { HttpClientPort } from '@/infrastructure/http/ports/http-client.port';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '@/modules/invitations/infrastructure/bootstrap/types';
import type { ScenarioPresenter } from '@/modules/scenarios/interface-adapters/presenters/scenario.presenter';
import type { InvitationPresenter } from '@/modules/invitations/interface-adapters/presenters/invitation.presenter';
import { ProjectStatus } from '../../domain/entities/project.entity';

const route = useRoute();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const scenarioPresenter = container.get<ScenarioPresenter>(SCENARIO_TYPES.ScenarioPresenter);
const invitationPresenter = container.get<InvitationPresenter>(INVITATION_TYPES.InvitationPresenter);

const scenarioContent = ref<string>('');
const scenarioId = ref<string | null>(null);
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);

const overviewInvitations = ref<Array<{ id: string; email: string; status: string }>>([]);
const marketContextCollapsed = ref(true);

const editSegmentDescription = ref('');
const editSegmentDemographics = ref('');
const editHypothesisDescription = ref('');
const editAssumptionsText = ref('');
const editMarketPicture = ref('');
const editMarketFit = ref('');
const editDifferentiation = ref('');
const savingSegment = ref(false);
const savingHypothesis = ref(false);
const savingMarket = ref(false);
const saveError = ref<string | null>(null);
const editingSegment = ref(false);
const editingHypothesis = ref(false);
const editingMarket = ref(false);

const showRecentResponsesModal = ref(false);
const recentResponsesLoading = ref(false);
const recentResponsesQuotes = ref<Array<{ text: string }>>([]);
const latestInsightText = ref('');

const project = computed(() => {
  return viewModel.project.value;
});

const segmentDisplayText = computed(() => {
  const d = project.value?.segment?.description?.trim();
  return d || 'Not specified';
});

const demographicsDisplayText = computed(() => {
  const p = project.value;
  if (!p?.segment?.demographics) return '';
  const d = p.segment.demographics;
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
});

const hypothesisDisplayText = computed(() => {
  const d = project.value?.hypothesis?.description?.trim();
  return d || 'Not specified';
});

const assumptionsDisplayText = computed(() => {
  const a = project.value?.hypothesis?.assumptions;
  if (!Array.isArray(a) || a.length === 0) return '';
  return a.join(' · ');
});

const marketDisplayText = computed(() => {
  const mc = project.value?.marketContext;
  if (!mc) return '';
  const parts: string[] = [];
  if (mc.marketPicture?.trim()) parts.push(`Market: ${mc.marketPicture}`);
  if (mc.marketFit?.trim()) parts.push(`Fit: ${mc.marketFit}`);
  if (mc.differentiation?.trim()) parts.push(`Differentiation: ${mc.differentiation}`);
  return parts.join(' · ') || '';
});

const overviewStats = computed(() => {
  const list = overviewInvitations.value;
  const sent = list.filter((i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed').length;
  const responded = list.filter((i) => i.status === 'responded' || i.status === 'completed').length;
  return { total: list.length, sent, responded };
});
const overviewResponseRate = computed(() => {
  if (overviewStats.value.sent === 0) return 0;
  return Math.round((overviewStats.value.responded / overviewStats.value.sent) * 100);
});

const projectHealthScore = computed(() => {
  let score = 0;
  if (overviewStats.value.sent > 0) {
    score += Math.round(overviewResponseRate.value * 0.6);
  }
  if (scenarioContent.value?.trim()) score += 20;
  if (project.value?.hypothesis?.description?.trim() && project.value.hypothesis.description !== 'Not specified') score += 15;
  if (project.value?.segment?.description?.trim() && project.value.segment.description !== 'Not specified') score += 5;
  return Math.min(100, score);
});

const healthScoreClass = computed(() => {
  const s = projectHealthScore.value;
  if (s >= 60) return 'health-good';
  if (s >= 30) return 'health-warn';
  return 'health-low';
});

const scenarioQuestionCount = computed(() => {
  if (!scenarioContent.value?.trim()) return 0;
  try {
    const p = JSON.parse(scenarioContent.value) as { questions?: unknown[] };
    return Array.isArray(p.questions) ? p.questions.length : 0;
  } catch {
    return 0;
  }
});

const scenarioEstimateMin = computed(() => {
  const n = scenarioQuestionCount.value;
  return n <= 0 ? 0 : Math.max(2, Math.min(15, n * 1));
});

const isEmbeddedInDashboard = computed(() => route.matched.length > 1);

const hasMarketContext = computed(() => {
  const mc = project.value?.marketContext;
  if (!mc) return false;
  return !!(
    (mc.marketPicture && mc.marketPicture.trim()) ||
    (mc.marketFit && mc.marketFit.trim()) ||
    (mc.differentiation && mc.differentiation.trim())
  );
});

function getDemographicsText(p: NonNullable<typeof project.value>): string {
  const d = p.segment?.demographics;
  if (!d) return '';
  if (typeof d === 'string') return d;
  try {
    return JSON.stringify(d, null, 2);
  } catch {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
}

function syncEditFieldsFromProject() {
  const p = project.value;
  if (!p) return;
  editSegmentDescription.value = p.segment?.description ?? '';
  editSegmentDemographics.value = getDemographicsText(p);
  editHypothesisDescription.value = p.hypothesis?.description ?? '';
  editAssumptionsText.value = Array.isArray(p.hypothesis?.assumptions)
    ? p.hypothesis.assumptions.join('\n')
    : '';
  editMarketPicture.value = p.marketContext?.marketPicture ?? '';
  editMarketFit.value = p.marketContext?.marketFit ?? '';
  editDifferentiation.value = p.marketContext?.differentiation ?? '';
}

function startEditSegment() {
  syncEditFieldsFromProject();
  editingSegment.value = true;
  saveError.value = null;
}
function cancelEditSegment() {
  editingSegment.value = false;
}

function startEditHypothesis() {
  syncEditFieldsFromProject();
  editingHypothesis.value = true;
  saveError.value = null;
}
function cancelEditHypothesis() {
  editingHypothesis.value = false;
}

function startEditMarket() {
  syncEditFieldsFromProject();
  editingMarket.value = true;
  saveError.value = null;
}
function cancelEditMarket() {
  editingMarket.value = false;
}

async function saveSegment() {
  if (!projectId) return;
  savingSegment.value = true;
  saveError.value = null;
  const desc = editSegmentDescription.value.trim();
  let demographics: string | Record<string, unknown> = editSegmentDemographics.value.trim();
  if (demographics) {
    try {
      demographics = JSON.parse(demographics) as Record<string, unknown>;
    } catch {
      demographics = { text: editSegmentDemographics.value };
    }
  } else if (desc) {
    demographics = {};
  }
  const result = await presenter.updateProject(
    projectId,
    undefined,
    desc || undefined,
    demographics || undefined,
    undefined,
    undefined,
    undefined,
    undefined
  );
  savingSegment.value = false;
  if (result.ok) await presenter.loadProject(projectId, viewModel);
  else saveError.value = result.error ?? 'Failed to save';
}

async function saveHypothesis() {
  if (!projectId) return;
  savingHypothesis.value = true;
  saveError.value = null;
  const assumptions = editAssumptionsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const result = await presenter.updateProject(
    projectId,
    undefined,
    undefined,
    undefined,
    editHypothesisDescription.value.trim() || undefined,
    assumptions.length ? assumptions : undefined,
    undefined,
    undefined
  );
  savingHypothesis.value = false;
  if (result.ok) {
    editingHypothesis.value = false;
    await presenter.loadProject(projectId, viewModel);
  } else saveError.value = result.error ?? 'Failed to save';
}

async function saveMarketContext() {
  if (!projectId) return;
  savingMarket.value = true;
  saveError.value = null;
  const hasAny =
    editMarketPicture.value.trim() ||
    editMarketFit.value.trim() ||
    editDifferentiation.value.trim();
  const marketContext = hasAny
    ? {
        marketPicture: editMarketPicture.value.trim() || undefined,
        marketFit: editMarketFit.value.trim() || undefined,
        differentiation: editDifferentiation.value.trim() || undefined,
      }
    : null;
  const result = await presenter.updateProject(
    projectId,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    marketContext
  );
  savingMarket.value = false;
  if (result.ok) {
    editingMarket.value = false;
    await presenter.loadProject(projectId, viewModel);
  } else saveError.value = result.error ?? 'Failed to save';
}

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
  const result = await scenarioPresenter.getLatestByProjectId(projectId);
  scenarioLoading.value = false;
  if ('error' in result) {
    const isNotFound =
      result.error.includes('No scenario found') || result.error.includes('ScenarioNotFoundError');
    scenarioContent.value = '';
    scenarioError.value = isNotFound ? null : result.error;
  } else {
    scenarioContent.value = result.content;
    scenarioId.value = result.id;
    scenarioError.value = null;
  }
}

async function loadOverviewInvitations() {
  if (!projectId) return;
  const { invitations } = await invitationPresenter.loadInvitations(projectId);
  overviewInvitations.value = invitations;
}

onMounted(() => {
  if (projectId) {
    presenter.loadProject(projectId, viewModel);
  }
});

async function openRecentResponsesModal() {
  showRecentResponsesModal.value = true;
  recentResponsesQuotes.value = [];
  recentResponsesLoading.value = true;
  try {
    const url = API_CONFIG.ENDPOINTS.RESPONSES(projectId);
    const data = await httpClient.get<{ responses: Array<{ answers: Record<string, unknown>; transcript?: string }> }>(url);
    const list = data?.responses ?? [];
    const take = list.slice(0, 3);
    recentResponsesQuotes.value = take.map((r) => {
      const firstAnswer = Object.values(r.answers || {})[0];
      let text = '';
      if (firstAnswer != null) {
        text = typeof firstAnswer === 'string' ? firstAnswer : (typeof (firstAnswer as { text?: string }).text === 'string' ? (firstAnswer as { text: string }).text : JSON.stringify(firstAnswer));
      }
      if (!text && r.transcript) text = r.transcript.slice(0, 200) + (r.transcript.length > 200 ? '…' : '');
      if (!text) text = '—';
      return { text: text.slice(0, 200) + (text.length > 200 ? '…' : '') };
    });
  } catch {
    recentResponsesQuotes.value = [];
  } finally {
    recentResponsesLoading.value = false;
  }
}

watch(project, (p) => {
  if (p && projectId) {
    syncEditFieldsFromProject();
    loadScenario();
    loadOverviewInvitations();
  }
}, { immediate: true });

/** Scroll to Project details section when URL hash is #segment, #hypothesis, or #scenario. Edit form is not implemented yet. */
function scrollToHashSection() {
  const hash = route.hash?.replace(/^#/, '') || '';
  if (!hash || !['segment', 'hypothesis', 'scenario'].includes(hash)) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
watch(() => route.hash, scrollToHashSection, { immediate: true });
onMounted(() => scrollToHashSection());
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

.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }

/* Overview redesign */
.overview-redesign {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}

.overview-response-progress { margin-bottom: 0; }
.response-progress-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.response-progress-stats { font-weight: 600; margin: 0 0 0.25rem 0; }
.response-progress-insight {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}
.response-progress-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.recent-loading, .recent-empty { padding: 1rem; color: var(--color-text-muted); }
.recent-quotes-list { list-style: none; padding: 0; margin: 0; }
.recent-quote {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
}
.recent-quote:last-child { border-bottom: none; }
.recent-quote-label { font-size: 0.75rem; color: var(--color-text-muted); }
.recent-quote-text { margin: 0.25rem 0 0 0; font-size: 0.875rem; }
.overview-executive {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}
.executive-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.executive-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}
.executive-health-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.executive-metrics {
  flex: 1;
  min-width: 0;
}
.executive-insight {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}
.executive-meta {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.overview-quick-actions {
  margin: 0;
}
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}
.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  transition: border-color 0.2s, background 0.2s;
}
.quick-action-btn:hover {
  border-color: var(--color-accent);
  background: rgba(13, 148, 136, 0.05);
}
.quick-action-label {
  font-size: 0.875rem;
  font-weight: 600;
}
.quick-action-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}
.overview-health-metrics { margin: 0; }
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.health-cell {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.health-cell-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}
.health-cell-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
}
.health-cell-detail {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.health-cell-action {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  margin-top: 0.35rem;
}
.health-cell-action.mute {
  color: var(--color-text-subtle);
  cursor: default;
}
.health-cell-action:hover:not(.mute) {
  text-decoration: underline;
}
.overview-insights { margin: 0; }
.insights-placeholder {
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.insights-placeholder p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.overview-details { margin: 0; }
.overview-details .detail-card {
  margin-bottom: 1rem;
}
.overview-details .detail-card:last-child {
  margin-bottom: 0;
}
.edit-link {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
}
.edit-link:hover {
  text-decoration: underline;
}
.btn-inline {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.inline-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0.25rem 0;
}
.inline-label:first-of-type {
  margin-top: 0;
}
.overview-input,
.overview-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 0.5rem);
  background: var(--color-bg);
  color: var(--color-text);
  margin-bottom: 0.5rem;
}
.overview-textarea {
  min-height: 2.5rem;
  resize: vertical;
}
.form-error {
  color: var(--color-error, #dc2626);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}
.text-muted {
  color: var(--color-text-muted);
}
.card-header-row .btn-inline + .btn-inline {
  margin-left: 0.5rem;
}
.demographics-inline {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.market-context-card .collapsible-header {
  cursor: pointer;
  user-select: none;
}
.collapse-icon {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.market-context-inner {
  padding-top: 0.5rem;
}
.market-context-inner p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.assumptions-compact {
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  cursor: help;
}
.scenario-summary {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text);
}
.scenario-details-toggle {
  margin-top: 0.75rem;
  font-size: 0.875rem;
}
.scenario-details-toggle summary {
  cursor: pointer;
  color: var(--color-accent);
  font-weight: 500;
}
.scenario-viewer-embed {
  margin-top: 1rem;
}
.audience-stats {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text);
}
.overview-next-steps { margin: 0; }
.next-steps-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text);
}
.next-steps-list li { margin-bottom: 0.25rem; }

.project-card,
.segment-card,
.hypothesis-card {
  margin-bottom: 1rem;
}
.card-subtitle {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
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

@media (max-width: 768px) {
  .header-actions .btn {
    flex: 1;
    text-align: center;
  }
  .health-grid {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .executive-health-row {
    flex-direction: column;
  }
}
</style>
