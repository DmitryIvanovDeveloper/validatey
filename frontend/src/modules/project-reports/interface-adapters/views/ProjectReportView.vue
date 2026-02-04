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

    <div v-else-if="error" class="error-state">
      <ErrorDisplay :message="error" />
      <button @click="generateReport" class="btn btn-primary">Generate Report</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const loading = ref(true);
const error = ref<string | null>(null);
const report = ref<{
  verdict: string;
  verdictType: 'positive' | 'negative' | 'neutral';
  metrics: Record<string, any>;
  clusters: Record<string, any>;
  alternatives: string[];
  wtp: number;
  recommendations: string[];
} | null>(null);

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

const generateReport = async () => {
  loading.value = true;
  error.value = null;
  
  // TODO: Call presenter to generate report
  setTimeout(() => {
    loading.value = false;
    // Mock data
    report.value = {
      verdict: 'Hypothesis confirmed with positive signals',
      verdictType: 'positive',
      metrics: {
        response_rate: 0.75,
        satisfaction_score: 4.2,
        nps: 8.5,
      },
      clusters: {
        'Enthusiasts': { size: 45, avg_score: 4.8 },
        'Neutrals': { size: 30, avg_score: 3.2 },
        'Skeptics': { size: 25, avg_score: 2.1 },
      },
      alternatives: [
        'Use existing solution X',
        'Develop a simplified version',
      ],
      wtp: 150.50,
      recommendations: [
        'Focus on the enthusiast cluster',
        'Improve onboarding for skeptics',
        'Consider pricing strategy based on WTP',
      ],
    };
  }, 2000);
};

const downloadReport = async (format: 'html' | 'pdf') => {
  // TODO: Implement report download
  console.log(`Downloading report as ${format}`);
};

const shareReport = () => {
  // TODO: Implement report sharing
  if (navigator.share) {
    navigator.share({
      title: 'Project Report',
      text: 'Check out the hypothesis validation results',
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard');
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
