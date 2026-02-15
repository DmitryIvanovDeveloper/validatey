<template>
  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Executive Summary -->
        <ExecutiveSummaryWidget
          :summary="researchData?.synthesisReport?.summary || null"
          :loading="executiveSummaryLoading"
          @show-details="handleShowDetails"
        />

        <!-- Research Context -->
        <SectionCard>
          <template #header>
            <h3 class="section-title">Research Context</h3>
          </template>
          <div class="space-y-4">
            <div class="mb-4">
              <p class="section-subtitle">Target Segment</p>
              <div class="text-gray-900">{{ project?.segment?.description || 'Not specified' }}</div>
            </div>

            <div class="mb-4">
              <p class="section-subtitle">Hypothesis</p>
              <div class="text-gray-900">{{ project?.hypothesis?.description || 'Not specified' }}</div>
            </div>

            <div v-if="project?.hypothesis?.assumptions && project.hypothesis.assumptions.length > 0" class="mb-4">
              <p class="section-subtitle">Key Assumptions</p>
              <ul class="space-y-2">
                <li
                  v-for="(assumption, i) in project.hypothesis.assumptions"
                  :key="i"
                  class="flex items-start gap-2 text-gray-900"
                >
                  <span class="text-blue-600 mt-1">•</span>
                  <span>{{ assumption }}</span>
                </li>
              </ul>
            </div>

            <div v-if="project?.marketContext" class="mb-4">
              <p class="section-subtitle">Market Context</p>
              <div class="space-y-3">
                <div v-if="project.marketContext.marketPicture" class="bg-blue-50 p-3 rounded-lg">
                  <div class="text-sm font-medium text-blue-800 mb-1">Market Picture</div>
                  <div class="text-gray-700">{{ project.marketContext.marketPicture }}</div>
                </div>
                <div v-if="project.marketContext.marketFit" class="bg-green-50 p-3 rounded-lg">
                  <div class="text-sm font-medium text-green-800 mb-1">Market Fit</div>
                  <div class="text-gray-700">{{ project.marketContext.marketFit }}</div>
                </div>
                <div v-if="project.marketContext.differentiation" class="bg-purple-50 p-3 rounded-lg">
                  <div class="text-sm font-medium text-purple-800 mb-1">Differentiation</div>
                  <div class="text-gray-700">{{ project.marketContext.differentiation }}</div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <!-- Decision Pathway -->
        <SectionCard>
          <template #header>
            <h3 class="section-title">Decision Pathway</h3>
          </template>
          <div class="space-y-3">
            <div v-for="step in overviewData?.decisionPathway?.steps" :key="step.id" class="flex items-start gap-3">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2', step.status === 'done' ? 'bg-green-600 border-green-600' : step.status === 'in_progress' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300']">
                <CheckCircle v-if="step.status === 'done'" class="w-4 h-4 text-white" />
                <div v-else-if="step.status === 'in_progress'" class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div v-else class="w-3 h-3 bg-gray-600 rounded-full"></div>
              </div>
              <div>
                <div :class="['font-medium', step.status === 'done' ? 'text-gray-900' : 'text-gray-600']">
                  {{ step.label }}
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-2">
                  <span>{{ step.progress }}</span>
                  <router-link v-if="step.actionHref" :to="step.actionHref" class="text-blue-600 hover:text-blue-800 text-xs">
                    {{ step.status === 'pending' ? 'Start' : step.status === 'in_progress' ? 'Continue' : 'View' }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Start Research -->
        <StartResearchWidget
          :project-id="projectId"
          @research-started="handleResearchStarted"
          @research-completed="handleResearchCompleted"
        />

        <!-- Show Details -->
        <ShowDetailsWidget
          :project-id="projectId"
          :research-data="researchData"
          :is-modal-open="isShowDetailsModalOpen"
          :response-count="overviewData?.executiveSummary?.responded || 0"
          @update:is-modal-open="isShowDetailsModalOpen = $event"
        />

        <!-- Top Pain Points -->
        <TopPainPointsWidget ref="painPointsRef" :project-id="projectId" :external-loading="widgetsLoading" />

        <!-- Response Pace -->
        <ResponsePaceWidget ref="responsePaceRef" :project-id="projectId" :target-pace="5" :external-loading="widgetsLoading" />

        <!-- Comments Overview -->
        <CommentsWidget :project-id="projectId" :external-loading="widgetsLoading" />

        <!-- Learning Journey -->
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <h3 class="section-title">Learning Journey</h3>
          <p class="text-gray-700 text-sm mb-4">
            This is validation round #1. After analyzing the results, you can launch the next round for deeper verification.
          </p>
          <button class="learn-more-btn">
            Learn more →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Send,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import type { InvitationPresenter } from '../../../invitations/interface-adapters/presenters/invitation.presenter';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { ResearchPresenter } from '../../../research/interface-adapters/presenters/research.presenter';
import ResponsePaceWidget from '../../../responses/interface-adapters/components/ResponsePaceWidget.vue';
import { CommentsWidget } from '../../../comments/interface-adapters/components';
import { ExecutiveSummaryWidget, StartResearchWidget, ShowDetailsWidget } from '../../../research/interface-adapters';
import TopPainPointsWidget from '../../../research/interface-adapters/views/components/TopPainPointsWidget.vue';
import SectionCard from '../../../../shared/components/SectionCard.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const invitationPresenter = container.get<InvitationPresenter>(INVITATION_TYPES.InvitationPresenter);
const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);
const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const overviewInvitations = ref<Array<{ id: string; email: string; status: string }>>([]);


// Refs for widget components
const painPointsRef = ref();
const responsePaceRef = ref();

/** Overview command center payload (executive summary, pulse, smart actions, research context, decision pathway). */
type OverviewPayload = {
  executiveSummary: {
    projectName: string;
    status: string;
    validationStatus: string;
    responded: number;
    sent: number;
    responseRatePct: number;
    neededForSignificance: number | null;
    keyInsight: string | null;
    deadline: string | null;
    daysRemaining: number | null;
    paceResponsesPerDay: number;
    aiVerdict: string | null;
    createdAt: string;
  };
  pulse: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    status: string;
    actionLabel: string;
    actionHref: string;
  }>;
  smartActions: Array<{ id: string; label: string; hint: string; href: string }>;
  researchContext: { summary: string | null; marketSnippet: string | null; competitorsSnippet: string | null; hasData: boolean };
  learningJourney: { rounds: Array<{ id: string; title: string; type: string; status: string; keyFinding: string | null; reportHref: string }>; extendSuggestions: string[] };
  decisionPathway: {
    steps: Array<{ id: string; label: string; progress: string; status: string; actionHref: string | null }>;
    successCriteria: Array<{ label: string; current: string; target: string; met: boolean }>;
    decisionDate: string | null;
  };
};
const overviewData = ref<OverviewPayload | null>(null);
const researchData = ref<any>(null);
const executiveSummaryLoading = ref(false);
const widgetsLoading = ref(false); // External loading state for Pain Points and Response Pace widgets
const isShowDetailsModalOpen = ref(false);

const project = computed(() => {
  return viewModel.project.value;
});

const overviewStats = computed(() => {
  const list = overviewInvitations.value;
  const sent = list.filter((i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed').length;
  const responded = list.filter((i) => i.status === 'responded' || i.status === 'completed').length;
  return { total: list.length, sent, responded };
});

const getProjectAge = (): number => {
  if (!project.value) return 0;
  const created = typeof project.value.createdAt === 'string'
    ? new Date(project.value.createdAt)
    : project.value.createdAt;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};



function goToReportTab() {
  router.push(`/projects/${projectId}/report`);
}

async function loadOverviewInvitations() {
  if (!projectId) return;
  const { invitations } = await invitationPresenter.loadInvitations(projectId);
  overviewInvitations.value = invitations;
}

async function loadOverview() {
  if (!projectId) return;
  try {
    const url = API_CONFIG.ENDPOINTS.OVERVIEW(projectId);
    const data = await httpClient.get<OverviewPayload>(url);
    overviewData.value = data ?? null;
  } catch (error) {
    console.error('Failed to load overview:', error);
    overviewData.value = null;
  }
}

async function loadResearchData() {
  if (!projectId) return;
  try {
    const result = await researchPresenter.getResearchCanvas(projectId);
    researchData.value = result;
  } catch {
    researchData.value = null;
  }
}


function handleResearchStarted() {
  executiveSummaryLoading.value = true;
  widgetsLoading.value = true; // Show loading in Pain Points and Response Pace widgets
}

function handleResearchCompleted() {
  executiveSummaryLoading.value = false;
  widgetsLoading.value = false; // Hide loading in Pain Points and Response Pace widgets
  // Reload research data to get updated summary
  loadResearchData();
}

function handleShowDetails() {
  isShowDetailsModalOpen.value = true;
}

onMounted(() => {
  if (projectId) {
    presenter.loadProject(projectId, viewModel);
    loadOverview();
    loadResearchData();
  }
});

watch(project, (p) => {
  if (p && projectId) {
    loadOverviewInvitations();
    loadOverview();
  }
}, { immediate: true });
</script>

<style>
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
  gap: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  min-height: 100vh;
  padding: 2rem 0;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animations for sections */
.overview-card:nth-child(1) { animation-delay: 0.1s; }
.overview-card:nth-child(2) { animation-delay: 0.2s; }
.overview-card:nth-child(3) { animation-delay: 0.3s; }
.overview-card:nth-child(4) { animation-delay: 0.4s; }
.sidebar-card:nth-child(1) { animation-delay: 0.2s; }
.sidebar-card:nth-child(2) { animation-delay: 0.3s; }
.sidebar-card:nth-child(3) { animation-delay: 0.4s; }

.overview-card,
.sidebar-card {
  animation: slideInUp 0.6s ease-out both;
}

/* New Overview Design Styles */

.overview-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.section-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin: 0 0 1rem 0;
  position: relative;
}
.section-label::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 2rem;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  border-radius: 1px;
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

.overview-rounds { margin-bottom: 0; }
.rounds-intro { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 0.75rem 0; }
.rounds-loading { padding: 1rem; color: var(--color-text-muted); }
.rounds-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.round-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.round-status { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-right: 0.5rem; }
.round-status-draft { color: var(--color-text-muted); }
.round-status-active { color: var(--color-accent); }
.round-status-completed { color: var(--color-success, #38a169); }
.round-status-archived { color: var(--color-text-muted); }
.round-type { font-size: 0.75rem; color: var(--color-text-muted); }
.round-title { font-size: 1rem; font-weight: 600; margin: 0.25rem 0 0.5rem 0; }
.round-finding { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 0.5rem 0; }
.round-actions { margin-top: 0.5rem; }
.rounds-empty { padding: 1rem; color: var(--color-text-muted); font-size: 0.875rem; }
.rounds-add-btn { margin-top: 0.25rem; }

.recent-loading, .recent-empty { padding: 1rem; color: var(--color-text-muted); }
.recent-quotes-list { list-style: none; padding: 0; margin: 0; }
.recent-quote {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
}
.recent-quote:last-child { border-bottom: none; }
.recent-quote-label { font-size: 0.75rem; color: var(--color-text-muted); }
.recent-quote-text { margin: 0.25rem 0 0 0; font-size: 0.875rem; }
.card-elevated {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-elevated:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 64px rgba(0, 0, 0, 0.12),
    0 8px 32px rgba(0, 0, 0, 0.08);
}
.card-elevated::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0d9488, #0891b2, #7c3aed);
  transition: all 0.3s ease;
}
.card-elevated:hover::before {
  height: 4px;
  box-shadow: 0 0 20px rgba(13, 148, 136, 0.3);
}
.overview-executive {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1.25rem;
  padding: 2rem 2.5rem;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}
.executive-validation-row {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.executive-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.executive-right {
  flex-shrink: 0;
}
.validation-status {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.375rem 0.875rem;
  border-radius: 2rem;
  width: fit-content;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.validation-no_data {
  color: #64748b;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.15);
}
.validation-weak_support {
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
}
.validation-unclear_signal {
  color: #0f766e;
  background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}
.validation-validated {
  color: #166534;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.15);
}
.executive-stats {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.5;
}
.executive-key-insight {
  font-size: 1rem;
  color: #1e293b;
  margin: 0.5rem 0;
  padding: 1rem 1.25rem;
  border-left: 4px solid linear-gradient(180deg, #0d9488, #0891b2);
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(8, 145, 178, 0.05));
  border-radius: 0 0.75rem 0.75rem 0;
  position: relative;
  overflow: hidden;
}
.executive-key-insight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #0d9488, #0891b2);
}
.executive-ai-verdict {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0.75rem 0 0 0;
  font-style: italic;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.executive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.executive-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.executive-health-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* Modern Progress ring */
.overview-progress-ring {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}
.overview-progress-ring .progress-ring {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background:
    conic-gradient(
      #0d9488 calc(var(--p, 0) * 3.6deg),
      #e2e8f0 0
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 0 0 8px rgba(255, 255, 255, 0.9),
    0 8px 32px rgba(13, 148, 136, 0.2),
    0 2px 8px rgba(13, 148, 136, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s ease;
}
.overview-progress-ring .progress-ring::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4)),
    linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(8, 145, 178, 0.1));
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
.overview-progress-ring .progress-value {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0d9488;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: color 0.3s ease;
}
.progress-ring-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
.overview-smart-actions { margin: 0; }
.smart-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.smart-action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.smart-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.1), transparent);
  transition: left 0.5s ease;
}
.smart-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.15);
  border-color: rgba(13, 148, 136, 0.3);
}
.smart-action-btn:hover::before {
  left: 100%;
}
.smart-action-label {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 1;
}
.smart-action-hint {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  position: relative;
  z-index: 1;
  opacity: 0.8;
}


.overview-research-context {
  padding: 1.75rem 2rem;
  border-radius: 1rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%),
    rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}
.overview-research-context::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  pointer-events: none;
}
.research-summary {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}
.research-snippet {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.375rem 0 0 0;
  position: relative;
  z-index: 1;
}

.overview-learning-journey { margin: 0; }
.journey-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem 0;
  margin-bottom: 1.5rem;
  position: relative;
}
.journey-chain::before {
  content: '';
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0);
  z-index: 0;
}
.journey-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}
.journey-arrow {
  color: #94a3b8;
  font-weight: 800;
  font-size: 1.125rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.journey-round {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  min-width: 240px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.journey-round:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
.journey-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-right: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: inline-block;
}
.journey-status-draft {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
}
.journey-status-active {
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
  box-shadow: 0 0 8px rgba(8, 145, 178, 0.2);
}
.journey-status-completed {
  color: #166534;
  background: rgba(22, 163, 74, 0.1);
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.2);
}
.journey-type {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}
.journey-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.5rem 0 0.75rem 0;
  color: #1e293b;
}
.journey-finding {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.overview-decision-pathway {
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
.pathway-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}
.pathway-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
}
.pathway-step:last-of-type { border-bottom: none; }
.pathway-step:hover {
  background: rgba(13, 148, 136, 0.02);
  border-radius: 0.5rem;
  margin: 0 -0.5rem;
  padding: 1rem 0.5rem;
}
.pathway-step-label {
  font-weight: 700;
  flex: 1;
  min-width: 0;
  color: #1e293b;
  font-size: 1rem;
}
.pathway-step-progress {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.pathway-done {
  color: #166534;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}
.pathway-criteria-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1e293b;
  position: relative;
}
.pathway-criteria-title::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 3rem;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  border-radius: 1px;
}
.pathway-criteria-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  display: grid;
  gap: 0.75rem;
}
.pathway-criteria-list li {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}
.pathway-criteria-list li:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.pathway-criteria-list .criteria-met {
  color: #166534;
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
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
  margin-bottom: 1.5rem;
  animation: slideInUp 0.6s ease-out both;
}
.overview-details .detail-card:nth-child(1) { animation-delay: 0.1s; }
.overview-details .detail-card:nth-child(2) { animation-delay: 0.2s; }
.overview-details .detail-card:nth-child(3) { animation-delay: 0.3s; }
.overview-details .detail-card:nth-child(4) { animation-delay: 0.4s; }
.overview-details .detail-card:last-child {
  margin-bottom: 0;
}
.edit-link {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0d9488;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.edit-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  transition: width 0.3s ease;
  border-radius: 1px;
}
.edit-link:hover {
  color: #0891b2;
  transform: translateY(-1px);
}
.edit-link:hover::after {
  width: 100%;
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

/* Modern action buttons for detail cards */
.btn-edit,
.btn-save,
.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.btn-edit {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
  border-color: rgba(13, 148, 136, 0.3);
}

.btn-edit:hover:not(:disabled) {
  background: rgba(13, 148, 136, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
}

.btn-save {
  background: linear-gradient(135deg, #0d9488, #0891b2);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #0891b2, #0d9488);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4);
}

.btn-cancel {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.btn-edit:disabled,
.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
.inline-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #374151;
  margin: 0.75rem 0 0.375rem 0;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}
.inline-label:first-of-type {
  margin-top: 0;
}
.overview-input,
.overview-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #1e293b;
  margin-bottom: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.overview-input:focus,
.overview-textarea:focus {
  outline: none;
  border-color: rgba(13, 148, 136, 0.5);
  box-shadow:
    0 0 0 3px rgba(13, 148, 136, 0.1),
    0 4px 12px rgba(13, 148, 136, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.overview-input::placeholder,
.overview-textarea::placeholder {
  color: #94a3b8;
  opacity: 0.8;
}

.overview-textarea {
  min-height: 3rem;
  resize: vertical;
  line-height: 1.5;
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
  margin: 0.75rem 0 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.market-context-card .collapsible-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}
.market-context-card .collapsible-header:hover {
  transform: translateY(-1px);
}
.collapse-icon {
  font-size: 0.875rem;
  color: #64748b;
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
}
.market-context-inner {
  padding-top: 1rem;
  animation: fadeInDown 0.4s ease-out;
}
.market-context-inner p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.assumptions-compact {
  margin: 0.75rem 0 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  cursor: help;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}
.assumptions-compact:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}
.scenario-summary {
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
  color: #1e293b;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.scenario-details-toggle {
  margin-top: 1rem;
  font-size: 0.875rem;
}
.scenario-details-toggle summary {
  cursor: pointer;
  color: #0d9488;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  background: rgba(13, 148, 136, 0.05);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(13, 148, 136, 0.1);
}
.scenario-details-toggle summary:hover {
  background: rgba(13, 148, 136, 0.1);
  transform: translateY(-1px);
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
  color: #64748b;
  line-height: 1.7;
  font-size: 0.9375rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.assumptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.assumptions-list li {
  padding: 0.75rem 1rem 0.75rem 2rem;
  position: relative;
  color: #64748b;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.assumptions-list li:last-child {
  border-bottom: none;
}

.assumptions-list li:hover {
  background: rgba(13, 148, 136, 0.02);
  padding-left: 2.25rem;
}

.assumptions-list li::before {
  content: '▹';
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  color: #0d9488;
  font-weight: bold;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.assumptions-list li:hover::before {
  color: #0891b2;
  transform: scale(1.2);
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
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.2;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #0d9488, #0891b2);
  color: white;
  box-shadow:
    0 4px 16px rgba(13, 148, 136, 0.3),
    0 2px 8px rgba(13, 148, 136, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0891b2, #0d9488);
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(13, 148, 136, 0.4),
    0 4px 16px rgba(13, 148, 136, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  position: relative;
}

.card-header-row .card-title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-header-row .card-title:hover {
  transform: translateY(-1px);
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
  .executive-validation-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  .executive-right {
    align-self: center;
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

.overview-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.overview-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
}

.overview-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

/* Key Insight */
.key-insight {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.insight-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.insight-text {
  color: #1e40af;
  font-weight: 500;
  line-height: 1.5;
}

/* Significance Alert */
.significance-alert {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #92400e;
}

.significance-alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}



/* Research Context */
.research-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.research-section {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.research-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.research-text {
  color: #374151;
  line-height: 1.5;
}

.research-link {
  color: #0d9488;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: inline-block;
}

.research-link:hover {
  color: #0891b2;
}

/* Learning Journey */
.journey-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.journey-step {
  position: relative;
  padding-left: 2rem;
}

.journey-step:not(:last-child) {
  padding-bottom: 1rem;
}

.journey-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 2rem;
  bottom: -0.5rem;
  width: 2px;
  background: #e5e7eb;
}

.journey-node {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
}

.journey-node::before {
  content: '';
  position: absolute;
  left: -0.375rem;
  top: 1rem;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #e5e7eb;
}

.journey-pending {
  border-color: #e5e7eb;
}

.journey-pending::before {
  background: #e5e7eb;
}

.journey-in_progress {
  border-color: #0d9488;
  background: #ecfdf5;
}

.journey-in_progress::before {
  background: #0d9488;
}

.journey-completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.journey-completed::before {
  background: #10b981;
}

.journey-type {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.journey-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.journey-finding {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.journey-link {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.journey-link:hover {
  color: #0891b2;
}

.journey-empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.journey-empty p {
  margin-bottom: 1rem;
}

/* Decision Pathway */
.decision-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.decision-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
}

.step-completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.step-active {
  border-color: #0d9488;
  background: #ecfdf5;
}

.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.step-completed .step-indicator {
  background: #10b981;
}

.step-active .step-indicator {
  background: #0d9488;
}

.step-completed .step-indicator svg,
.step-active .step-indicator svg {
  width: 14px;
  height: 14px;
  color: white;
}

.step-content {
  flex: 1;
}

.step-label {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.step-progress {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.step-action {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.step-action:hover {
  color: #0891b2;
}

.success-criteria {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.criteria-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #f9fafb;
}

.criterion-met {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.criterion-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
}

.criterion-met .criterion-check {
  background: #10b981;
}

.criterion-met .criterion-check svg {
  width: 12px;
  height: 12px;
  color: white;
}

.criterion-content {
  flex: 1;
}

.criterion-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.125rem;
}

.criterion-value {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Sidebar Cards */
.sidebar-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

/* Smart Actions */
.smart-actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.smart-action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease;
}

.smart-action-item:hover {
  background: #f9fafb;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
}

.action-icon svg {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.smart-action-item:hover .action-icon {
  background: #0d9488;
}

.smart-action-item:hover .action-icon svg {
  color: white;
}

.action-content {
  flex: 1;
}

.action-label {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.125rem;
}

.action-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Quick Stats */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

/* Project Meta */
.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-value {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.edit-link {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.edit-link:hover {
  color: #0891b2;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .overview-sidebar {
    position: static;
    order: -1;
  }


  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .overview-container {
    padding: 1rem;
  }

  .overview-card {
    padding: 1rem;
  }

  .ai-verdict-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .verdict-icon {
    margin-top: 0;
  }
}

/* New React-inspired styles */
.overview-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.p-4 {
  padding: 1rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.text-gray-600 {
  color: #4b5563;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.font-bold {
  font-weight: 700;
}

.text-gray-900 {
  color: #111827;
}

.text-green-600 {
  color: #059669;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

.flex {
  display: flex;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.mt-0\.5 {
  margin-top: 0.125rem;
}

.text-white {
  color: white;
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #6b7280;
}

.bg-green-600 {
  background-color: #059669;
}

.bg-gray-200 {
  background-color: #e5e7eb;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}

.gap-3 {
  gap: 0.75rem;
}

/* Base layout classes */
.max-w-7xl {
  max-width: 80rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.lg\:grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gap-6 {
  gap: 1.5rem;
}

.lg\:col-span-2 {
  grid-column: span 2 / span 2;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.bg-white {
  background-color: white;
}

.rounded-xl {
  border-radius: 0.75rem;
}

.border {
  border-width: 1px;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.p-6 {
  padding: 1.5rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.font-bold {
  font-weight: 700;
}

.text-gray-900 {
  color: #111827;
}

.mb-4 {
  margin-bottom: 1rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.p-4 {
  padding: 1rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.text-gray-600 {
  color: #4b5563;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

.flex {
  display: flex;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.mt-0\.5 {
  margin-top: 0.125rem;
}

.text-white {
  color: white;
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #6b7280;
}

.bg-green-600 {
  background-color: #059669;
}

.bg-gray-200 {
  background-color: #e5e7eb;
}

.text-green-600 {
  color: #059669;
}

.md\:grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-medium {
  font-weight: 500;
}

.text-gray-700 {
  color: #374151;
}

.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-50 {
  --tw-gradient-from: #eff6ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0));
}

.to-purple-50 {
  --tw-gradient-to: #faf5ff;
}

.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

.transition-colors {
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out, fill 0.15s ease-in-out, stroke 0.15s ease-in-out, opacity 0.15s ease-in-out, box-shadow 0.15s ease-in-out, transform 0.15s ease-in-out;
}

.text-left {
  text-align: left;
}

.text-blue-600 {
  color: #2563eb;
}

.hover\:text-blue-700:hover {
  color: #1d4ed8;
}

.justify-between {
  justify-content: space-between;
}

/* Button styles */
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

.transition-colors {
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out, fill 0.15s ease-in-out, stroke 0.15s ease-in-out, opacity 0.15s ease-in-out, box-shadow 0.15s ease-in-out, transform 0.15s ease-in-out;
}

.text-left {
  text-align: left;
}

.text-blue-600 {
  color: #2563eb;
}

.hover\:text-blue-700:hover {
  color: #1d4ed8;
}

.justify-between {
  justify-content: space-between;
}

/* Smart Action Buttons */
.smart-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.smart-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.1), transparent);
  transition: left 0.5s ease;
}

.smart-action-btn:hover {
  background: rgba(249, 250, 251, 0.9);
  border-color: rgba(37, 99, 235, 0.3);
  transform: translateX(2px);
}

.smart-action-btn:hover::before {
  left: 100%;
}

.smart-action-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #2563eb;
  flex-shrink: 0;
}

.smart-action-content {
  flex: 1;
}

.smart-action-label {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.125rem;
}

.smart-action-description {
  font-size: 0.875rem;
  color: #6b7280;
}


/* Learn More Button */
.learn-more-btn {
  color: #2563eb;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.learn-more-btn:hover {
  color: #1d4ed8;
}

.learn-more-btn::after {
  content: '→';
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.learn-more-btn:hover::after {
  transform: translateX(2px);
}
</style>
