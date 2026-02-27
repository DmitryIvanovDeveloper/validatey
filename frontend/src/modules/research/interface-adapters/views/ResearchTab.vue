<template>
  <div class="research-tab-view">
    <PageHeader
      :title="presenter.labels.title"
      :subtitle="presenter.labels.subtitle"
      :breadcrumbs="[
        { label: presenter.labels.breadcrumbProjects, path: '/projects' },
        { label: presenter.labels.breadcrumbProject, path: `/projects/${projectId}` },
        { label: presenter.labels.breadcrumbResearch }
      ]"
    >
      <template #actions>
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">
          <span class="btn-icon" aria-hidden="true">←</span> {{ presenter.labels.back }}
        </router-link>
        <button
          @click="handleStartResearch"
          :disabled="presenter.viewModel.researchLoading"
          class="btn btn-research-primary"
        >
          <span class="btn-icon" v-if="presenter.viewModel.researchLoading" aria-hidden="true">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          <span class="btn-icon" v-else aria-hidden="true">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </span>
          {{ getButtonText }}
        </button>
      </template>
    </PageHeader>

    <!-- Research Settings -->
    <div class="research-settings-section">
      <div class="section-card settings-card">
        <div class="section-card-header">
          <span class="section-icon section-icon-target" aria-hidden="true">
            <Target class="w-5 h-5" />
          </span>
          <div>
            <h3 class="section-title">{{ presenter.labels.researchSettings }}</h3>
            <p class="section-subtitle">{{ presenter.labels.researchSettingsSubtitle }}</p>
          </div>
        </div>

        <div class="settings-form">
          <div class="input-group">
            <input
              v-model="researchGeography"
              type="text"
              class="input-field"
              :placeholder="presenter.labels.geographyPlaceholder"
              :disabled="presenter.viewModel.researchLoading"
            />
            <input
              v-model="researchSegment"
              type="text"
              class="input-field"
              :placeholder="presenter.labels.segmentPlaceholder"
              :disabled="presenter.viewModel.researchLoading"
            />
          </div>
        </div>
      </div>
    </div>

    <nav class="invitations-tabs" role="tablist">
      <button type="button" role="tab" :class="{ active: activeTab === 'competitors' }" @click="activeTab = 'competitors'">{{ presenter.labels.tabCompetitors }}</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">{{ presenter.labels.tabSearch }}</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'signals' }" @click="activeTab = 'signals'">{{ presenter.labels.tabSignals }}</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'synthesis' }" @click="activeTab = 'synthesis'">{{ presenter.labels.tabSynthesis }}</button>
      <button type="button" role="tab" :class="{ active: activeTab === 'assistant' }" @click="activeTab = 'assistant'">{{ presenter.labels.tabAssistant }}</button>
    </nav>

    <div class="invitations-tab-panel">
      <!-- Tab Content -->
      <CompetitorsTab v-if="activeTab === 'competitors'" :key="canvasKey" :canvas="canvas" />
      <SearchSuggestionsTab v-if="activeTab === 'search'" :key="canvasKey" :insights="canvas?.autocompleteInsights" />
      <UserSignalsTab v-if="activeTab === 'signals'" :insights="canvas?.userInsights" :project-id="projectId" />
      <SynthesisTab v-if="activeTab === 'synthesis'" :key="'synthesis-' + (synthesisReport ? JSON.stringify(synthesisReport) : 'no-report')" :synthesis-report="synthesisReport" @start-research="handleStartResearch" />
      <AIAssistantTab v-if="activeTab === 'assistant'" :project-id="projectId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import CompetitorsTab from './components/CompetitorsTab.vue';
import SearchSuggestionsTab from './components/SearchSuggestionsTab.vue';
import UserSignalsTab from './components/UserSignalsTab.vue';
import SynthesisTab from './components/SynthesisTab.vue';
import AIAssistantTab from './components/AIAssistantTab.vue';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { Target } from 'lucide-vue-next';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);

const activeTab = ref<'competitors' | 'search' | 'signals' | 'synthesis' | 'assistant'>('competitors');

const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

const loading = ref(true);
const error = ref<string | null>(null);
const canvas = ref<ResearchCanvas | null>(null);
const synthesisReport = ref<SynthesisReport | null>(null);
const collectError = ref<string | null>(null);
const synthesisLoading = ref(false);
const synthesisError = ref<string | null>(null);
const recommendedTemplate = ref<{ name: string; slug: string; description: string } | null>(null);
const projectHypothesis = ref<string | null>(null);

// Computed properties for UI state
const hasCompetitorData = computed(() => {
  const c = canvas.value?.competitorInfo;
  return !!(c && (c.competitors?.length || c.priceRange || c.rating));
});

const getButtonText = computed(() => {
  if (presenter.viewModel.commentsOnlyLoading && !presenter.viewModel.researchLoading) {
    return presenter.labels.collectingComments;
  }
  if (presenter.viewModel.researchLoading) {
    if (presenter.viewModel.commentsFetching) {
      return presenter.labels.researchingComments;
    }
    return presenter.labels.researching;
  }
  return presenter.labels.startResearch;
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

// Research settings
const researchGeography = ref('');
const researchSegment = ref('');

// Business logic functions
async function loadCanvas() {
  if (!projectId.value) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await presenter.getResearchCanvas(projectId.value);
    // Handle nested canvas structure from backend
    const canvasData = result.canvas;
    canvas.value = { ...canvasData }; // Ensure reactivity

    // Only update synthesisReport if we got a valid one from backend
    // Don't overwrite existing synthesisReport with null
    if (result.synthesisReport) {
      synthesisReport.value = result.synthesisReport;
    }

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

  // researchLoading will be set by event handlers
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
      // Handle COOLDOWN error object
      if (typeof result.error === 'object' && result.error && 'type' in result.error && result.error.type === 'COOLDOWN') {
        collectError.value = `Research is on cooldown. ${result.error.formattedTimeRemaining}`;
      } else {
        // Handle string error
        collectError.value = result.error as string;
      }
    } else {
      // Reload canvas data after successful collection
      await loadCanvas();
      // Auto-generate synthesis after collecting data
      await generateSynthesis();
    }
  } catch (err) {
    collectError.value = err instanceof Error ? err.message : 'Failed to collect research data';
  } finally {
    // collectLoading is now managed by presenter.viewModel.researchLoading
  }
}

async function generateSynthesis() {
  if (!projectId.value) return;

  synthesisLoading.value = true;
  synthesisError.value = null;

  try {
    const result = await presenter.generateSynthesis(projectId.value);
    if (result.report) {
      synthesisReport.value = result.report;
    } else {
      // If synthesis generation failed but we have existing data, keep it
      // Don't overwrite existing synthesisReport with null
      console.warn('Synthesis generation returned no report', { projectId: projectId.value });
    }
  } catch (err) {
    // Synthesis is optional - don't show errors to user
    console.warn('Synthesis generation failed', { projectId: projectId.value, error: err });
  } finally {
    synthesisLoading.value = false;
  }
}

// Event handlers
const handleStartResearch = () => {
  collectData(researchGeography.value || undefined, researchSegment.value || undefined);
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

.research-settings-section {
  margin-bottom: 2rem;
}

.settings-card {
  background: var(--color-bg);
  border: var(--border-width) var(--border-style) var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
  padding: 1.5rem;
}

.settings-card:hover {
  box-shadow: var(--shadow-md);
}

.section-icon-target {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.settings-form {
  padding: 0;
}

.btn-research-primary {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}

.btn-research-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}

.btn-research-primary:active {
  transform: translateY(0);
}

.btn-research-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.input-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.input-field {
  flex: 1;
  min-width: 12rem;
  padding: 0.75rem 1rem;
  border: var(--border-width) var(--border-style) var(--color-border-light);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .input-group {
    flex-direction: column;
  }

  .input-field {
    width: 100%;
  }
}

.btn-research-primary .btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.invitations-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
}

.invitations-tabs button {
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: var(--border-width) var(--border-style) transparent;
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