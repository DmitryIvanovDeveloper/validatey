<template>
  <div class="research-tab-view">
    <PageHeader
      title="Research Canvas"
      subtitle="AI-powered market and competitive research"
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: `/projects/${projectId}` },
        { label: 'Research' }
      ]"
    >
      <template #actions>
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">
          <span class="btn-icon" aria-hidden="true">←</span> Back
        </router-link>
      </template>
    </PageHeader>

    <nav class="invitations-tabs" role="tablist">
      <button type="button" role="tab" :class="{ active: activeTab === 'quick-start' }" @click="activeTab = 'quick-start'">Quick Start</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'market' }" @click="activeTab = 'market'">Market Analysis</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'competitors' }" @click="activeTab = 'competitors'">Competitors</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">Search Suggestions</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'signals' }" @click="activeTab = 'signals'">User Signals</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'synthesis' }" @click="activeTab = 'synthesis'">Synthesis</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'assistant' }" @click="activeTab = 'assistant'">AI Assistant</button>
    </nav>

    <div class="invitations-tab-panel">
      <!-- Tab Content -->
      <QuickStartTab
        v-if="activeTab === 'quick-start'"
        :project-id="projectId"
        :recommended-template="recommendedTemplate"
        :collect-loading="collectLoading"
        :collect-error="collectError"
        :synthesis-error="synthesisError"
        @start-research="handleStartResearch"
      />
      <MarketAnalysisTab v-if="activeTab === 'market'" :key="canvasKey" :canvas="canvas" />
      <CompetitorsTab v-if="activeTab === 'competitors'" :key="canvasKey" :canvas="canvas" />
      <SearchSuggestionsTab v-if="activeTab === 'search'" :key="canvasKey" :insights="canvas?.autocompleteInsights" />
      <UserSignalsTab v-if="activeTab === 'signals'" :insights="canvas?.userInsights" :project-id="projectId" />
      <SynthesisTab v-if="activeTab === 'synthesis'" :key="synthesisReport ? 'has-report' : 'no-report'" :synthesis-report="synthesisReport" />
      <AIAssistantTab v-if="activeTab === 'assistant'" :project-id="projectId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import QuickStartTab from './components/QuickStartTab.vue';
import MarketAnalysisTab from './components/MarketAnalysisTab.vue';
import CompetitorsTab from './components/CompetitorsTab.vue';
import SearchSuggestionsTab from './components/SearchSuggestionsTab.vue';
import UserSignalsTab from './components/UserSignalsTab.vue';
import SynthesisTab from './components/SynthesisTab.vue';
import AIAssistantTab from './components/AIAssistantTab.vue';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);

const activeTab = ref<'quick-start' | 'market' | 'competitors' | 'search' | 'signals' | 'synthesis' | 'assistant'>('quick-start');

const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

const loading = ref(true);
const error = ref<string | null>(null);
const canvas = ref<ResearchCanvas | null>(null);
const synthesisReport = ref<SynthesisReport | null>(null);
const collectLoading = ref(false);
const collectError = ref<string | null>(null);
const synthesisLoading = ref(false);
const synthesisError = ref<string | null>(null);
const recommendedTemplate = ref<{ name: string; slug: string; description: string } | null>(null);
const projectHypothesis = ref<string | null>(null);

// Computed properties for UI state
const hasMarketData = computed(() => {
  const m = canvas.value?.marketData;
  return !!(m && (m.size || m.growth || (m.trends && m.trends.length)));
});

const hasCompetitorData = computed(() => {
  const c = canvas.value?.competitorInfo;
  return !!(c && (c.competitors?.length || c.priceRange || c.rating));
});

const hasUserInsights = computed(() => {
  const u = canvas.value?.userInsights;
  return !!(u && (u.topPains?.length || u.wtp || u.retentionHint));
});

const hasAutocompleteInsights = computed(() => {
  const a = canvas.value?.autocompleteInsights;
  return !!(a && a.results?.length && a.results.some((r) => r.suggestions?.length));
});

// Force re-render of tab components when canvas changes
const canvasKey = computed(() => {
  return canvas.value ? JSON.stringify(canvas.value) : 'empty';
});

// Business logic functions
async function loadCanvas() {
  if (!projectId.value) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await presenter.getResearchCanvas(projectId.value);
    // Handle nested canvas structure from backend
    const canvasData = result.canvas?.canvas || result.canvas;
    canvas.value = { ...canvasData }; // Ensure reactivity
    synthesisReport.value = result.synthesisReport ?? null;
    recommendedTemplate.value = result.recommendedTemplate ?? null;
    projectHypothesis.value = result.projectHypothesis ?? null;
    if (result.error) {
      error.value = result.error;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load research canvas';
  } finally {
    loading.value = false;
  }
}

async function collectData(geography?: string, segment?: string) {
  if (!projectId.value) return;

  collectLoading.value = true;
  collectError.value = null;

  try {
    let intent: ResearchIntent = {
      hypothesis: projectHypothesis.value || 'Product hypothesis',
    };

    if (geography?.trim()) {
      intent = {
        ...intent,
        geography: geography.trim(),
      };
    }

    if (segment?.trim()) {
      intent = {
        ...intent,
        segment: segment.trim(),
      };
    }

    const result = await presenter.collectResearchData(projectId.value, intent);

    if (result.error) {
      collectError.value = result.error;
    } else {
      // Reload canvas data after successful collection
      await loadCanvas();
      // Auto-generate synthesis after collecting data
      await generateSynthesis();
    }
  } catch (err) {
    collectError.value = err instanceof Error ? err.message : 'Failed to collect research data';
  } finally {
    collectLoading.value = false;
  }
}

async function generateSynthesis() {
  if (!projectId.value) return;

  synthesisLoading.value = true;
  synthesisError.value = null;

  try {
    const result = await presenter.generateSynthesis(projectId.value);
    if (result.report) {
      // Handle nested report structure from backend
      synthesisReport.value = result.report.report || result.report;
    }
    // Don't show synthesis errors in UI - synthesis is optional in test environments
  } catch (err) {
    // Synthesis is optional - don't show errors to user
  } finally {
    synthesisLoading.value = false;
  }
}

// Event handlers
const handleStartResearch = (geography?: string, segment?: string) => {
  collectData(geography, segment);
};

// Initialize
onMounted(async () => {
  await loadCanvas();
});
</script>

<style scoped>
.research-tab-view {
  padding: 0;
  max-width: var(--content-max-width, 56rem);
}

.invitations-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.invitations-tabs button {
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.invitations-tabs button:hover {
  color: var(--color-text);
}

.invitations-tabs button.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.invitations-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>