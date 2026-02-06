<template>
  <div class="create-project-wizard">
    <PageHeader
      title="Create New Project"
      subtitle="Define segment, hypothesis, scenario, and audience"
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'New Project' }
      ]"
    />
    <div class="wizard-container">
      <Wizard :steps="wizardSteps" @complete="handleComplete" @step-change="handleStepChange">
        <template #default="{ step }">
          <div class="step-content">
            <!-- Step 0: Who & what? (Segment + Hypothesis + optional context) -->
            <div v-if="step === 0" class="step-panel">
              <h2>Step 1: Who & what?</h2>
              <p class="step-description">Describe your audience and what you're testing</p>

              <section class="wizard-section">
                <h3 class="section-title">Who? (Segment)</h3>
                <div class="form-group">
                  <label for="segment-description">Segment Description *</label>
                  <textarea
                    id="segment-description"
                    v-model="formData.segmentDescription"
                    rows="3"
                    placeholder="Example: Young professionals aged 25-35 working in IT..."
                    class="form-input"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label for="segment-demographics">Demographics *</label>
                  <textarea
                    id="segment-demographics"
                    v-model="formData.segmentDemographics"
                    rows="2"
                    placeholder="Example: Age: 25-35 | Location: Major cities | Profession: Software engineers"
                    class="form-input"
                  ></textarea>
                </div>
              </section>

              <section class="wizard-section">
                <h3 class="section-title">What are we testing?</h3>
                <div class="form-group">
                  <label for="hypothesis-description">Hypothesis Description</label>
                  <textarea
                    id="hypothesis-description"
                    v-model="formData.hypothesisDescription"
                    rows="3"
                    placeholder="Example: We believe that young IT professionals want to learn in a gamified format..."
                    class="form-input"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Assumptions</label>
                  <div class="assumptions-list">
                    <div
                      v-for="(assumption, index) in formData.hypothesisAssumptions"
                      :key="index"
                      class="assumption-item"
                    >
                      <input
                        v-model="formData.hypothesisAssumptions[index]"
                        type="text"
                        :placeholder="`Assumption ${index + 1}`"
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
                    <button @click="addAssumption" class="btn-add" type="button">+ Add Assumption</button>
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
                <div class="context-accordion">
                  <button
                    type="button"
                    class="context-accordion-trigger"
                    :aria-expanded="showContextSection"
                    @click="showContextSection = !showContextSection"
                  >
                    {{ showContextSection ? '▼' : '▶' }} Add market context (AI-assisted)
                  </button>
                  <div v-show="showContextSection" class="context-accordion-content">
                    <div class="form-group">
                      <label for="market-picture">Market Picture</label>
                      <textarea id="market-picture" v-model="formData.marketPicture" rows="2" placeholder="Current market: main players, offerings..." class="form-input"></textarea>
                    </div>
                    <div class="form-group">
                      <label for="market-fit">Market Fit</label>
                      <textarea id="market-fit" v-model="formData.marketFit" rows="2" placeholder="How your product fits..." class="form-input"></textarea>
                    </div>
                    <div class="form-group">
                      <label for="differentiation">Differentiation</label>
                      <textarea id="differentiation" v-model="formData.differentiation" rows="2" placeholder="How your product differs..." class="form-input"></textarea>
                    </div>
                    <div class="market-context-ai-helper">
                      <p v-if="!hasMarketContextInput" class="form-hint market-context-hint">Fill in segment or hypothesis above for a relevant suggestion.</p>
                      <button type="button" class="btn btn-secondary" :disabled="marketContextSuggestLoading || !hasMarketContextInput" @click="fetchMarketContextSuggestion">
                        {{ marketContextSuggestLoading ? 'Loading...' : 'Suggest with AI' }}
                      </button>
                      <p v-if="marketContextSuggestError" class="market-context-ai-error">{{ marketContextSuggestError }}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Step 1: How will we ask? (template default + optional edit manually) -->
            <div v-if="step === 1" class="step-panel">
              <h2>Step 2: How will we ask?</h2>
              <p class="step-description">Use a template or edit questions manually</p>

              <div v-if="scenarioSource !== 'manual'" class="form-group">
                <label>Template</label>
                <select v-model="selectedTemplateSlug" class="form-input" @change="loadSelectedTemplate">
                  <option value="">— Select template —</option>
                  <option v-for="t in scenarioTemplates" :key="t.slug" :value="t.slug">{{ t.name }}</option>
                </select>
              </div>
              <label class="checkbox-option edit-manually-option">
                <input
                  type="checkbox"
                  :checked="scenarioSource === 'manual'"
                  @change="scenarioSource = ($event.target as HTMLInputElement).checked ? 'manual' : 'template'"
                />
                <span>Edit questions manually</span>
              </label>
              <button v-if="scenarioSource !== 'ai'" type="button" class="btn btn-ghost btn-sm link-ai-generate" @click="scenarioSource = 'ai'">
                Generate with AI [Beta]
              </button>

              <div v-if="scenarioSource === 'template' && scenarioContent" class="scenario-editor">
                <ScenarioViewer :content="scenarioContent" @update:content="scenarioContent = $event" />
              </div>
              <div v-if="scenarioSource === 'ai'">
                <div v-if="scenarioLoading" class="scenario-generating">
                  <LoadingSpinner />
                  <p>Generating scenario with AI...</p>
                </div>
                <div v-else-if="scenarioError" class="scenario-error">
                  <div class="error-message">{{ scenarioError }}</div>
                  <button @click="generateScenario" class="btn btn-secondary">Try Again</button>
                </div>
                <div v-else-if="scenarioContent" class="scenario-editor">
                  <ScenarioViewer :content="scenarioContent" @update:content="scenarioContent = $event" />
                  <button @click="regenerateScenario" class="btn-regenerate" type="button">Regenerate</button>
                  <div v-if="currentScenarioId && !scenarioRatingSubmitted" class="scenario-rating-block">
                    <p class="scenario-rating-label">Rate scenario quality (1–5)</p>
                    <div class="scenario-rating-stars">
                      <button v-for="n in 5" :key="n" type="button" :class="['rating-btn', { active: scenarioRatingValue === n }]" @click="submitScenarioRating(n)">{{ n }}</button>
                    </div>
                    <p v-if="scenarioRatingError" class="scenario-rating-error">{{ scenarioRatingError }}</p>
                  </div>
                  <p v-else-if="scenarioRatingSubmitted" class="scenario-rating-thanks">Thanks for your rating!</p>
                </div>
                <div v-else class="scenario-ai-prompt">
                  <p>Click below to generate a scenario from your segment and hypothesis.</p>
                  <button @click="generateScenario" class="btn btn-primary" type="button">Generate scenario</button>
                </div>
              </div>
              <div v-if="scenarioSource === 'manual'" class="scenario-editor">
                <ScenarioManualEditor :content="scenarioContent || defaultManualScenario" @update:content="scenarioContent = $event" />
              </div>
            </div>

            <!-- Step 2: Who will we ask? (Public link first, then email, then panel) -->
            <div v-if="step === 2" class="step-panel">
              <h2>Step 3: Who will we ask?</h2>
              <p class="step-description">Project name, size, and how you will find respondents</p>

              <div class="form-group">
                <label for="project-name">Project Name *</label>
                <input
                  id="project-name"
                  v-model="formData.name"
                  type="text"
                  placeholder="Example: Gamified Learning - IT Professionals"
                  class="form-input"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="audience-size">Audience Size *</label>
                  <input id="audience-size" v-model.number="formData.audienceSize" type="number" min="1" placeholder="100" class="form-input" />
                  <span class="form-hint">Recommended: 100-200 respondents</span>
                </div>
                <div class="form-group">
                  <label for="price-per-response">Price per Response *</label>
                  <input id="price-per-response" v-model.number="formData.pricePerResponse" type="number" min="0" step="0.01" placeholder="5.00" class="form-input" />
                  <span class="form-hint">Standard: $5-10 for 10-15 min</span>
                </div>
              </div>

              <div class="form-group audience-source">
                <label>How will you find respondents?</label>
                <div class="scenario-source-options">
                  <label class="radio-option">
                    <input v-model="audienceChoice" type="radio" value="share" />
                    <span>Public link (I'll share in communities)</span>
                  </label>
                  <label class="radio-option">
                    <input v-model="audienceChoice" type="radio" value="email" />
                    <span>I have a list of emails</span>
                  </label>
                  <p v-if="audienceChoice === 'email'" class="form-hint audience-hint">Import CSV or connect HubSpot on the Invitations page after creating the project.</p>
                  <label class="radio-option">
                    <input v-model="audienceChoice" type="radio" value="panel" />
                    <span>Buy audience [Soon]</span>
                  </label>
                </div>
                <p class="form-hint audience-hint-general">You can enable a public link or share link on the Invitations page after creating the project.</p>
              </div>

              <div class="price-summary">
                <div class="price-row">
                  <span>Project Cost:</span>
                  <span class="price-amount">${{ totalPrice.toFixed(2) }}</span>
                </div>
                <div class="price-hint">{{ formData.audienceSize || 0 }} × ${{ formData.pricePerResponse || 0 }}</div>
              </div>
            </div>
          </div>
        </template>
      </Wizard>
    </div>

    <!-- AI Helper Modal -->
    <Modal v-model="showAIHelper" title="AI Helper for Hypothesis Formulation" @update:modelValue="onAIHelperClose">
      <p class="ai-helper-intro">Based on your target segment (Step 1), AI suggests a hypothesis and testable assumptions. Fill Step 1 first for a relevant suggestion.</p>
      <p v-if="!hasSegmentForHypothesis" class="form-hint">Fill in segment description or demographics on Step 1 to enable suggestion.</p>
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
        <button v-if="!aiHelperLoading && (!aiHelperSuggestion || aiHelperError)" type="button" class="btn btn-primary" :disabled="!hasSegmentForHypothesis" @click="fetchAISuggestion">Get suggestion</button>
      </template>
    </Modal>

    <Modal v-model="showValidationModal" title="Scenario structure warnings">
      <p class="validation-intro">The scenario may not fully match the selected template. You can still save or go back to edit.</p>
      <ul class="validation-warnings-list">
        <li v-for="(w, i) in validationWarnings" :key="i">{{ w }}</li>
      </ul>
      <template #footer>
        <button @click="saveAnyway" class="btn btn-primary">Save anyway</button>
        <button @click="closeValidationModal" class="btn btn-secondary">Back to scenario</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import Wizard from '@/shared/components/Wizard.vue';
import Modal from '@/shared/components/Modal.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ScenarioViewer from './components/ScenarioViewer.vue';
import ScenarioManualEditor from './components/ScenarioManualEditor.vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectPresenter } from '../presenters/project.presenter';
import { ScenarioPresenter } from '../../../scenarios/interface-adapters/presenters/scenario.presenter';
import { ScenarioViewModel } from '../../../scenarios/interface-adapters/view-models/scenario.view-model';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';

const route = useRoute();
const router = useRouter();
const projectPresenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

const ONBOARDING_STORAGE_KEY = 'validatey_onboarding_completed';
const ONBOARDING_HYPOTHESIS_KEY = 'validatey_onboarding_hypothesis';
const scenarioPresenter = container.get<ScenarioPresenter>(SCENARIO_TYPES.ScenarioPresenter);

const wizardSteps = [
  { label: 'Who & what?' },
  { label: 'How?' },
  { label: 'Who to ask?' },
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
const hasSegmentForHypothesis = computed(() => {
  const s = formData.value.segmentDescription?.trim() ?? '';
  const d = formData.value.segmentDemographics?.trim() ?? '';
  return s.length > 0 || d.length > 0;
});

const hasMarketContextInput = computed(() => {
  const f = formData.value;
  return !!(
    (f.segmentDescription && f.segmentDescription.trim()) ||
    (f.segmentDemographics && f.segmentDemographics.trim()) ||
    (f.hypothesisDescription && f.hypothesisDescription.trim()) ||
    (f.name && f.name.trim())
  );
});
const currentProjectId = ref<string | null>(null);
const scenarioViewModel = new ScenarioViewModel();
const showContextSection = ref(false);
const scenarioSource = ref<'template' | 'ai' | 'manual'>('template');
const selectedTemplateSlug = ref('');
const scenarioTemplates = ref<Array<{ slug: string; name: string; content: string }>>([]);
const audienceChoice = ref<'email' | 'panel' | 'share'>('share');

const defaultManualScenario = JSON.stringify(
  { questions: [{ id: 'q_1', text: 'Your first question', type: 'open', required: true }] },
  null,
  2
);

const totalPrice = computed(() => {
  return (formData.value.audienceSize || 0) * (formData.value.pricePerResponse || 0);
});

const currentScenarioId = computed(() => scenarioViewModel.scenario.value?.id ?? null);

const scenarioRatingValue = ref(0);
const scenarioRatingSubmitted = ref(false);
const scenarioRatingError = ref<string | null>(null);

async function submitScenarioRating(rating: number) {
  const projectId = currentProjectId.value;
  const scenarioId = currentScenarioId.value;
  if (!projectId || !scenarioId) return;
  scenarioRatingError.value = null;
  scenarioRatingValue.value = rating;
  const result = await scenarioPresenter.rateScenario(projectId, scenarioId, rating);
  if (result.error) {
    scenarioRatingError.value = result.error;
    return;
  }
  scenarioRatingSubmitted.value = true;
}

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
  // When entering step 1 (How?): ensure project exists; load templates; default first template; trigger AI generate for AI path
  if (step === 1) {
    await ensureProjectCreated();
    if (scenarioTemplates.value.length === 0) {
      const { templates, error } = await scenarioPresenter.getTemplates();
      if (!error) scenarioTemplates.value = templates;
      if (scenarioTemplates.value.length > 0 && !selectedTemplateSlug.value) {
        selectedTemplateSlug.value = scenarioTemplates.value[0].slug;
        await loadSelectedTemplate();
      }
    } else if (scenarioTemplates.value.length > 0 && !selectedTemplateSlug.value) {
      selectedTemplateSlug.value = scenarioTemplates.value[0].slug;
      await loadSelectedTemplate();
    }
    if (scenarioSource.value === 'ai' && !scenarioContent.value) {
      await generateScenario();
    }
  }
};

async function ensureProjectCreated(): Promise<void> {
  if (currentProjectId.value) return;
  const projectName = formData.value.name || `Project ${new Date().toLocaleDateString()}`;
  const marketContext = buildMarketContextFromForm();
  const createResult = await projectPresenter.createProject(
    projectName,
    formData.value.segmentDescription,
    formData.value.segmentDemographics,
    formData.value.hypothesisDescription,
    formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0),
    marketContext ?? undefined
  );
  if (createResult.projectId) currentProjectId.value = createResult.projectId;
}

async function loadSelectedTemplate(): Promise<void> {
  const slug = selectedTemplateSlug.value;
  if (!slug) return;
  const t = scenarioTemplates.value.find(x => x.slug === slug);
  if (t) scenarioContent.value = t.content;
}

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
  scenarioRatingSubmitted.value = false;
  scenarioRatingValue.value = 0;
  scenarioRatingError.value = null;
  await generateScenario();
};

const validationWarnings = ref<string[]>([]);
const showValidationModal = ref(false);

async function doComplete() {
  if (!currentProjectId.value) return;
  const marketContext = buildMarketContextFromForm();
  await projectPresenter.updateProject(
    currentProjectId.value,
    formData.value.name || undefined,
    formData.value.segmentDescription || undefined,
    formData.value.segmentDemographics || undefined,
    formData.value.hypothesisDescription || undefined,
    formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0) || undefined,
    undefined,
    marketContext ?? undefined,
    selectedTemplateSlug.value || undefined
  );

  let content = (scenarioContent.value ?? '').trim();
  if (!content && scenarioSource.value === 'manual') content = defaultManualScenario.trim();
  const generatedContent = scenarioViewModel.scenario.value?.content?.trim() ?? '';
  const needsSave = content.length > 0 && content !== generatedContent;
  if (needsSave) {
    const saveResult = await scenarioPresenter.saveScenarioVersion(currentProjectId.value, content);
    if (saveResult.error) {
      console.error('Failed to save scenario version:', saveResult.error);
    }
  }

  if (route.query.onboarding === '1' && typeof localStorage !== 'undefined') {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  }
  const choice = audienceChoice.value;
  const fromOnboarding = route.query.onboarding === '1';
  if (currentProjectId.value && (choice === 'email' || choice === 'share')) {
    router.push(fromOnboarding
      ? `/projects/${currentProjectId.value}/invitations?onboarding=1`
      : `/projects/${currentProjectId.value}/invitations`);
  } else if (currentProjectId.value && choice === 'panel') {
    router.push(`/projects/${currentProjectId.value}/panel`);
  } else {
    router.push('/projects');
  }
}

const handleComplete = async () => {
  if (!currentProjectId.value) return;

  const slug = selectedTemplateSlug.value?.trim();
  const content = (scenarioContent.value ?? '').trim() || (scenarioSource.value === 'manual' ? defaultManualScenario.trim() : '');
  if (slug && content) {
    try {
      const validation = await scenarioPresenter.validateScenarioStructure(content, slug);
      if (validation.warnings && validation.warnings.length > 0) {
        validationWarnings.value = validation.warnings;
        showValidationModal.value = true;
        return;
      }
    } catch {
      // On validation API error, proceed without blocking
    }
  }

  await doComplete();
};

function closeValidationModal() {
  showValidationModal.value = false;
  validationWarnings.value = [];
}

function saveAnyway() {
  closeValidationModal();
  doComplete();
}

onMounted(() => {
  if (route.query.onboarding === '1' && typeof sessionStorage !== 'undefined') {
    const hypothesis = sessionStorage.getItem(ONBOARDING_HYPOTHESIS_KEY);
    if (hypothesis?.trim()) {
      formData.value.hypothesisDescription = hypothesis.trim();
      if (!formData.value.name?.trim()) {
        const short = hypothesis.length > 50 ? hypothesis.slice(0, 47) + '...' : hypothesis;
        formData.value.name = `Validation: ${short}`;
      }
      sessionStorage.removeItem(ONBOARDING_HYPOTHESIS_KEY);
    }
  }
});
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

.wizard-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.wizard-section:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.checkbox-option.edit-manually-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  cursor: pointer;
}

.checkbox-option input {
  width: 1rem;
  height: 1rem;
}

.link-ai-generate {
  margin-top: 0.5rem;
  margin-left: 0;
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

.validation-intro {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.validation-warnings-list {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.validation-warnings-list li {
  margin-bottom: 0.25rem;
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

.context-accordion {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.context-accordion-trigger {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
}

.context-accordion-trigger:hover {
  color: var(--color-text);
  background: #e2e8f0;
}

.context-accordion-content {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.scenario-source-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text);
}

.radio-option input {
  width: 1.125rem;
  height: 1.125rem;
}

.template-section .scenario-editor,
.scenario-ai-prompt {
  margin-top: 1rem;
}

.scenario-ai-prompt {
  padding: 1.5rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
}

.scenario-ai-prompt p {
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.audience-source {
  margin-top: 1.5rem;
}

.scenario-rating-block {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.scenario-rating-label {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.scenario-rating-stars {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rating-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.rating-btn:hover,
.rating-btn.active {
  border-color: var(--color-accent);
  background: rgba(13, 148, 136, 0.1);
  color: var(--color-accent);
}

.scenario-rating-error {
  margin-top: 0.5rem;
  color: var(--color-error);
  font-size: var(--text-sm);
}

.scenario-rating-thanks {
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
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
