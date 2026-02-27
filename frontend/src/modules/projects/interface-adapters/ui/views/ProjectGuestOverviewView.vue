<template>
  <div class="max-w-7xl mx-auto px-6 py-8">
    <div v-if="loading" class="guest-loading">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-text">{{ labels.guestLoading }}</p>
    </div>

    <div v-else-if="error" class="guest-error">
      <h2 class="guest-error-title">{{ labels.guestErrorTitle }}</h2>
      <p class="guest-error-message">{{ error }}</p>
      <router-link to="/login" class="guest-link">{{ labels.guestSignIn }}</router-link>
    </div>

    <template v-else>
      <!-- Same layout as Overview tab: grid + main + sidebar -->
      <div class="guest-badge-wrap mb-4">
        <span class="guest-badge">{{ labels.guestBadge }}</span>
        <router-link to="/login" class="guest-sign-in">{{ labels.guestSignInToEdit }}</router-link>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content (same as Overview) -->
        <div class="lg:col-span-2 space-y-6">
          <OverviewGuideWidget />

          <ExecutiveSummaryWidget
            :summary="executiveSummaryText"
            :loading="false"
          />

          <SectionCard v-if="hypothesisText && hypothesisText !== 'Not specified'">
            <template #header>
              <div class="hypothesis-header">
                <h3 class="section-title">{{ labels.guestSectionHypothesis }}</h3>
                <HypothesisStatusWidget :status="hypothesisOverallStatus" />
              </div>
            </template>
            <div class="hypothesis-content formatted-text" v-html="formatMarkdown(hypothesisText)"></div>
          </SectionCard>

          <SectionCard v-if="hypothesisAssumptions.length > 0">
            <template #header>
              <h3 class="section-title">Key Assumptions</h3>
            </template>
            <KeyAssumptionsList
              :assumptions="hypothesisAssumptions"
              :get-status="getAssumptionStatus"
              :get-evidence="getAssumptionEvidence"
              :get-evidence-label="getEvidenceLabel"
              :expanded-ids="expandedEvidenceIds"
              :format-markdown="formatMarkdown"
              @toggle="toggleEvidence"
            />
          </SectionCard>

          <SectionCard v-if="overview?.decisionPathway?.steps?.length">
            <template #header>
              <h3 class="section-title">{{ labels.guestSectionDecisionPathway }}</h3>
            </template>
            <DecisionPathwayList
              :steps="overview.decisionPathway.steps"
              :show-links="false"
            />
          </SectionCard>
        </div>

        <!-- Sidebar (same blocks as Overview, read-only / placeholders) -->
        <div class="space-y-6">
          <GuestPlaceholderCard title="Start Research" message="Sign in to run research and collect responses." />
          <GuestPlaceholderCard title="Research Overview" message="Sign in to view research data." />
          <GuestPlaceholderCard title="Show Details" message="Sign in to view details." />
          <GuestPlaceholderCard title="Top Pain Points" message="Sign in to view pain points." />

          <!-- Response progress (from overview) -->
          <SectionCard v-if="overview?.executiveSummary">
            <template #header>
              <h3 class="section-title">{{ labels.guestSectionResponsePace }}</h3>
            </template>
            <div class="pace-metrics guest-pace">
              <div class="metric-item">
                <span class="metric-label">{{ labels.guestMetricCurrent }}</span>
                <span class="metric-value">{{ overview.executiveSummary.paceResponsesPerDay ?? 0 }}/day</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">{{ labels.guestMetricResponses }}</span>
                <span class="metric-value">{{ overview.executiveSummary.responded }} / {{ overview.executiveSummary.sent }}</span>
              </div>
            </div>
            <p class="guest-pace-hint">{{ labels.guestResponseRatePct(overview.executiveSummary.responseRatePct ?? 0) }}</p>
          </SectionCard>

          <GuestPlaceholderCard :title="labels.guestPlaceholderComments" :message="labels.guestPlaceholderCommentsMessage" :sign-in-label="labels.guestSignInLabel" />
          <GuestPlaceholderCard :title="labels.guestPlaceholderCommentPatterns" :message="labels.guestPlaceholderCommentPatternsMessage" :sign-in-label="labels.guestSignInLabel" />

          <!-- Learning Journey (same block as Overview, read-only) -->
          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <h3 class="section-title">{{ labels.guestSectionLearningJourney }}</h3>
            <p v-if="!rounds.length" class="text-gray-600 text-sm mb-4">
              {{ labels.guestRoundsHintEmpty }}
            </p>
            <div v-else class="space-y-3 mb-4">
              <JourneyRoundCard
                v-for="round in rounds"
                :key="round.id"
                :round="round"
              />
            </div>
            <p v-if="rounds.length && overview?.learningJourney?.extendSuggestions?.[0]" class="text-gray-500 text-xs mb-3 italic">
              {{ overview.learningJourney.extendSuggestions[0] }}
            </p>
            <p class="text-sm text-gray-500">{{ labels.guestRoundsHintNewRound }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import SectionCard from '../../../../../shared/components/SectionCard.vue';
import { KeyAssumptionsList, DecisionPathwayList, GuestPlaceholderCard, JourneyRoundCard } from '../..';
import { ExecutiveSummaryWidget, HypothesisStatusWidget, OverviewGuideWidget } from '../../../../research/interface-adapters';
import { ProjectViewModel } from '../../view-models/project.view-model';
import type { ProjectPresenter } from '../../presenters/project.presenter';

const route = useRoute();
const slug = computed(() => (route.params.slug as string) || '');

const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const viewModel = new ProjectViewModel();

const loading = computed(() => viewModel.loading.value);
const error = computed(() => viewModel.error.value);
const project = computed(() => viewModel.project.value);
const overview = computed(() => viewModel.overview.value);

const rounds = computed(() => overview.value?.learningJourney?.rounds ?? []);

const executiveSummaryText = computed(() => {
  const o = overview.value;
  return o?.synthesisReport?.summary ?? o?.executiveSummary?.keyInsight ?? null;
});

type HypothesisStatus = 'confirmed' | 'need_more' | 'not_supported' | null;
const hypothesisOverallStatus = computed<HypothesisStatus>(() => {
  const report = overview.value?.synthesisReport;
  if (!report?.verdict) return null;
  const v = String(report.verdict).toLowerCase();
  if (v === 'validated' || v === 'strong-validation' || v === 'strong_validation') return 'confirmed';
  if (v === 'rejected') return 'not_supported';
  if (v === 'needs-more-data' || v === 'needs_more_data') return 'need_more';
  return null;
});

const hypothesisText = computed(() => {
  const p = project.value;
  if (!p?.hypothesis) return '';
  return p.hypothesis.description ?? '';
});

const hypothesisAssumptions = computed(() => {
  const p = project.value;
  if (!p?.hypothesis?.assumptions) return [];
  return p.hypothesis.assumptions;
});

const assumptionAssessmentsById = computed(() => {
  const list = overview.value?.assumptionAssessments;
  if (!Array.isArray(list)) return {} as Record<string, { status: string; evidence: string | null }>;
  return Object.fromEntries(list.map((a) => [a.assumptionId, { status: a.status, evidence: a.evidence ?? null }]));
});

const expandedEvidenceIds = ref<Set<string>>(new Set());
function toggleEvidence(assumptionId: string): void {
  const next = new Set(expandedEvidenceIds.value);
  if (next.has(assumptionId)) next.delete(assumptionId);
  else next.add(assumptionId);
  expandedEvidenceIds.value = next;
}

function getAssumptionStatus(assumptionId: string): HypothesisStatus {
  const assessment = assumptionAssessmentsById.value[assumptionId];
  if (assessment?.status) {
    const s = String(assessment.status).toLowerCase();
    if (s === 'confirmed') return 'confirmed';
    if (s === 'need_more' || s === 'needs_more_data') return 'need_more';
    if (s === 'not_supported' || s === 'rejected') return 'not_supported';
  }
  return hypothesisOverallStatus.value;
}

function getAssumptionEvidence(assumptionId: string): string | null {
  const assessment = assumptionAssessmentsById.value[assumptionId];
  return assessment?.evidence ?? null;
}

function getEvidenceLabel(assumptionId: string): string {
  const status = getAssumptionStatus(assumptionId);
  if (status === 'confirmed') return labels.guestEvidenceLabel;
  if (status === 'need_more') return labels.guestEvidenceNeedMore;
  if (status === 'not_supported') return labels.guestEvidenceNotSupported;
  return labels.guestEvidenceExplanation;
}

function formatMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  return formatted;
}

onMounted(() => {
  const s = slug.value;
  if (s) {
    presenter.loadGuestOverview(s, viewModel);
  } else {
    viewModel.error.value = 'Missing project slug';
    viewModel.loading.value = false;
  }
});
</script>

<style scoped>
.guest-loading,
.guest-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text { font-size: 0.9375rem; color: var(--color-text-secondary); }
.guest-error-title { font-size: 1.25rem; font-weight: 600; color: var(--color-text); }
.guest-error-message { font-size: 0.9375rem; color: var(--color-text-secondary); }
.guest-link { color: var(--color-accent); text-decoration: underline; }

.guest-badge-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.guest-badge {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.guest-sign-in {
  font-size: 0.875rem;
  color: var(--color-accent);
  text-decoration: none;
}

.guest-sign-in:hover { text-decoration: underline; }

.guest-placeholder-text {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem 0;
}

.guest-placeholder-link {
  font-size: 0.875rem;
  color: var(--color-accent);
  text-decoration: none;
}

.guest-placeholder-link:hover { text-decoration: underline; }

.guest-pace { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem; }
.guest-pace .metric-item { display: flex; flex-direction: column; gap: 0.25rem; }
.guest-pace .metric-label { font-size: 0.75rem; color: var(--color-text-muted); }
.guest-pace .metric-value { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.guest-pace-hint { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }

/* Match Overview tab styles */
.hypothesis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.hypothesis-content.formatted-text,
.assumption-label,
.assumption-evidence-text.formatted-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.key-assumptions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.assumption-card {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}

.assumption-card--confirmed { border-left: 2px solid var(--color-success); }
.assumption-card--need_more { border-left: 2px solid var(--color-warning); }
.assumption-card--not_supported { border-left: 2px solid var(--color-error); }
.assumption-card--pending { border-left: 2px solid var(--color-border); }

.assumption-card-inner {
  padding: 0.625rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.assumption-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.assumption-label { margin: 0; flex: 1; }

.assumption-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.assumption-badge--confirmed { background: var(--color-success-bg); color: var(--color-success); }
.assumption-badge--need_more { background: var(--color-warning-bg); color: var(--color-warning); }
.assumption-badge--not_supported { background: var(--color-error-bg); color: var(--color-error); }

.assumption-evidence-wrap { margin-top: 0.125rem; }

.assumption-evidence-toggle {
  display: inline-flex;
  align-items: center;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-accent);
  text-align: left;
}

.assumption-evidence-toggle:hover { text-decoration: underline; }

.assumption-evidence-content { padding: 0.25rem 0; }
.assumption-evidence-text { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

.decision-pathway-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.decision-pathway-step {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.decision-pathway-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.decision-pathway-indicator--done { background: #059669; }
.decision-pathway-indicator--in_progress { background: #2563eb; }
.decision-pathway-indicator--pending { background: #d1d5db; }

.decision-pathway-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.decision-pathway-label { font-size: 0.875rem; font-weight: 400; min-width: 0; }
.decision-pathway-label--done { color: var(--color-text); }
.decision-pathway-label--in_progress { color: var(--color-text); }
.decision-pathway-label--pending { color: var(--color-text-muted); }

.journey-round {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
}

.journey-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: inline-block;
}

.journey-status-draft { color: #94a3b8; background: rgba(148, 163, 184, 0.1); }
.journey-status-active { color: #0891b2; background: rgba(8, 145, 178, 0.1); }
.journey-status-completed { color: #166534; background: rgba(22, 163, 74, 0.1); }

.journey-type { font-size: 0.8125rem; color: #64748b; font-weight: 500; }
.journey-title { font-size: 1.125rem; font-weight: 700; margin: 0.5rem 0 0.5rem 0; color: #1e293b; }
.journey-finding { font-size: 0.875rem; color: #64748b; margin: 0; line-height: 1.5; }
</style>
