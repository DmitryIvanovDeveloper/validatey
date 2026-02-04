<template>
  <div class="create-project-wizard">
    <PageHeader
      title="Create New Project"
      subtitle="Define segment, market context, and hypothesis"
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'New Project' }
      ]"
    />
    <div class="wizard-container">
      <Wizard :steps="wizardSteps" @complete="handleComplete" @step-change="handleStepChange">
        <template #default="{ step }">
          <div class="step-content">
            <!-- Step 1: Segment -->
            <div v-if="step === 0" class="step-panel">
              <h2>Step 1: Define Target Segment</h2>
              <p class="step-description">Describe the target audience for your hypothesis</p>
              
              <div class="form-group">
                <label for="segment-description">Segment Description *</label>
                <textarea
                  id="segment-description"
                  v-model="formData.segmentDescription"
                  rows="4"
                  placeholder="Example: Young professionals aged 25-35 working in IT and software development, with 3-7 years of experience, located in major tech hubs. They are early adopters of new technologies and value productivity tools..."
                  class="form-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="segment-demographics">Demographics *</label>
                <textarea
                  id="segment-demographics"
                  v-model="formData.segmentDemographics"
                  rows="3"
                  placeholder="Example: Age: 25-35 | Location: Major cities (SF, NYC, Austin) | Profession: Software engineers, developers | Income: $80k-$150k | Interests: Technology, coding, productivity tools"
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <!-- Step 2: Market Picture -->
            <div v-if="step === 1" class="step-panel">
              <h2>Step 2: Current Market Picture</h2>
              <p class="step-description">Who are the players, what do they offer, who buys from them?</p>
              <div class="form-group">
                <label for="market-picture">Market Picture</label>
                <textarea
                  id="market-picture"
                  v-model="formData.marketPicture"
                  rows="4"
                  placeholder="Describe the current market: main players, their offerings, typical buyers..."
                  class="form-input"
                ></textarea>
              </div>
              <div class="market-context-ai-helper">
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="marketContextSuggestLoading"
                  @click="fetchMarketContextSuggestion"
                >
                  {{ marketContextSuggestLoading ? 'Loading...' : 'Подсказать с помощью ИИ' }}
                </button>
                <p v-if="marketContextSuggestError" class="market-context-ai-error">{{ marketContextSuggestError }}</p>
              </div>
            </div>

            <!-- Step 3: Market Fit -->
            <div v-if="step === 2" class="step-panel">
              <h2>Step 3: How Your Product Fits in the Market</h2>
              <p class="step-description">Share of paying audience, positioning, etc.</p>
              <div class="form-group">
                <label for="market-fit">Market Fit</label>
                <textarea
                  id="market-fit"
                  v-model="formData.marketFit"
                  rows="4"
                  placeholder="How does your product fit in the market? Share of paying audience, positioning..."
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <!-- Step 4: Differentiation -->
            <div v-if="step === 3" class="step-panel">
              <h2>Step 4: How Your Product Differs</h2>
              <p class="step-description">Qualities that attract and win new buyers</p>
              <div class="form-group">
                <label for="differentiation">Differentiation</label>
                <textarea
                  id="differentiation"
                  v-model="formData.differentiation"
                  rows="4"
                  placeholder="How does your product differ? What qualities attract and win new buyers?"
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <!-- Step 5: Hypothesis -->
            <div v-if="step === 4" class="step-panel">
              <h2>Step 5: Formulate Hypothesis</h2>
              <p class="step-description">Describe your product hypothesis and assumptions</p>
              
              <div class="form-group">
                <label for="hypothesis-description">Hypothesis Description *</label>
                <textarea
                  id="hypothesis-description"
                  v-model="formData.hypothesisDescription"
                  rows="5"
                  placeholder="Example: We believe that young IT professionals want to learn new technologies in a gamified, interactive format because traditional online courses are too passive and don't provide enough hands-on practice. They need a platform that combines short lessons with coding challenges and real-time feedback."
                  class="form-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Assumptions *</label>
                <div class="assumptions-list">
                  <div
                    v-for="(assumption, index) in formData.hypothesisAssumptions"
                    :key="index"
                    class="assumption-item"
                  >
                    <input
                      v-model="formData.hypothesisAssumptions[index]"
                      type="text"
                      :placeholder="`Assumption ${index + 1}: e.g., They prefer learning in short 15-30 min sessions`"
                      class="form-input"
                    />
                    <button
                      v-if="formData.hypothesisAssumptions.length > 1"
                      @click="removeAssumption(index)"
                      class="btn-remove"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                  <button @click="addAssumption" class="btn-add" type="button">
                    + Add Assumption
                  </button>
                </div>
              </div>

              <div class="ai-helper">
                <button @click="showAIHelper = true" class="btn-ai-helper" type="button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                  AI Helper for Formulation
                </button>
              </div>
            </div>

            <!-- Step 6: Scenario -->
            <div v-if="step === 5" class="step-panel">
              <h2>Step 6: Edit Scenario</h2>
              <p class="step-description">The scenario will be automatically generated based on your hypothesis</p>
              
              <div v-if="scenarioLoading" class="scenario-generating">
                <LoadingSpinner />
                <p>Generating scenario with AI...</p>
              </div>

              <div v-else-if="scenarioError" class="scenario-error">
                <div class="error-message">{{ scenarioError }}</div>
                <button @click="generateScenario" class="btn btn-secondary">Try Again</button>
              </div>

              <div v-else-if="scenarioContent" class="scenario-editor">
                <ScenarioViewer
                  :content="scenarioContent"
                  @update:content="scenarioContent = $event"
                />
                <button @click="regenerateScenario" class="btn-regenerate" type="button">
                  🔄 Regenerate
                </button>
              </div>
            </div>

            <!-- Step 7: Audience & Pricing -->
            <div v-if="step === 6" class="step-panel">
              <h2>Step 7: Audience & Payment</h2>
              <p class="step-description">Specify project launch parameters</p>
              
              <div class="form-group">
                <label for="project-name">Project Name *</label>
                <input
                  id="project-name"
                  v-model="formData.name"
                  type="text"
                  placeholder="Example: Gamified Learning Platform - IT Professionals"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="audience-size">Audience Size *</label>
                  <input
                    id="audience-size"
                    v-model.number="formData.audienceSize"
                    type="number"
                    min="1"
                    placeholder="100"
                    class="form-input"
                  />
                  <span class="form-hint">Recommended: 100-200 respondents for standard validation</span>
                </div>

                <div class="form-group">
                  <label for="price-per-response">Price per Response *</label>
                  <input
                    id="price-per-response"
                    v-model.number="formData.pricePerResponse"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="8.00"
                    class="form-input"
                  />
                  <span class="form-hint">Standard: $5-10 for 10-15 min surveys</span>
                </div>
              </div>

              <div class="price-summary">
                <div class="price-row">
                  <span>Project Cost:</span>
                  <span class="price-amount">
                    ${{ totalPrice.toFixed(2) }}
                  </span>
                </div>
                <div class="price-hint">
                  {{ formData.audienceSize || 0 }} respondents × ${{ formData.pricePerResponse || 0 }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </Wizard>
    </div>

    <!-- AI Helper Modal -->
    <Modal v-model="showAIHelper" title="AI Helper for Hypothesis Formulation" @update:modelValue="onAIHelperClose">
      <p class="ai-helper-intro">Based on your target segment (Step 1), AI suggests a hypothesis and testable assumptions. Fill Step 1 first for better results.</p>
      <div v-if="aiHelperLoading" class="ai-helper-loading">
        <LoadingSpinner />
        <p>Generating suggestion...</p>
      </div>
      <div v-else-if="aiHelperError" class="ai-helper-error">
        <p>{{ aiHelperError }}</p>
      </div>
      <div v-else-if="aiHelperSuggestion" class="ai-helper-result">
        <div class="form-group">
          <label>Suggested hypothesis</label>
          <p class="suggestion-text">{{ aiHelperSuggestion.description }}</p>
        </div>
        <div class="form-group">
          <label>Suggested assumptions</label>
          <ul class="assumptions-preview">
            <li v-for="(a, i) in aiHelperSuggestion.assumptions" :key="i">{{ a }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <template v-if="aiHelperSuggestion && !aiHelperLoading">
          <button @click="applyAISuggestion" class="btn btn-primary">Apply to form</button>
        </template>
        <button @click="showAIHelper = false" class="btn btn-secondary">Close</button>
        <button v-if="!aiHelperLoading && (!aiHelperSuggestion || aiHelperError)" @click="fetchAISuggestion" class="btn btn-primary" type="button">Get suggestion</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import Wizard from '@/shared/components/Wizard.vue';
import Modal from '@/shared/components/Modal.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ScenarioViewer from './components/ScenarioViewer.vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectPresenter } from '../presenters/project.presenter';
import { ScenarioPresenter } from '../../../scenarios/interface-adapters/presenters/scenario.presenter';
import { ScenarioViewModel } from '../../../scenarios/interface-adapters/view-models/scenario.view-model';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';

const router = useRouter();
const projectPresenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const scenarioPresenter = container.get<ScenarioPresenter>(SCENARIO_TYPES.ScenarioPresenter);

const wizardSteps = [
  { label: 'Segment' },
  { label: 'Market Picture' },
  { label: 'Market Fit' },
  { label: 'Differentiation' },
  { label: 'Hypothesis' },
  { label: 'Scenario' },
  { label: 'Audience' },
];

const formData = ref({
  name: '',
  segmentDescription: '',
  segmentDemographics: '',
  marketPicture: '',
  marketFit: '',
  differentiation: '',
  hypothesisDescription: '',
  hypothesisAssumptions: [''],
  audienceSize: 100,
  pricePerResponse: 5.0,
});

const scenarioContent = ref<string>('');
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);
const showAIHelper = ref(false);
const aiHelperLoading = ref(false);
const aiHelperError = ref<string | null>(null);
const aiHelperSuggestion = ref<{ description: string; assumptions: string[] } | null>(null);
const marketContextSuggestLoading = ref(false);
const marketContextSuggestError = ref<string | null>(null);
const currentProjectId = ref<string | null>(null);
const scenarioViewModel = new ScenarioViewModel();

const totalPrice = computed(() => {
  return (formData.value.audienceSize || 0) * (formData.value.pricePerResponse || 0);
});

const addAssumption = () => {
  formData.value.hypothesisAssumptions.push('');
};

const removeAssumption = (index: number) => {
  formData.value.hypothesisAssumptions.splice(index, 1);
};

const fetchAISuggestion = async () => {
  aiHelperLoading.value = true;
  aiHelperError.value = null;
  aiHelperSuggestion.value = null;
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AI_HYPOTHESIS_SUGGEST}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segmentDescription: formData.value.segmentDescription || '',
        segmentDemographics: formData.value.segmentDemographics || '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      aiHelperError.value = data?.error || data?.message || `Request failed (${res.status})`;
      return;
    }
    aiHelperSuggestion.value = {
      description: data.description ?? '',
      assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
    };
  } catch (e) {
    aiHelperError.value = e instanceof Error ? e.message : 'Network error';
  } finally {
    aiHelperLoading.value = false;
  }
};

const applyAISuggestion = () => {
  if (!aiHelperSuggestion.value) return;
  formData.value.hypothesisDescription = aiHelperSuggestion.value.description;
  formData.value.hypothesisAssumptions = aiHelperSuggestion.value.assumptions.length
    ? [...aiHelperSuggestion.value.assumptions]
    : [''];
  showAIHelper.value = false;
  aiHelperSuggestion.value = null;
  aiHelperError.value = null;
};

const fetchMarketContextSuggestion = async () => {
  marketContextSuggestLoading.value = true;
  marketContextSuggestError.value = null;
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AI_MARKET_CONTEXT_SUGGEST}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segmentDescription: formData.value.segmentDescription || '',
        segmentDemographics: formData.value.segmentDemographics || '',
        productDescription: formData.value.name?.trim() || formData.value.hypothesisDescription?.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      marketContextSuggestError.value = data?.error || data?.message || `Request failed (${res.status})`;
      return;
    }
    if (data.marketPicture != null) formData.value.marketPicture = data.marketPicture;
    if (data.marketFit != null) formData.value.marketFit = data.marketFit;
    if (data.differentiation != null) formData.value.differentiation = data.differentiation;
  } catch (e) {
    marketContextSuggestError.value = e instanceof Error ? e.message : 'Network error';
  } finally {
    marketContextSuggestLoading.value = false;
  }
};

const onAIHelperClose = (open: boolean) => {
  if (!open) {
    aiHelperSuggestion.value = null;
    aiHelperError.value = null;
  }
};

function buildMarketContextFromForm(): { marketPicture?: string; marketFit?: string; differentiation?: string } | null {
  const p = formData.value.marketPicture?.trim();
  const f = formData.value.marketFit?.trim();
  const d = formData.value.differentiation?.trim();
  if (!p && !f && !d) return null;
  return {
    ...(p ? { marketPicture: p } : {}),
    ...(f ? { marketFit: f } : {}),
    ...(d ? { differentiation: d } : {}),
  };
}

const handleStepChange = async (step: number) => {
  // When moving to step 6 (Scenario), create project and generate scenario
  if (step === 5 && !scenarioContent.value && formData.value.hypothesisDescription) {
    await generateScenario();
  }
};

const generateScenario = async () => {
  scenarioLoading.value = true;
  scenarioError.value = null;
  scenarioContent.value = '';

  try {
    const marketContext = buildMarketContextFromForm();

    // 1. Create project if not created yet
    if (!currentProjectId.value) {
      const projectName = formData.value.name || `Project ${new Date().toLocaleDateString()}`;
      const createResult = await projectPresenter.createProject(
        projectName,
        formData.value.segmentDescription,
        formData.value.segmentDemographics,
        formData.value.hypothesisDescription,
        formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0),
        marketContext
      );

      if (!createResult.projectId) {
        scenarioError.value = createResult.error || 'Failed to create project';
        scenarioLoading.value = false;
        return;
      }

      currentProjectId.value = createResult.projectId;
    } else {
      // Update project with current data
      await projectPresenter.updateProject(
        currentProjectId.value,
        formData.value.name || undefined,
        formData.value.segmentDescription || undefined,
        formData.value.segmentDemographics || undefined,
        formData.value.hypothesisDescription || undefined,
        formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0) || undefined,
        undefined,
        marketContext
      );
    }

    // 2. Generate scenario via UseCase -> Repository -> HttpClient -> Backend API
    // Convert text demographics to object
    let demographicsParsed: Record<string, any> = {};
    if (formData.value.segmentDemographics) {
      try {
        // Try to parse as JSON
        demographicsParsed = JSON.parse(formData.value.segmentDemographics);
      } catch {
        // If not JSON, save as text field
        demographicsParsed = { text: formData.value.segmentDemographics };
      }
    }
    
    const segment = formData.value.segmentDescription && formData.value.segmentDemographics
      ? {
          description: formData.value.segmentDescription,
          demographics: demographicsParsed,
        }
      : null;

    const hypothesis = formData.value.hypothesisDescription
      ? {
          description: formData.value.hypothesisDescription,
          assumptions: formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0),
        }
      : null;

    console.log('🔄 Starting scenario generation:', {
      projectId: currentProjectId.value,
      hasSegment: !!segment,
      hasHypothesis: !!hypothesis,
      segment: segment ? { description: segment.description, demographicsKeys: Object.keys(segment.demographics || {}) } : null,
      hypothesis: hypothesis ? { description: hypothesis.description, assumptionsCount: hypothesis.assumptions?.length || 0 } : null
    });

    await scenarioPresenter.generateScenario(
      currentProjectId.value!,
      scenarioViewModel,
      segment,
      hypothesis,
      marketContext
    );

    console.log('✅ Scenario generation completed:', {
      hasScenario: !!scenarioViewModel.scenario.value,
      hasError: !!scenarioViewModel.error.value,
      error: scenarioViewModel.error.value
    });

    if (scenarioViewModel.scenario.value) {
      scenarioContent.value = scenarioViewModel.scenario.value.content ?? '';
    } else if (scenarioViewModel.error.value) {
      scenarioError.value = sanitizeScenarioError(scenarioViewModel.error.value);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error while generating scenario';
    scenarioError.value = sanitizeScenarioError(msg);
    console.error('❌ Failed to generate scenario:', error);
  } finally {
    scenarioLoading.value = false;
  }
};

function sanitizeScenarioError(message: string): string {
  if (
    message.includes('403') ||
    message.includes('Cloudflare') ||
    message.includes('<!DOCTYPE') ||
    message.includes('ByteString') ||
    message.length > 400
  ) {
    return 'Scenario generation failed: AI service unavailable (blocked or 403). Try again later or check backend CEREBRAS_API_KEY / LLM_SERVICE_URL.';
  }
  if (message.includes('toISOString') || message.includes('Invalid project data')) {
    return 'Server error while saving project. Please try again or refresh the page.';
  }
  return message;
}

const regenerateScenario = async () => {
  scenarioContent.value = '';
  await generateScenario();
};

const handleComplete = async () => {
  // Update project with final name and market context (e.g. if changed on last steps)
  if (currentProjectId.value) {
    const marketContext = buildMarketContextFromForm();
    await projectPresenter.updateProject(
      currentProjectId.value,
      formData.value.name || undefined,
      formData.value.segmentDescription || undefined,
      formData.value.segmentDemographics || undefined,
      formData.value.hypothesisDescription || undefined,
      formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0) || undefined,
      undefined,
      marketContext ?? undefined
    );
  }

  // Redirect to projects list
  router.push('/projects');
};
</script>

<style scoped>
.create-project-wizard {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.wizard-container {
  background: white;
  border-radius: var(--radius-xl, 1rem);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--color-border);
  padding: 2rem;
}

.step-content {
  min-height: 400px;
  min-width: 0;
  overflow: hidden;
}

.step-panel {
  animation: fadeIn 0.3s;
  min-width: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-panel h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.step-description {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.scenario-textarea {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-hint {
  display: block;
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
}

.assumptions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assumption-item {
  display: flex;
  gap: 0.5rem;
}

.assumption-item .form-input {
  flex: 1;
}

.btn-remove {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-error-bg);
  color: var(--color-error);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--color-error);
  color: white;
}

.btn-add {
  padding: 0.75rem;
  border: 2px dashed var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.ai-helper {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.market-context-ai-helper {
  margin-top: 1rem;
}

.market-context-ai-error {
  margin-top: 0.75rem;
  color: var(--color-error);
  font-size: var(--text-sm);
}

.btn-ai-helper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-ai-helper:hover {
  transform: translateY(-2px);
}

.scenario-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.scenario-error {
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: var(--color-error);
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-error-bg);
  border-radius: var(--radius-md);
}

.scenario-editor {
  margin-top: 1rem;
  min-width: 0;
  overflow: hidden;
}

.btn-regenerate {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-regenerate:hover {
  background: var(--color-border);
}

.price-summary {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.price-amount {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.price-hint {
  margin-top: 0.5rem;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.95;
}

.ai-helper-intro {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.ai-helper-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  color: #718096;
}

.ai-helper-error {
  padding: 1rem;
  background: #fed7d7;
  color: #c53030;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.ai-helper-result {
  margin-bottom: 1rem;
}

.ai-helper-result .suggestion-text {
  padding: 0.75rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.assumptions-preview {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text);
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .wizard-container {
    padding: 1rem;
  }
}
</style>
