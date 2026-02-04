<template>
  <div class="project-report-view">
    <header class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep">/</span>
        <router-link :to="`/projects/${projectId}`" class="breadcrumb-link">Project</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Report</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">Project Report</h1>
        <div class="header-actions">
          <button type="button" @click="downloadReport('html')" class="btn btn-secondary">Download HTML</button>
          <button type="button" @click="downloadReport('pdf')" class="btn btn-secondary">Download PDF</button>
          <button type="button" @click="shareReport" class="btn btn-primary">Share</button>
          <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back</router-link>
        </div>
      </div>
      <p class="page-subtitle">Validation results and recommendations</p>
    </header>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Generating report...</p>
    </div>

    <div v-else-if="error" class="report-state">
      <EmptyState
        v-if="error === NOT_ENOUGH_RESPONSES_MESSAGE"
        :title="'Not enough responses yet'"
        :description="'Collect more survey responses to generate your validation report. Then try again or go back to the project to track progress.'"
        :icon="true"
      >
        <template #icon>
          <svg class="report-empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8" y="32" width="12" height="24" rx="2" fill="currentColor" opacity="0.3"/>
            <rect x="26" y="20" width="12" height="36" rx="2" fill="currentColor" opacity="0.5"/>
            <rect x="44" y="12" width="12" height="44" rx="2" fill="currentColor" opacity="0.8"/>
            <path d="M14 32v24M32 20v36M50 12v44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          </svg>
        </template>
        <template #action>
          <div class="report-empty-actions">
            <button @click="generateReport" class="btn btn-primary btn-lg">Try again</button>
            <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back to project</router-link>
          </div>
        </template>
      </EmptyState>
      <div v-else class="error-state">
        <ErrorDisplay :message="error" />
        <button @click="generateReport" class="btn btn-primary">Retry</button>
      </div>
    </div>

    <div v-else-if="report" class="report-content">
      <!-- Verdict -->
      <Card class="verdict-card" :class="`verdict-${report.verdictType}`">
        <template #header>
          <h2 class="verdict-title">Verdict</h2>
        </template>
        <div class="verdict-content">
          <div class="verdict-icon">{{ getVerdictIcon(report.verdictType) }}</div>
          <p class="verdict-text">{{ report.verdict }}</p>
        </div>
      </Card>

      <!-- Metrics -->
      <Card title="Key Metrics" class="metrics-card">
        <div class="metrics-grid">
          <div v-for="(value, key) in report.metrics" :key="key" class="metric-item">
            <div class="metric-label">{{ formatMetricLabel(key) }}</div>
            <div class="metric-value">{{ formatMetricValue(value) }}</div>
          </div>
        </div>
      </Card>

      <!-- WTP (Willingness to Pay) -->
      <Card title="Willingness to Pay (WTP)" class="wtp-card">
        <div class="wtp-content">
          <div class="wtp-value">${{ report.wtp.toFixed(2) }}</div>
          <p class="wtp-description">Average willingness of target audience to pay for the solution</p>
        </div>
      </Card>

      <!-- Clusters -->
      <Card title="Respondent Clusters" class="clusters-card">
        <div class="clusters-list">
          <div
            v-for="(cluster, index) in Object.entries(report.clusters)"
            :key="index"
            class="cluster-item"
          >
            <div class="cluster-header">
              <h3 class="cluster-name">Cluster {{ index + 1 }}: {{ cluster[0] }}</h3>
              <span class="cluster-size">{{ cluster[1].size }} respondents</span>
            </div>
            <div class="cluster-details">
              <div v-for="stat in clusterStatEntries(cluster[1])" :key="stat.key" class="cluster-stat">
                <span class="stat-label">{{ stat.key }}:</span>
                <span class="stat-value">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Alternatives -->
      <Card title="Alternative Solutions" class="alternatives-card">
        <ul class="alternatives-list">
          <li v-for="(alt, index) in report.alternatives" :key="index" class="alternative-item">
            {{ alt }}
          </li>
        </ul>
      </Card>

      <!-- Recommendations -->
      <Card title="Recommendations" class="recommendations-card">
        <ol class="recommendations-list">
          <li v-for="(rec, index) in report.recommendations" :key="index" class="recommendation-item">
            {{ rec }}
          </li>
        </ol>
      </Card>

      <!-- Actions -->
      <div class="report-actions">
        <button @click="createNewHypothesis" class="btn btn-primary btn-large">
          ✨ Create New Round/Hypothesis
        </button>
      </div>
    </div>

    <Toast
      :show="showCopyToast"
      :message="copyToastMessage"
      @dismiss="showCopyToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import Toast from '@/shared/components/Toast.vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/project-reports/infrastructure/bootstrap/types';
import type { ReportRepositoryPort, ReportViewData } from '@/modules/project-reports/application/ports/report-repository.port';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const reportRepository = container.get<ReportRepositoryPort>(TYPES.ReportRepository);

const loading = ref(true);
const error = ref<string | null>(null);
const report = ref<ReportViewData | null>(null);

const getVerdictIcon = (type: string): string => {
  const icons: Record<string, string> = {
    positive: '✅',
    negative: '❌',
    neutral: '⚠️',
  };
  return icons[type] || 'ℹ️';
};

const formatMetricLabel = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatMetricValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

function clusterStatEntries(obj: Record<string, unknown> | null | undefined): { key: string; value: unknown }[] {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj)
    .filter(([k]) => k !== 'size')
    .map(([key, value]) => ({ key, value }));
}

const NOT_ENOUGH_RESPONSES_MESSAGE = 'Not enough responses for report';

const generateReport = async () => {
  loading.value = true;
  error.value = null;
  report.value = null;
  const result = await reportRepository.get(projectId);
  loading.value = false;
  if (result.isSuccess) {
    report.value = result.data;
  } else {
    error.value = NOT_ENOUGH_RESPONSES_MESSAGE;
  }
};

const downloadReport = async (format: 'html' | 'pdf') => {
  // TODO: Implement report download
  console.log(`Downloading report as ${format}`);
};

const shareReport = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Project Report',
        text: 'Check out the hypothesis validation results',
        url: window.location.href,
      });
      copyToastMessage.value = 'Share dialog opened';
      showCopyToast.value = true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        copyToastMessage.value = 'Link copied to clipboard';
        await navigator.clipboard.writeText(window.location.href).catch(() => {});
        showCopyToast.value = true;
      }
    }
  } else {
    await navigator.clipboard.writeText(window.location.href);
    copyToastMessage.value = 'Link copied to clipboard';
    showCopyToast.value = true;
  }
};

const createNewHypothesis = () => {
  router.push(`/projects/new`);
};

onMounted(() => {
  generateReport();
});
</script>

<style scoped>
.project-report-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-8);
}

.page-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 2px solid var(--color-border-light);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: var(--color-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover { color: var(--color-accent); }

.breadcrumb-sep { opacity: 0.5; }

.breadcrumb-current { color: var(--color-text); font-weight: 600; }

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
}

.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.report-state {
  padding: 2rem 0;
}

.report-empty-icon {
  width: 80px;
  height: 80px;
  color: var(--color-accent, #0d9488);
  opacity: 0.85;
}

.report-empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.report-empty-actions .btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}


.verdict-card {
  border-left: 6px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.verdict-positive {
  border-left-color: var(--color-success);
  background: linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-bg) 50%);
}

.verdict-negative {
  border-left-color: var(--color-error);
  background: linear-gradient(135deg, var(--color-error-bg) 0%, var(--color-bg) 50%);
}

.verdict-neutral {
  border-left-color: var(--color-warning);
  background: linear-gradient(135deg, var(--color-warning-bg) 0%, var(--color-bg) 50%);
}

.verdict-content {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.verdict-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.verdict-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-item {
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.wtp-content {
  text-align: center;
  padding: 2rem;
}

.wtp-value {
  font-size: 3rem;
  font-weight: 700;
  color: #4299e1;
  margin-bottom: 0.5rem;
}

.wtp-description {
  color: #718096;
  font-size: 1rem;
  margin: 0;
}

.clusters-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cluster-item {
  padding: 1.5rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cluster-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.cluster-size {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

.cluster-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.cluster-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.stat-value {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
}

.alternatives-list,
.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.alternative-item,
.recommendation-item {
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-warning);
}

.recommendation-item {
  counter-increment: recommendation;
  position: relative;
  padding-left: 3.5rem;
}

.recommendations-list {
  counter-reset: recommendation;
}

.recommendation-item::before {
  content: counter(recommendation);
  position: absolute;
  left: 1rem;
  top: 1rem;
  width: 26px;
  height: 26px;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.report-actions {
  margin-top: 2.5rem;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
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

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover {
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
}

</style>
