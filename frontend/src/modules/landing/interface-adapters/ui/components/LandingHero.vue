<template>
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <div class="hero-text">
          <div class="hero-badge">{{ labels.badge }}</div>
          
          <h1 class="hero-headline">
            {{ labels.headline }}
            <span class="highlight"> {{ labels.headlineHighlight }}</span>
          </h1>
          
          <p class="hero-subheadline">
            {{ labels.subheadline }}
          </p>
          
          <div class="hero-cta">
            <WishlistWidget />
            <a href="#how-it-works" class="btn-secondary-large">
              <svg class="icon-play" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ labels.seeHowItWorks }}
            </a>
          </div>

          <div class="hero-benefits">
            <div class="benefit-item">
              <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>{{ labels.noCreditCard }}</span>
            </div>
            <div class="benefit-item">
              <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>{{ labels.resultsInDays }}</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="dashboard-card">
            <div class="dashboard-header">
              <h3>{{ labels.validationDashboard }}</h3>
              <div v-if="dashboardData" class="badge-live">{{ labels.live }}</div>
            </div>
            
            <div v-if="dashboardData" class="dashboard-content">
              <div v-if="dashboardData.projectName" class="dashboard-project-name">
                {{ dashboardData.projectName }}
              </div>
              
              <div class="dashboard-metrics-grid">
                <div class="metric-card metric-blue">
                  <div class="metric-value">{{ dashboardData.responseRatePct }}%</div>
                  <div class="metric-label">{{ labels.responseRate }}</div>
                </div>
                <div class="metric-card metric-green">
                  <div class="metric-value">{{ dashboardData.responded }}/{{ dashboardData.sent }}</div>
                  <div class="metric-label">{{ labels.responses }}</div>
                </div>
                <div class="metric-card" :class="dashboardData.statusClass">
                  <div class="metric-value-small">{{ dashboardData.validationStatus }}</div>
                  <div class="metric-label">{{ labels.status }}</div>
                </div>
              </div>

              <div v-if="dashboardData.neededForSignificance !== null || dashboardData.daysRemaining !== null || dashboardData.paceResponsesPerDay !== null" class="dashboard-additional-metrics">
                <div v-if="dashboardData.progressPct !== null" class="progress-item">
                  <div class="progress-label">{{ labels.progressToGoal }}</div>
                  <ProgressBar
                    :percentage="Math.min(100, dashboardData.progressPct ?? 0)"
                    show-label
                    :label="`${dashboardData.responded}/${(dashboardData.neededForSignificance || 0) + dashboardData.responded} responses`"
                    size="md"
                  />
                </div>
                <div v-if="dashboardData.paceResponsesPerDay !== null && dashboardData.paceResponsesPerDay > 0" class="metric-row">
                  <span class="metric-row-label">Pace:</span>
                  <span class="metric-row-value">{{ dashboardData.paceResponsesPerDay.toFixed(1) }} responses/day</span>
                </div>
                <div v-if="dashboardData.daysRemaining !== null" class="metric-row">
                  <span class="metric-row-label">Days remaining:</span>
                  <span class="metric-row-value">{{ dashboardData.daysRemaining }} days</span>
                </div>
                <div v-if="dashboardData.neededForSignificance !== null && dashboardData.neededForSignificance > 0" class="metric-row">
                  <span class="metric-row-label">Needed for significance:</span>
                  <span class="metric-row-value">{{ dashboardData.neededForSignificance }} more</span>
                </div>
              </div>

              <div v-if="dashboardData.aiVerdict" class="dashboard-ai-verdict">
                <div class="ai-verdict-icon">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div class="ai-verdict-text">
                  <div class="ai-verdict-label">AI Verdict</div>
                  <div class="ai-verdict-content">{{ dashboardData.aiVerdict }}</div>
                </div>
              </div>

              <div v-if="dashboardData.keyInsight" class="dashboard-insight">
                <div class="insight-label">Key Insight</div>
                <div class="insight-content">{{ dashboardData.keyInsight }}</div>
              </div>
            </div>
            
            <div v-else class="dashboard-placeholder">
              <svg class="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="placeholder-text">Your validation metrics will appear here</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { sessionManager } from '@/shared/services/session-manager';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '@/infrastructure/bootstrap/types';
import type { HttpClientPort } from '@/infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import WishlistWidget from '@/modules/wishlist/interface-adapters/components/WishlistWidget.vue';
import ProgressBar from '@/shared/components/ProgressBar.vue';
import { DEFAULT_LANDING_LABELS } from '../landing-default-labels';

const props = withDefaults(
  defineProps<{ labels?: Partial<typeof DEFAULT_LANDING_LABELS.hero>>()>(),
  () => ({})
);
const labels = computed(() => ({ ...DEFAULT_LANDING_LABELS.hero, ...props.labels }));

const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

interface DashboardData {
  responded: number;
  sent: number;
  responseRatePct: number;
  validationStatus: string;
  statusClass: string;
  aiVerdict: string | null;
  keyInsight: string | null;
  neededForSignificance: number | null;
  daysRemaining: number | null;
  paceResponsesPerDay: number | null;
  projectName: string | null;
  progressPct: number | null;
}

const dashboardData = ref<DashboardData | null>(null);
const loading = ref(false);

async function loadDashboardData() {
  const session = sessionManager.currentSession;
  
      // If not authenticated, show demo data
      if (!session?.user?.id) {
        dashboardData.value = {
          responded: 24,
          sent: 30,
          responseRatePct: 80,
          validationStatus: 'Validated',
          statusClass: 'metric-green',
          aiVerdict: 'Strong validation signal. 80% of respondents confirmed the problem and expressed willingness to pay.',
          keyInsight: 'Target segment shows high engagement with 24 responses in 2 days. Primary pain point validated by 18 respondents.',
          neededForSignificance: null,
          daysRemaining: 5,
          paceResponsesPerDay: 12.0,
          projectName: 'SaaS Product Validation',
          progressPct: 75
        };
        return;
      }

  loading.value = true;
  try {
    // Get user's first project
    const projectsUrl = API_CONFIG.ENDPOINTS.PROJECTS;
    const projects = await httpClient.get<Array<{ id: string }>>(projectsUrl);
    
    if (!projects || projects.length === 0) {
      // No projects, show demo data
      dashboardData.value = {
        responded: 24,
        sent: 30,
        responseRatePct: 80,
        validationStatus: 'Validated',
        statusClass: 'metric-green',
        aiVerdict: 'Strong validation signal. 80% of respondents confirmed the problem and expressed willingness to pay.',
        keyInsight: 'Target segment shows high engagement with 24 responses in 2 days. Primary pain point validated by 18 respondents.',
        neededForSignificance: null,
        daysRemaining: 5,
        paceResponsesPerDay: 12.0,
        projectName: 'SaaS Product Validation',
        progressPct: 75
      };
      return;
    }

    // Get overview data for first project
    const firstProjectId = projects[0].id;
    const overviewUrl = API_CONFIG.ENDPOINTS.OVERVIEW(firstProjectId);
    const overview = await httpClient.get<{
      executiveSummary: {
        projectName: string;
        responded: number;
        sent: number;
        responseRatePct: number;
        validationStatus: string;
        keyInsight: string | null;
        aiVerdict: string | null;
        neededForSignificance: number | null;
        daysRemaining: number | null;
        paceResponsesPerDay: number;
      };
    }>(overviewUrl);

    if (!overview?.executiveSummary) {
      // No overview data, show demo data
      dashboardData.value = {
        responded: 24,
        sent: 30,
        responseRatePct: 80,
        validationStatus: 'Validated',
        statusClass: 'metric-green',
        aiVerdict: 'Strong validation signal. 80% of respondents confirmed the problem and expressed willingness to pay.',
        keyInsight: 'Target segment shows high engagement with 24 responses in 2 days. Primary pain point validated by 18 respondents.',
        neededForSignificance: null,
        daysRemaining: 5,
        paceResponsesPerDay: 12.0,
        projectName: 'SaaS Product Validation',
        progressPct: 75
      };
      return;
    }

    const summary = overview.executiveSummary;
    
    // Map validation status to display text and CSS class
    const statusMap: Record<string, { text: string; class: string }> = {
      'validated': { text: 'Validated', class: 'metric-green' },
      'weak_support': { text: 'Weak Support', class: 'metric-orange' },
      'unclear_signal': { text: 'Unclear', class: 'metric-yellow' },
      'not_supported': { text: 'Not Supported', class: 'metric-red' }
    };
    
    const statusInfo = statusMap[summary.validationStatus] || { text: summary.validationStatus, class: 'metric-gray' };
    
    // Calculate progress percentage if neededForSignificance is available
    const significanceTarget = summary.neededForSignificance !== null 
      ? summary.responded + summary.neededForSignificance 
      : null;
    const progressPct = significanceTarget && significanceTarget > 0
      ? Math.round((summary.responded / significanceTarget) * 100)
      : null;

    dashboardData.value = {
      responded: summary.responded,
      sent: summary.sent,
      responseRatePct: summary.responseRatePct,
      validationStatus: statusInfo.text,
      statusClass: statusInfo.class,
      aiVerdict: summary.aiVerdict,
      keyInsight: summary.keyInsight,
      neededForSignificance: summary.neededForSignificance,
      daysRemaining: summary.daysRemaining,
      paceResponsesPerDay: summary.paceResponsesPerDay || null,
      projectName: summary.projectName || null,
      progressPct: progressPct
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    // On error, show demo data
    dashboardData.value = {
      responded: 24,
      sent: 30,
      responseRatePct: 80,
      validationStatus: 'Validated',
      statusClass: 'metric-green',
      aiVerdict: 'Strong validation signal. 80% of respondents confirmed the problem and expressed willingness to pay.',
      keyInsight: 'Target segment shows high engagement with 24 responses in 2 days. Primary pain point validated by 18 respondents.',
      neededForSignificance: null,
      daysRemaining: 5,
      paceResponsesPerDay: 12.0,
      projectName: 'SaaS Product Validation',
      progressPct: 75
    };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.hero-section {
  padding-top: 8rem;
  padding-bottom: 5rem;
  background: var(--color-bg, #ffffff);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
  .hero-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
  }
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-subtle, #e2e8f0);
  color: var(--color-text-muted, #475569);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  width: fit-content;
}

.hero-headline {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text, #0f172a);
}

@media (min-width: 640px) {
  .hero-headline {
    font-size: 3.75rem;
  }
}

@media (min-width: 1024px) {
  .hero-headline {
    font-size: 4.5rem;
  }
}

.highlight {
  color: var(--color-accent, #0d9488);
}

.hero-subheadline {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--color-text-muted, #475569);
}

.hero-cta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .hero-cta {
    flex-direction: row;
  }
}

.btn-primary-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  background-color: var(--color-accent, #0d9488);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md, 0.625rem);
  font-size: 1.125rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary-large:hover {
  background-color: var(--color-accent-hover, #0f766e);
}

.icon-arrow {
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.5rem;
}

.btn-secondary-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  border: 2px solid var(--color-border, #cbd5e1);
  color: var(--color-text-muted, #475569);
  text-decoration: none;
  border-radius: var(--radius-md, 0.625rem);
  font-size: 1.125rem;
  font-weight: 600;
  transition: border-color 0.2s, color 0.2s;
}

.btn-secondary-large:hover {
  border-color: var(--color-accent, #0d9488);
  color: var(--color-accent, #0d9488);
}

.icon-play {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}

.hero-benefits {
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-check {
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
}

.hero-visual {
  position: relative;
  margin-top: 3rem;
}

@media (min-width: 1024px) {
  .hero-visual {
    margin-top: 0;
  }
}

.dashboard-card {
  background: var(--color-bg, #ffffff);
  border-radius: var(--radius-xl, 1rem);
  padding: 1.5rem;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06));
  border: 1px solid var(--color-border, #cbd5e1);
  position: relative;
  z-index: 10;
  max-width: 420px;
  width: 100%;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.dashboard-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  letter-spacing: -0.01em;
}

.badge-live {
  padding: 0.25rem 0.625rem;
  background-color: var(--color-success-bg, #d1fae5);
  color: var(--color-success, #059669);
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-project-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.dashboard-additional-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light, #e2e8f0);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted, #475569);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}

.metric-row-label {
  color: var(--color-text-muted, #475569);
  font-weight: 500;
}

.metric-row-value {
  color: var(--color-text, #0f172a);
  font-weight: 600;
}

.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.metric-card {
  padding: 0.875rem 0.75rem;
  border-radius: var(--radius-md, 0.625rem);
  background-color: var(--color-bg-elevated, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  text-align: center;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: var(--color-border, #cbd5e1);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.06));
}

.metric-blue {
  background-color: var(--color-bg-elevated, #f8fafc);
}

.metric-green {
  background-color: var(--color-bg-elevated, #f8fafc);
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.metric-blue .metric-value {
  color: var(--color-accent, #0d9488);
}

.metric-green .metric-value {
  color: var(--color-success, #059669);
}

.metric-label {
  font-size: 0.6875rem;
  color: var(--color-text-muted, #475569);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value-small {
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.metric-orange .metric-value-small {
  color: var(--color-warning, #d97706);
}

.metric-yellow .metric-value-small {
  color: #eab308;
}

.metric-red .metric-value-small {
  color: var(--color-error, #dc2626);
}

.metric-gray .metric-value-small {
  color: var(--color-text-subtle, #94a3b8);
}

.dashboard-ai-verdict {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: var(--color-bg-elevated, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-left: 3px solid var(--color-accent, #0d9488);
  border-radius: var(--radius-md, 0.625rem);
  padding: 0.875rem;
}

.ai-verdict-icon {
  color: var(--color-accent, #0d9488);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.ai-verdict-icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

.ai-verdict-text {
  flex: 1;
  min-width: 0;
}

.ai-verdict-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-accent, #0d9488);
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ai-verdict-content {
  font-size: 0.8125rem;
  color: var(--color-text, #0f172a);
  line-height: 1.5;
  font-weight: 400;
}

.dashboard-insight {
  background-color: var(--color-bg-elevated, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-left: 3px solid var(--color-accent, #0d9488);
  border-radius: var(--radius-md, 0.625rem);
  padding: 0.875rem;
}

.insight-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-accent, #0d9488);
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.insight-content {
  font-size: 0.8125rem;
  color: var(--color-text, #0f172a);
  line-height: 1.5;
  font-weight: 400;
}

.dashboard-willingness {
  margin-bottom: 0;
}

.willingness-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  color: #4b5563;
}

.willingness-amount {
  font-weight: 600;
  color: #111827;
}

.dashboard-email {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: var(--color-bg-subtle, #e2e8f0);
  border-radius: 0.5rem;
}

.email-content {
  flex: 1;
}

.email-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 0.25rem;
}

.email-label {
  font-size: 0.875rem;
  color: #92400e;
}

.email-icon {
  width: 3rem;
  height: 3rem;
  background-color: #fbbf24;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
}

.email-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.dashboard-recommendation {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.recommendation-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #d1fae5;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #059669;
  flex-shrink: 0;
}

.recommendation-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.recommendation-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
  margin-bottom: 0.25rem;
}

.recommendation-subtitle {
  font-size: 0.75rem;
  color: #4b5563;
}

.dashboard-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 2rem 1rem;
  color: var(--color-text-subtle, #94a3b8);
}

.placeholder-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.3;
  color: var(--color-text-subtle, #94a3b8);
}

.placeholder-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #475569);
  text-align: center;
  font-weight: 400;
}

</style>
