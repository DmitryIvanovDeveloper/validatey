<template>
  <div class="create-project-wizard">
    <PageHeader
      :title="isEditing ? projectPresenter.labels.titleEdit : projectPresenter.labels.titleCreate"
      :subtitle="projectPresenter.labels.subtitle"
      :breadcrumbs="[
        { label: projectPresenter.labels.breadcrumbProjects, path: '/projects' },
        { label: isEditing ? projectPresenter.labels.breadcrumbEdit : projectPresenter.labels.breadcrumbNew }
      ]"
    />
    <div class="wizard-container">
      <Wizard :steps="wizardSteps" :loading="completingProject" :can-proceed="canProceedToNextStep" :can-complete="canCompleteWizard" @complete="handleComplete" @step-change="handleStepChange">
        <template #default="{ step }">
          <div class="step-content">
            <!-- Step 0: Who & what? (Segment + Hypothesis + optional context) -->
            <div v-if="step === 0" class="step-panel">
              <h2>{{ projectPresenter.labels.step1Title }}</h2>
              <p class="step-description">{{ projectPresenter.labels.step1Description }}</p>

              <section class="wizard-section">
                <h3 class="section-title">{{ projectPresenter.labels.sectionWho }}</h3>
                <div class="form-group" :class="{ error: fieldErrors.segmentDescription }">
                  <label for="segment-description">{{ projectPresenter.labels.segmentDescription }}</label>
                  <textarea
                    id="segment-description"
                    v-model="formData.segmentDescription"
                    rows="3"
                    :placeholder="projectPresenter.labels.segmentPlaceholder"
                    class="form-input"
                  ></textarea>
                </div>
                <div class="form-group" :class="{ error: fieldErrors.segmentDemographics }">
                  <label for="segment-demographics">{{ projectPresenter.labels.demographics }}</label>
                  <textarea
                    id="segment-demographics"
                    v-model="formData.segmentDemographics"
                    rows="2"
                    :placeholder="projectPresenter.labels.demographicsPlaceholder"
                    class="form-input"
                    @input="clearFieldError('segmentDemographics')"
                  ></textarea>
                </div>
              </section>

              <section class="wizard-section">
                <h3 class="section-title">{{ projectPresenter.labels.sectionWhat }}</h3>
                <div class="form-group" :class="{ error: fieldErrors.hypothesisDescription }">
                  <label for="hypothesis-description">{{ projectPresenter.labels.hypothesisDescription }} <span class="required">*</span></label>
                  <textarea
                    id="hypothesis-description"
                    v-model="formData.hypothesisDescription"
                    rows="3"
                    :placeholder="projectPresenter.labels.hypothesisPlaceholder"
                    class="form-input"
                    required
                    @input="clearFieldError('hypothesisDescription')"
                  ></textarea>
                </div>
                <div class="form-group" :class="{ error: fieldErrors.hypothesisAssumptions }">
                  <label>{{ projectPresenter.labels.assumptions }}</label>
                  <div class="assumptions-list">
                    <div
                      v-for="(assumption, index) in formData.hypothesisAssumptions"
                      :key="index"
                      class="assumption-item"
                    >
                      <input
                        v-model="formData.hypothesisAssumptions[index]"
                        type="text"
                        :placeholder="projectPresenter.labels.assumptionPlaceholder(index + 1)"
                        class="form-input"
                        @input="clearFieldError('hypothesisAssumptions')"
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
                    <button @click="addAssumption" class="btn-add" type="button">{{ projectPresenter.labels.addAssumption }}</button>
                  </div>
                </div>

                <!-- Prevention Warnings — inline risk assessment based on failure patterns -->
                <ProjectRiskWarnings
                  :risks="riskWarnings"
                  :loading="riskLoading"
                  :overall-risk-score="riskOverallScore"
                />

                <div class="form-group" :class="{ error: fieldErrors.marketPicture }">
                  <label for="market-picture">{{ projectPresenter.labels.marketPicture }}</label>
                  <textarea
                    id="market-picture"
                    v-model="formData.marketPicture"
                    rows="3"
                    :placeholder="projectPresenter.labels.marketPicturePlaceholder"
                    class="form-input"
                    @input="clearFieldError('marketPicture')"
                  ></textarea>
                </div>
                <div class="form-group" :class="{ error: fieldErrors.marketFit }">
                  <label for="market-fit">{{ projectPresenter.labels.marketFit }}</label>
                  <textarea
                    id="market-fit"
                    v-model="formData.marketFit"
                    rows="3"
                    :placeholder="projectPresenter.labels.marketFitPlaceholder"
                    class="form-input"
                    @input="clearFieldError('marketFit')"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label for="differentiation">{{ projectPresenter.labels.differentiation }}</label>
                  <textarea
                    id="differentiation"
                    v-model="formData.differentiation"
                    rows="3"
                    :placeholder="projectPresenter.labels.differentiationPlaceholder"
                    class="form-input"
                  ></textarea>
                </div>
                <div class="context-accordion">
                  <div class="context-accordion-content">
                    <div class="market-context-ai-helper">
                      <p v-if="!hasMarketContextInput" class="form-hint market-context-hint">{{ projectPresenter.labels.marketContextHint }}</p>
                      <button type="button" class="btn btn-secondary" :disabled="marketContextSuggestLoading || !hasMarketContextInput" @click="fetchMarketContextSuggestion">
                        {{ marketContextSuggestLoading ? projectPresenter.labels.loading : projectPresenter.labels.suggestWithAI }}
                      </button>
                      <p v-if="marketContextSuggestError" class="market-context-ai-error">{{ marketContextSuggestError }}</p>
                    </div>
                  </div>
                </div>
                
              </section>
            </div>

            <!-- Step 1: How will we ask? (validation type selection) -->
            <div v-if="step === 1" class="step-panel">
              <h2>{{ projectPresenter.labels.step2Title }}</h2>
              <p class="step-description">{{ projectPresenter.labels.step2Description }}</p>

              <div v-if="scenarioSource !== 'ai'" class="validation-types-grid">
                <div
                  v-for="template in scenarioTemplates"
                  :key="template.slug"
                  class="validation-type-card"
                  :class="{ selected: selectedTemplateSlugs.includes(template.slug) }"
                  @click="selectValidationType(template.slug)"
                >
                  <div class="validation-type-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedTemplateSlugs.includes(template.slug)"
                      @change="selectValidationType(template.slug)"
                      @click.stop
                    />
                  </div>
                  <div class="validation-type-header">
                    <h3 class="validation-type-title">{{ template.name }}</h3>
                    <div class="validation-type-target">{{ projectPresenter.labels.respondentsNeeded(template.significanceTarget) }}</div>
                  </div>
                  <div class="validation-type-description">
                    <div v-if="template.slug === 'problem-validation'">{{ projectPresenter.labels.problemValidationDesc }}</div>
                    <div v-else-if="template.slug === 'solution-validation'">{{ projectPresenter.labels.solutionValidationDesc }}</div>
                    <div v-else-if="template.slug === 'pricing-validation'">{{ projectPresenter.labels.pricingValidationDesc }}</div>
                    <div v-else-if="template.slug === 'survey'">{{ projectPresenter.labels.surveyDesc }}</div>
                    <div v-else-if="template.slug === 'statistical-analysis'">{{ projectPresenter.labels.statisticalAnalysisDesc }}</div>
                  </div>
                </div>
              </div>
              <div class="scenario-options">
                <button v-if="selectedTemplateSlugs.length > 0 && scenarioSource !== 'ai'" type="button" class="btn btn-ai-generate" @click="switchToAI">
                  <svg class="btn-ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    <path d="M12 7v4"/>
                    <path d="M8 9h8"/>
                  </svg>
                  {{ projectPresenter.labels.generateWithAI }}
                  <span class="beta-badge">{{ projectPresenter.labels.betaBadge }}</span>
                </button>
              </div>

              <!-- Scenario viewer - show generated content in template mode -->
              <div v-if="scenarioSource === 'template' && scenarioContent" class="scenario-editor">
                <ScenarioViewer :content="scenarioContent" :validation-type="selectedTemplateSlugs" @update:content="scenarioContent = $event" />
              </div>


              <!-- AI Generation Overlay -->
              <div v-if="scenarioSource === 'ai'" class="ai-generation-overlay">
                <div v-if="scenarioLoading" class="generation-loading">
                  <div class="generation-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="generation-content">
                    <h3>{{ projectPresenter.labels.generatingScenario }}</h3>
                    <p>{{ projectPresenter.labels.creatingFor(getValidationTypeName(selectedTemplateSlugs)) }}</p>
                    <div class="generation-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: generationProgress + '%' }"></div>
                      </div>
                      <p class="progress-text">{{ projectPresenter.labels.percentComplete(generationProgress) }}</p>
                    </div>
                  </div>
                </div>
                <div v-else-if="scenarioError" class="generation-error">
                  <div class="error-message">{{ scenarioError }}</div>
                  <button @click="generateScenario" class="btn btn-secondary">{{ projectPresenter.labels.tryAgain }}</button>
                </div>
              </div>
            </div>

            <!-- Step 2: Who will we ask? (Public link first, then email, then panel) -->
            <div v-if="step === 2" class="step-panel">
              <h2>{{ projectPresenter.labels.step3Title }}</h2>
              <p class="step-description">{{ projectPresenter.labels.step3Description }}</p>

              <div class="form-group" :class="{ error: fieldErrors.name }">
                <label for="project-name">{{ projectPresenter.labels.projectName }}</label>
                <input
                  id="project-name"
                  v-model="formData.name"
                  type="text"
                  :placeholder="projectPresenter.labels.projectNamePlaceholder"
                  class="form-input"
                  @input="clearFieldError('name')"
                />
              </div>

              <div class="form-group audience-source">
                <label>{{ projectPresenter.labels.howFindRespondents }}</label>
                <div class="scenario-source-options">
                  <label class="radio-option">
                    <input v-model="audienceChoice" type="radio" value="share" />
                    <span>{{ projectPresenter.labels.audienceShare }}</span>
                  </label>
                  <label class="radio-option">
                    <input v-model="audienceChoice" type="radio" value="email" />
                    <span>{{ projectPresenter.labels.audienceEmail }}</span>
                  </label>
                  <p v-if="audienceChoice === 'email'" class="form-hint audience-hint">{{ projectPresenter.labels.audienceEmailHint }}</p>
                </div>
                <p class="form-hint audience-hint-general">{{ projectPresenter.labels.audienceHintGeneral }}</p>
              </div>
            </div>
          </div>
        </template>
      </Wizard>
    </div>

    <Toast
      :show="showToast"
      :message="toastMessage"
      @dismiss="showToast = false"
    />

    <Modal v-model="showValidationModal" :title="projectPresenter.labels.scenarioWarningsTitle">
      <p class="validation-intro">{{ projectPresenter.labels.scenarioWarningsIntro }}</p>
      <ul class="validation-warnings-list">
        <li v-for="(w, i) in validationWarnings" :key="i">{{ w }}</li>
      </ul>
      <template #footer>
        <button @click="saveAnyway" class="btn btn-primary">{{ projectPresenter.labels.saveAnyway }}</button>
        <button @click="closeValidationModal" class="btn btn-secondary">{{ projectPresenter.labels.backToScenario }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../../../../../shared/components/PageHeader.vue';
import Wizard from '../../../../../shared/components/Wizard.vue';
import Modal from '../../../../../shared/components/Modal.vue';
import LoadingSpinner from '../../../../../shared/components/LoadingSpinner.vue';
import Button from '../../../../../shared/components/atoms/Button.vue';
import ScenarioViewer from '../components/ScenarioViewer.vue';
import Toast from '../../../../../shared/components/Toast.vue';
import ProjectRiskWarnings from '../components/ProjectRiskWarnings.vue';
import { API_CONFIG } from '../../../../../infrastructure/config/api.config';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import { ProjectPresenter } from '../../presenters/project.presenter';
import { ScenarioPresenter } from '../../../../scenarios/interface-adapters/presenters/scenario.presenter';
import { TYPES as SCENARIO_TYPES } from '../../../../scenarios/infrastructure/bootstrap/types';
import { ScenarioViewModel } from '../../../../scenarios/interface-adapters/view-models/scenario.view-model';
import { ProjectViewModel } from '../../view-models/project.view-model';
import type { Project } from '../../../domain/entities/project.entity';
import type { ProjectRisk } from '../../../domain/entities/project-risk.entity';

const route = useRoute();
const router = useRouter();
const workspaceId = computed(() => (route.params.workspaceId as string) || '');
const projectPresenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

const ONBOARDING_STORAGE_KEY = 'validatey_onboarding_completed';
const ONBOARDING_HYPOTHESIS_KEY = 'validatey_onboarding_hypothesis';
const scenarioPresenter = container.get<ScenarioPresenter>(SCENARIO_TYPES.ScenarioPresenter);

const wizardSteps = computed(() => [
  { label: projectPresenter.labels.wizardStepWho },
  { label: projectPresenter.labels.wizardStepHow },
  { label: projectPresenter.labels.wizardStepWhoAsk },
]);

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

const riskWarnings = ref<ProjectRisk[]>([]);
const riskOverallScore = ref(0);
const riskLoading = ref(false);

let riskDebounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => [formData.value.hypothesisDescription, formData.value.segmentDescription, formData.value.hypothesisAssumptions] as const,
  () => {
    if (riskDebounceTimer) clearTimeout(riskDebounceTimer);
    riskDebounceTimer = setTimeout(async () => {
      const hypothesis = formData.value.hypothesisDescription.trim();
      const segment = formData.value.segmentDescription.trim();
      if (!hypothesis && !segment) {
        riskWarnings.value = [];
        riskOverallScore.value = 0;
        return;
      }
      riskLoading.value = true;
      try {
        const result = await projectPresenter.assessProjectRisk(
          hypothesis,
          segment,
          formData.value.hypothesisAssumptions.filter(Boolean)
        );
        riskWarnings.value = result.risks;
        riskOverallScore.value = result.overallRiskScore;
      } catch {
        riskWarnings.value = [];
        riskOverallScore.value = 0;
      } finally {
        riskLoading.value = false;
      }
    }, 800);
  },
  { deep: true }
);

const scenarioContent = ref<string>('');
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);
const isEditing = ref(false);
const editingProjectId = ref<string | null>(null);
const loadingProject = ref(false);
const marketContextSuggestLoading = ref(false);
const marketContextSuggestError = ref<string | null>(null);
const generationProgress = ref(0);

// Store questions by validation type to restore when switching back
const questionsByType = ref<Record<string, string>>({});
const completingProject = ref(false);
const currentStep = ref(0);
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
const scenarioSource = ref<'template' | 'ai'>('template');
const selectedTemplateSlugs = ref<string[]>([]);
const scenarioTemplates = ref<Array<{ slug: string; name: string; significanceTarget: number; content?: string }>>([]);
const audienceChoice = ref<'email' | 'panel' | 'share'>('share');


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

const fetchMarketContextSuggestion = async () => {
  marketContextSuggestLoading.value = true;
  marketContextSuggestError.value = null;
  try {
    const suggestions = await projectPresenter.getMarketContextSuggestions(
      formData.value.segmentDescription || '',
      formData.value.segmentDemographics || '',
      formData.value.name?.trim() || formData.value.hypothesisDescription?.trim()
    );

    if (suggestions) {
      if (suggestions.marketPicture != null) formData.value.marketPicture = suggestions.marketPicture;
      if (suggestions.marketFit != null) formData.value.marketFit = suggestions.marketFit;
      if (suggestions.differentiation != null) formData.value.differentiation = suggestions.differentiation;
    }
  } catch (e) {
    marketContextSuggestError.value = e instanceof Error ? e.message : 'Network error';
  } finally {
    marketContextSuggestLoading.value = false;
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

const clearFieldErrors = () => {
  Object.keys(fieldErrors.value).forEach(key => {
    fieldErrors.value[key as keyof typeof fieldErrors.value] = false;
  });
};

const clearFieldError = (field: keyof typeof fieldErrors.value) => {
  fieldErrors.value[field] = false;
};

const validateStep = (step: number): string | null => {
  // Clear previous errors
  clearFieldErrors();

  if (step === 0) {
    // Step 1: Who & what?
    if (!formData.value.segmentDescription?.trim() && !formData.value.segmentDemographics?.trim()) {
      fieldErrors.value.segmentDescription = true;
      fieldErrors.value.segmentDemographics = true;
      return 'Target segment description or demographics is required';
    }
    if (!formData.value.hypothesisDescription?.trim()) {
      fieldErrors.value.hypothesisDescription = true;
      return 'Hypothesis description is required';
    }
  } else if (step === 1) {
    // Step 2: What type of validation do you need?
    if (selectedTemplateSlugs.value.length === 0) {
      return 'Please select at least one validation type';
    }
    // Step 2: How? (scenario content)
    if (!scenarioContent.value?.trim()) {
      fieldErrors.value.scenarioContent = true;
      return 'Scenario content is required';
    }
  } else if (step === 2) {
    // Step 3: Who to ask?
    if (!formData.value.name?.trim()) {
      fieldErrors.value.name = true;
      return 'Project name is required';
    }
    if (!formData.value.audienceSize || formData.value.audienceSize < 1) {
      fieldErrors.value.audienceSize = true;
      return 'Audience size must be at least 1';
    }
    if (!formData.value.pricePerResponse || formData.value.pricePerResponse <= 0) {
      fieldErrors.value.pricePerResponse = true;
      return 'Price per response must be greater than 0';
    }
  }
  return null;
};

const canProceedToNextStep = (): boolean => {
  const validationError = validateStep(currentStep.value);
  if (validationError) {
    toastMessage.value = validationError;
    showToast.value = true;
    return false;
  }
  return true;
};

const canCompleteWizard = (): boolean => {
  // Validate all steps before completing and highlight all errors
  let hasErrors = false;
  for (let step = 0; step < wizardSteps.value.length; step++) {
    const validationError = validateStep(step);
    if (validationError) {
      hasErrors = true;
      // Don't break - continue to validate all steps and highlight all errors
    }
  }

  if (hasErrors) {
    toastMessage.value = 'Please complete all required fields before finishing the project';
    showToast.value = true;
    return false;
  }

  return true;
};

const handleStepChange = async (step: number) => {
  // Update current step
  currentStep.value = step;

  // When entering step 1 (How?): ensure project exists; load templates if needed; trigger AI generate for AI path
  if (step === 1) {
    await ensureProjectCreated();

    // Always load templates so user can select validation types
    if (scenarioTemplates.value.length === 0) {
      const { templates, error } = await scenarioPresenter.getTemplates();
      if (!error) scenarioTemplates.value = templates;
    }

    if (scenarioSource.value === 'ai' && !scenarioContent.value) {
      await generateScenario();
    }
  }
};

async function ensureProjectCreated(): Promise<void> {
  if (currentProjectId.value || isEditing.value) return;
  const projectName = formData.value.name || `Project ${new Date().toLocaleDateString()}`;
  const marketContext = buildMarketContextFromForm();
  const createResult = await projectPresenter.createProject(
    projectName,
    formData.value.segmentDescription,
    formData.value.segmentDemographics,
    formData.value.hypothesisDescription,
    formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0),
    marketContext ?? undefined,
    selectedTemplateSlugs.value.length > 0 ? JSON.stringify(selectedTemplateSlugs.value) : undefined,
    workspaceId.value || undefined
  );
  if (createResult.projectId) currentProjectId.value = createResult.projectId;
}

function selectValidationType(slug: string) {
  const index = selectedTemplateSlugs.value.indexOf(slug);
  if (index > -1) {
    // If already selected, remove it
    selectedTemplateSlugs.value.splice(index, 1);
  } else {
    // If not selected, add it
    selectedTemplateSlugs.value.push(slug);
  }

  scenarioSource.value = 'template';

  // Try to restore saved questions for the current combination of types
  const typesKey = JSON.stringify(selectedTemplateSlugs.value.sort());
  if (questionsByType.value[typesKey]) {
    scenarioContent.value = questionsByType.value[typesKey];
    console.log('Restored saved questions for types:', selectedTemplateSlugs.value);
  } else {
    // Clear content when selection changes
    scenarioContent.value = '';
  }

  const template = scenarioTemplates.value.find(t => t.slug === slug);
  if (template) {
    console.log('Toggled validation type:', template, 'Selected types:', selectedTemplateSlugs.value);
  }
}

async function loadSelectedTemplate(): Promise<void> {
  const slugs = selectedTemplateSlugs.value;
  if (slugs.length === 0) return;
  const selectedTemplates = scenarioTemplates.value.filter(x => slugs.includes(x.slug));
  if (selectedTemplates.length > 0) {
    // Templates selected, content will be generated by AI
    console.log('Validation types selected:', selectedTemplates);
  }
}

function handleScenarioSourceChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
  } else {
    // If unchecking manual, go back to template if selected, otherwise to AI
    scenarioSource.value = selectedTemplateSlugs.value.length > 0 ? 'template' : 'ai';
  }
}

const getValidationTypeName = (slugs: string[]): string => {
  if (slugs.length === 0) return 'validation';
  if (slugs.length === 1) {
    const names = {
      'problem-validation': 'Problem Validation',
      'solution-validation': 'Solution Validation',
      'pricing-validation': 'Pricing Validation',
      'survey': 'Survey',
      'statistical-analysis': 'Statistical Analysis'
    };
    return names[slugs[0] as keyof typeof names] || 'validation';
  }
  return `${slugs.length} validation types`;
};

async function switchToAI() {
  // Select first template if none selected
  if (selectedTemplateSlugs.value.length === 0 && scenarioTemplates.value.length > 0) {
    selectedTemplateSlugs.value = [scenarioTemplates.value[0].slug];
  }

  // Switch to AI mode and start generation immediately
  scenarioSource.value = 'ai';
  await generateScenario();
}

const generateScenario = async () => {
  scenarioLoading.value = true;
  scenarioError.value = null;
  scenarioContent.value = '';
  generationProgress.value = 0;

  // Simulate progress during generation
  const progressInterval = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += Math.random() * 10;
    }
  }, 200);

  try {
    const marketContext = buildMarketContextFromForm();

    // 1. Create project if not created yet (skip in edit mode)
    if (!currentProjectId.value && !isEditing.value) {
      const projectName = formData.value.name || `Project ${new Date().toLocaleDateString()}`;
      const createResult = await projectPresenter.createProject(
        projectName,
        formData.value.segmentDescription,
        formData.value.segmentDemographics,
        formData.value.hypothesisDescription,
        formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0),
        marketContext,
        selectedTemplateSlugs.value.length > 0 ? JSON.stringify(selectedTemplateSlugs.value) : undefined,
        workspaceId.value || undefined
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
        currentProjectId.value!,
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
    let demographicsParsed: Record<string, unknown> = {};
    if (formData.value.segmentDemographics) {
      try {
        // Try to parse as JSON
        demographicsParsed = JSON.parse(formData.value.segmentDemographics) as Record<string, unknown>;
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
      marketContext,
      selectedTemplateSlugs.value[0] || undefined
    );

    console.log('✅ Scenario generation completed:', {
      hasScenario: !!scenarioViewModel.scenario.value,
      hasError: !!scenarioViewModel.error.value,
      error: scenarioViewModel.error.value
    });

    if (scenarioViewModel.scenario.value) {
      scenarioContent.value = scenarioViewModel.scenario.value.content ?? '';
      generationProgress.value = 100;

      // Save generated questions for selected validation types
      if (selectedTemplateSlugs.value.length > 0 && scenarioContent.value.trim()) {
        const typesKey = JSON.stringify(selectedTemplateSlugs.value.sort());
        questionsByType.value[typesKey] = scenarioContent.value;
        console.log('Saved generated questions for types:', selectedTemplateSlugs.value);
      }

      // Auto-close success overlay after 2 seconds
      setTimeout(() => {
        scenarioSource.value = 'template';
      }, 2000);
    } else if (scenarioViewModel.error.value) {
      scenarioError.value = sanitizeScenarioError(scenarioViewModel.error.value);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error while generating scenario';
    scenarioError.value = sanitizeScenarioError(msg);
    console.error('❌ Failed to generate scenario:', error);
  } finally {
    clearInterval(progressInterval);
    scenarioLoading.value = false;
    if (!scenarioError.value) {
      // Small delay to show 100% before hiding progress
      setTimeout(() => {
        generationProgress.value = 100;
      }, 500);
    }
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

// Toast notifications
const showToast = ref(false);
const toastMessage = ref('');

// Field error states
const fieldErrors = ref({
  name: false,
  segmentDescription: false,
  segmentDemographics: false,
  hypothesisDescription: false,
  hypothesisAssumptions: false,
  marketPicture: false,
  marketFit: false,
  scenarioContent: false,
  audienceSize: false,
  pricePerResponse: false,
});

async function doComplete() {
  const projectId = currentProjectId.value || editingProjectId.value;
  if (!projectId) return;
  const marketContext = buildMarketContextFromForm();
  await projectPresenter.updateProject(
    projectId,
    formData.value.name || undefined,
    formData.value.segmentDescription || undefined,
    formData.value.segmentDemographics || undefined,
    formData.value.hypothesisDescription || undefined,
    formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0) || undefined,
    undefined,
    marketContext ?? undefined,
    selectedTemplateSlugs.value[0] || undefined
  );

  let content = (scenarioContent.value ?? '').trim();
  const generatedContent = scenarioViewModel.scenario.value?.content?.trim() ?? '';
  const needsSave = content.length > 0 && content !== generatedContent;
  if (needsSave) {
    const saveResult = await scenarioPresenter.saveScenarioVersion(projectId, content);
    if (saveResult.error) {
      console.error('Failed to save scenario version:', saveResult.error);
    }
  }

  if (route.query.onboarding === '1' && typeof localStorage !== 'undefined') {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  }
  // In edit mode, always return to project page
  if (isEditing.value) {
    router.push(workspaceId.value
      ? `/workspaces/${workspaceId.value}/projects/${projectId}`
      : `/projects/${projectId}`);
    return;
  }

  const choice = audienceChoice.value;
  const fromOnboarding = route.query.onboarding === '1';
  const projectPath = workspaceId.value
    ? `/workspaces/${workspaceId.value}/projects/${currentProjectId.value}`
    : `/projects/${currentProjectId.value}`;
  if (currentProjectId.value && (choice === 'email' || choice === 'share')) {
    router.push(fromOnboarding
      ? `${projectPath}/invitations?onboarding=1`
      : `${projectPath}/invitations`);
  } else if (currentProjectId.value && choice === 'panel') {
    router.push(`${projectPath}/panel`);
  // Save current questions before completing
  if (selectedTemplateSlugs.value.length > 0 && scenarioContent.value.trim()) {
    const typesKey = JSON.stringify(selectedTemplateSlugs.value.sort());
    questionsByType.value[typesKey] = scenarioContent.value;
    console.log('Saved final questions for types:', selectedTemplateSlugs.value);
  }

  } else {
    router.push(workspaceId.value ? `/workspaces/${workspaceId.value}/projects` : '/workspaces');
  }
}

const handleComplete = async () => {
  // In edit mode use editingProjectId, otherwise currentProjectId
  if (!currentProjectId.value && !editingProjectId.value) return;

  completingProject.value = true;

  const slug = selectedTemplateSlugs.value[0]?.trim();
  const content = (scenarioContent.value ?? '').trim();
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

  try {
    await doComplete();
  } finally {
    completingProject.value = false;
  }
};

function closeValidationModal() {
  showValidationModal.value = false;
  validationWarnings.value = [];
}

function saveAnyway() {
  closeValidationModal();
  completingProject.value = true;
  doComplete().finally(() => {
    completingProject.value = false;

  // Reset questions storage for editing mode
  questionsByType.value = {};

  });
}

// Function to load existing project for editing
async function loadProjectForEditing(projectId: string) {
  loadingProject.value = true;
  try {
    // Create temporary viewModel for loading project
    const tempViewModel = new ProjectViewModel();

    await projectPresenter.loadProject(projectId, tempViewModel);

    if (tempViewModel.project.value) {
      const project = tempViewModel.project.value;

      // Fill formData with project data
      formData.value.name = project.name;
      if (project.segment) {
        formData.value.segmentDescription = project.segment.description;
        // Convert demographics to string if needed
        if (typeof project.segment.demographics === 'object' && project.segment.demographics) {
          // If demographics is an object, extract text value
          if ('text' in project.segment.demographics) {
            formData.value.segmentDemographics = String(project.segment.demographics.text || '');
          } else {
            formData.value.segmentDemographics = JSON.stringify(project.segment.demographics, null, 2);
          }
        } else {
          formData.value.segmentDemographics = String(project.segment.demographics || '');
        }
      }
      if (project.hypothesis) {
        formData.value.hypothesisDescription = project.hypothesis.description;
        const raw = project.hypothesis.assumptions || [];
        formData.value.hypothesisAssumptions = raw.length
          ? raw.map((a: string | { text: string }) => (typeof a === 'string' ? a : a.text))
          : [''];
      }
      if (project.marketContext) {
        formData.value.marketPicture = project.marketContext.marketPicture || '';
        formData.value.marketFit = project.marketContext.marketFit || '';
        formData.value.differentiation = project.marketContext.differentiation || '';
      }

      currentProjectId.value = projectId;
      isEditing.value = true;
      editingProjectId.value = projectId;

      // Load templates and restore selected validation types
      if (scenarioTemplates.value.length === 0) {
        const { templates, error } = await scenarioPresenter.getTemplates();
        if (!error) scenarioTemplates.value = templates;
      }

      if (project.scenarioTemplateSlug) {
        try {
          const parsed = JSON.parse(project.scenarioTemplateSlug) as unknown;
          const slugs = Array.isArray(parsed)
            ? parsed.filter((s): s is string => typeof s === 'string')
            : [project.scenarioTemplateSlug];
          if (scenarioTemplates.value.length > 0) {
            const validSlugs = slugs.filter(s =>
              scenarioTemplates.value.some(t => t.slug === s)
            );
            selectedTemplateSlugs.value = validSlugs.length > 0 ? validSlugs : (slugs.length > 0 ? [slugs[0]] : []);
          } else {
            selectedTemplateSlugs.value = slugs;
          }
        } catch {
          selectedTemplateSlugs.value = [project.scenarioTemplateSlug];
        }
      }

      // Load existing project scenario
      const scenarioResult = await scenarioPresenter.getLatestByProjectId(projectId);
      if (!('error' in scenarioResult)) {
        scenarioContent.value = scenarioResult.content;
      }
    }
  } catch (error) {
    console.error('Failed to load project for editing:', error);
  } finally {
    loadingProject.value = false;
  }
}

onMounted(async () => {
  // Check if projectId exists in route params for edit mode
  const projectId = route.params.projectId;
  const projectIdStr = Array.isArray(projectId) ? projectId[0] : projectId;

  if (projectIdStr) {
    await loadProjectForEditing(projectIdStr);
  } else {
    // Normal project creation mode
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

.required {
  color: #dc2626;
  font-weight: 600;
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

/* Field error styles */
.form-group.error .form-input,
.form-group.error .form-input:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-group.error label {
  color: #dc2626;
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
  margin-bottom: 0.75rem;
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


@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .wizard-container {
    padding: 1rem;
  }
}

/* Checkbox and Radio Button Styling */
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.9375rem;
  color: var(--color-text);
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.checkbox-option:hover {
  background-color: var(--color-bg-subtle);
}

.checkbox-option input[type="checkbox"] {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  flex-shrink: 0;
}

.checkbox-option input[type="checkbox"]:checked {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox-option input[type="checkbox"]:checked::after {
  content: '✓';
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  color: var(--color-text);
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.radio-option:hover {
  background-color: var(--color-bg-subtle);
}

.radio-option input[type="radio"] {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  flex-shrink: 0;
}

.radio-option input[type="radio"]:checked {
  border-color: var(--color-accent);
}

.radio-option input[type="radio"]:checked::after {
  content: '';
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background-color: var(--color-accent);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Align radio options properly */
.scenario-source-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}


/* Context accordion styling */
.context-accordion {
  margin-top: 1.5rem;
}

.context-accordion-content {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: 0.5rem;
}

/* Validation types grid */
.validation-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Scenario options */
.scenario-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* AI Generate Button */
.btn-ai-generate {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-ai-generate::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-ai-generate:hover::before {
  left: 100%;
}

.btn-ai-generate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
}

.btn-ai-generate:active {
  transform: translateY(0);
}

.btn-ai-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.beta-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 0.25rem;
}

.validation-type-card {
  padding: 1.5rem;
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.validation-type-card:hover {
  border-color: var(--color-accent);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
}

.validation-type-card.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-bg);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}

.validation-type-checkbox {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.validation-type-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.validation-type-header {
  margin-bottom: 1rem;
}

.validation-type-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.validation-type-target {
  font-size: 0.875rem;
  color: var(--color-accent);
  font-weight: 500;
}

.validation-type-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.validation-hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  margin-top: 1rem;
}

/* Generation progress */
.generation-progress {
  margin-top: 1.5rem;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-subtle);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* AI Generation Overlay */
.ai-generation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.generation-loading,
.generation-error,
.generation-success {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.generation-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.generation-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: bounce 1.4s ease-in-out infinite both;
}

.generation-dots span:nth-child(1) { animation-delay: 0s; }
.generation-dots span:nth-child(2) { animation-delay: 0.2s; }
.generation-dots span:nth-child(3) { animation-delay: 0.4s; }

.generation-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.generation-content p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.generation-progress {
  margin-top: 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}


@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.progress-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
