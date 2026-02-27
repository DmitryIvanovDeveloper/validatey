<template>
  <div class="survey-view">
    <div class="survey-container">
      <!-- Progress Bar (only when showing questions) -->
      <div v-if="viewModel.survey.value && (!viewModel.consentRequired.value || viewModel.consentGiven.value)" class="survey-progress">
        <div class="progress-header">
          <span class="progress-text">
            Question {{ viewModel.currentQuestionIndex.value + 1 }} of {{ viewModel.survey.value?.questions.length || 0 }}
          </span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="viewModel.loading.value" class="loading-state">
        <LoadingSpinner />
        <p>Loading survey...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="viewModel.error.value" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Loading Error</h2>
        <p>{{ viewModel.error.value }}</p>
        <button @click="retryLoad" class="btn btn-primary">Try Again</button>
      </div>

      <!-- Consent Screen (block survey until consent given) -->
      <div
        v-else-if="viewModel.survey.value && viewModel.consentRequired.value && !viewModel.consentGiven.value"
        class="consent-screen"
      >
        <h2 class="consent-title">Consent and data use</h2>
        <div v-if="viewModel.consentText.value" class="consent-text" v-html="viewModel.consentText.value"></div>
        <div v-else class="consent-text"><p>By continuing you agree to participate in this survey.</p></div>
        <div v-if="viewModel.dataUsageText.value" class="data-usage-text">
          <strong>How we use your data</strong>
          <p v-html="viewModel.dataUsageText.value"></p>
        </div>
        <div v-if="viewModel.privacyPolicyUrl.value || viewModel.termsOfServiceUrl.value" class="consent-links">
          <a
            v-if="viewModel.privacyPolicyUrl.value"
            :href="viewModel.privacyPolicyUrl.value"
            target="_blank"
            rel="noopener noreferrer"
            class="consent-link"
          >Privacy Policy</a>
          <a
            v-if="viewModel.termsOfServiceUrl.value"
            :href="viewModel.termsOfServiceUrl.value"
            target="_blank"
            rel="noopener noreferrer"
            class="consent-link"
          >Terms of Service</a>
        </div>
        <label class="consent-checkbox">
          <input v-model="consentChecked" type="checkbox" />
          <span>I have read and agree to the above</span>
        </label>
        <div v-if="consentError" class="consent-error">{{ consentError }}</div>
        <button
          type="button"
          class="btn btn-primary btn-large"
          :disabled="!consentChecked || consentSubmitting"
          @click="onConsentContinue"
        >
          {{ consentSubmitting ? 'Sending…' : 'Continue' }}
        </button>
      </div>

      <!-- Email Collection (for public surveys that require email) -->
      <div
        v-else-if="!viewModel.loading.value && !viewModel.error.value && viewModel.emailRequired.value && !emailProvided"
        class="email-collection"
      >
        <h2 class="email-title">Contact Information</h2>
        <p class="email-description">Please provide your email address to continue with the survey.</p>
        <div class="email-input-group">
          <label for="respondent-email" class="email-label">Email address *</label>
          <input
            id="respondent-email"
            v-model="respondentEmail"
            type="email"
            class="email-input"
            placeholder="your.email@example.com"
            required
            @keyup.enter="onEmailContinue"
          />
          <div v-if="emailError" class="email-error">{{ emailError }}</div>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-large"
          :disabled="!respondentEmail.trim() || emailSubmitting"
          @click="onEmailContinue"
        >
          {{ emailSubmitting ? 'Saving…' : 'Continue' }}
        </button>
      </div>

      <!-- Survey Content -->
      <div v-else-if="viewModel.survey.value && currentQuestion && !isCompleted" class="survey-content">
        <div class="question-card">
          <h2 class="question-title">{{ currentQuestion.text }}</h2>
          
          <!-- Scale Question (1-5) -->
          <div v-if="currentQuestion.type === 'scale'" class="question-input">
            <ScaleInput
              :label="currentQuestion.options?.label || `Rate on a scale from ${currentQuestion.options?.min || 1} to ${currentQuestion.options?.max || 5}`"
              :model-value="typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.options?.min || 1)"
              :min="currentQuestion.options?.min || 1"
              :max="currentQuestion.options?.max || 5"
              @update:model-value="updateAnswer"
            />
          </div>

          <!-- Multiple Choice Question -->
          <div v-else-if="currentQuestion.type === 'multiple_choice'" class="question-input">
            <MultipleChoiceInput
              :question-id="currentQuestion.id"
              :choices="currentQuestion.options?.choices || []"
              :multiple="currentQuestion.options?.multiple || false"
              :model-value="getMultipleChoiceValue()"
              @update:model-value="handleMultipleChoiceUpdate"
            />
          </div>

          <!-- Open Text Question -->
          <div v-else-if="currentQuestion.type === 'open'" class="question-input">
            <label class="input-label">Your answer:</label>
            <textarea
              :value="typeof currentAnswer === 'string' ? currentAnswer : ''"
              rows="5"
              class="text-input"
              placeholder="Enter your answer..."
              @input="updateAnswer(($event.target as HTMLTextAreaElement).value)"
            ></textarea>
          </div>

          <!-- Audio Question -->
          <div v-else-if="currentQuestion.type === 'audio'" class="question-input">
            <label class="input-label">Record audio answer:</label>
            <AudioRecorder @recorded="handleAudioRecorded" />
            <div v-if="currentAnswer && typeof currentAnswer === 'string'" class="audio-preview">
              <audio :src="currentAnswer" controls></audio>
            </div>
          </div>

          <!-- Question Footer -->
          <div class="question-footer">
            <button
              v-if="viewModel.currentQuestionIndex.value > 0"
              @click="prevQuestion"
              class="btn btn-secondary"
            >
              ← Back
            </button>
            <div class="spacer"></div>
            <button
              v-if="canGoNext && !isLastQuestion"
              @click="nextQuestion"
              class="btn btn-primary"
            >
              Next →
            </button>
            <button
              v-else-if="isLastQuestion && canGoNext"
              @click="submitSurvey"
              class="btn btn-primary btn-large"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : 'Complete Survey' }}
            </button>
          </div>
          
          <!-- Submit Error -->
          <div v-if="submitError" class="submit-error">
            <p class="error-text">{{ submitError }}</p>
            <button @click="submitSurvey" class="btn btn-primary">Try Again</button>
          </div>
        </div>
      </div>

      <!-- Completion Screen -->
      <div v-else-if="isCompleted" class="completion-screen">
        <div class="completion-card">
          <div class="completion-icon-wrap" aria-hidden="true">
            <svg class="completion-check" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle class="completion-circle" cx="26" cy="26" r="24" stroke-width="2"/>
              <path class="completion-path" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 26l10 10 14-18"/>
            </svg>
          </div>
          <h2 class="completion-title">Thank you for participating!</h2>
          <p class="completion-message">Your answers have been successfully submitted. We appreciate your time and feedback.</p>
          <div class="completion-meta">You can close this page.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ScaleInput from '../../../../../shared/components/ScaleInput.vue';
import MultipleChoiceInput from '../../../../../shared/components/MultipleChoiceInput.vue';
import AudioRecorder from '../../../../../shared/components/AudioRecorder.vue';
import LoadingSpinner from '../../../../../shared/components/LoadingSpinner.vue';
import { SurveyViewModel } from '../../view-models/survey.view-model';
import { SurveyPresenter } from '../../presenters/survey.presenter';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import { QuestionType } from '../../../domain/value-objects/survey-question.vo';

const route = useRoute();
const viewModel = new SurveyViewModel();
const presenter = container.get<SurveyPresenter>(TYPES.SurveyPresenter);

// Store all answers by question ID
const answers = ref<Record<string, string | number | string[]>>({});
const currentAnswer = computed({
  get: () => {
    const question = currentQuestion.value;
    if (!question) return '';
    return answers.value[question.id] || '';
  },
  set: (value) => {
    const question = currentQuestion.value;
    if (question) {
      answers.value[question.id] = value;
    }
  }
});
const isCompleted = ref(false);
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);
const consentChecked = ref(false);
const consentSubmitting = ref(false);
const consentError = ref<string | null>(null);

// Email collection
const respondentEmail = computed({
  get: () => viewModel.respondentEmail.value,
  set: (value) => { viewModel.respondentEmail.value = value; }
});
const emailProvided = ref(false);
const emailSubmitting = ref(false);
const emailError = ref<string | null>(null);

const currentQuestion = computed(() => {
  const survey = viewModel.survey.value;
  if (!survey) return null;
  const index = viewModel.currentQuestionIndex.value;
  return survey.questions[index] || null;
});


const progressPercent = computed(() => {
  const survey = viewModel.survey.value;
  if (!survey || survey.questions.length === 0) return 0;
  return Math.round(((viewModel.currentQuestionIndex.value + 1) / survey.questions.length) * 100);
});

const canGoNext = computed(() => {
  const question = currentQuestion.value;
  if (!question) return false;
  if (question.required) {
    const answer = currentAnswer.value;
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (typeof answer === 'string' && answer.trim().length === 0) return false;
  }
  return true;
});

const isLastQuestion = computed(() => {
  const survey = viewModel.survey.value;
  if (!survey) return false;
  return viewModel.currentQuestionIndex.value === survey.questions.length - 1;
});

const updateAnswer = (value: string | number | string[]) => {
  currentAnswer.value = value;
  const question = currentQuestion.value;
  if (question) {
    presenter.saveAnswer(route.params.token as string, question.id, value);
  }
};

const getMultipleChoiceValue = (): string | string[] => {
  const question = currentQuestion.value;
  if (!question) {
    return '';
  }
  
  const answer = answers.value[question.id];
  if (question.options?.multiple) {
    return Array.isArray(answer) ? answer : [];
  } else {
    return typeof answer === 'string' ? answer : '';
  }
};

const handleMultipleChoiceUpdate = (value: string | string[]) => {
  updateAnswer(value);
};

const handleAudioRecorded = async (blob: Blob) => {
  // TODO: Загрузка аудио через AudioUploadService и сохранение URL
  const audioUrl = URL.createObjectURL(blob);
  currentAnswer.value = audioUrl;
};

const nextQuestion = () => {
  if (!canGoNext.value) return;
  
  const survey = viewModel.survey.value;
  if (survey && viewModel.currentQuestionIndex.value < survey.questions.length - 1) {
    viewModel.currentQuestionIndex.value++;
  }
};

const prevQuestion = () => {
  if (viewModel.currentQuestionIndex.value > 0) {
    viewModel.currentQuestionIndex.value--;
  }
};

const submitSurvey = async () => {
  const token = route.params.token as string;
  isSubmitting.value = true;
  submitError.value = null;
  
  try {
    // Submit all answers
    const result = await presenter.submitAnswers(token, answers.value);
    
    if (result.success) {
      isCompleted.value = true;
    } else {
      submitError.value = result.error || 'Failed to submit survey';
    }
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Unknown error occurred';
  } finally {
    isSubmitting.value = false;
  }
};

const onConsentContinue = async () => {
  const token = route.params.token as string;
  if (!token) return;
  consentSubmitting.value = true;
  consentError.value = null;
  try {
    const result = await presenter.submitConsent(token, viewModel.consentText.value || undefined);
    if (result.success) {
      viewModel.consentGiven.value = true;
    } else {
      consentError.value = result.error ?? 'Failed to record consent';
    }
  } catch (e) {
    consentError.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    consentSubmitting.value = false;
  }
};

const onEmailContinue = async () => {
  if (!respondentEmail.value.trim()) {
    emailError.value = 'Email address is required';
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(respondentEmail.value.trim())) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  emailSubmitting.value = true;
  emailError.value = null;

  try {
    // For now, just mark email as provided
    // Later we can send it to backend when submitting responses
    emailProvided.value = true;
  } catch (e) {
    emailError.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    emailSubmitting.value = false;
  }
};

const retryLoad = () => {
  const token = route.params.token as string;
  if (token) {
    presenter.loadSurvey(token, viewModel);
  }
};

onMounted(() => {
  const token = route.params.token as string;
  if (token) {
    presenter.loadSurvey(token, viewModel);
  }
});
</script>

<style scoped>
.survey-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.survey-container {
  max-width: 700px;
  width: 100%;
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.survey-progress {
  padding: 1.5rem;
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-text {
  font-weight: 500;
  color: #4a5568;
}

.progress-percent {
  font-weight: 600;
  color: #4299e1;
}

.progress-bar-container {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #667eea);
  transition: width 0.3s ease;
  border-radius: 9999px;
}

.consent-screen {
  padding: 2rem;
  max-width: 560px;
  margin: 0 auto;
}
.consent-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1.25rem;
}
.consent-text,
.data-usage-text {
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}
.data-usage-text strong {
  display: block;
  color: #2d3748;
  margin-bottom: 0.5rem;
}
.consent-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  color: #2d3748;
}
.consent-checkbox input {
  width: 1.25rem;
  height: 1.25rem;
}
.consent-links {
  margin: 1rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.consent-link {
  color: var(--color-accent);
  text-decoration: underline;
  font-size: 0.9375rem;
}
.consent-link:hover {
  color: var(--color-accent-hover, #0d9488);
}

.consent-error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.loading-state,
.error-state {
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.loading-state p,
.error-state p {
  color: var(--color-text-muted);
  margin-top: 1rem;
}

/* Completion screen — modern success state */
.completion-screen {
  padding: 3rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.completion-card {
  text-align: center;
  max-width: 400px;
  animation: completion-appear 0.5s ease-out;
}

@keyframes completion-appear {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.completion-icon-wrap {
  margin: 0 auto 1.5rem;
  width: 80px;
  height: 80px;
}

.completion-check {
  width: 100%;
  height: 100%;
  stroke: var(--color-success, #0d9488);
}

.completion-circle {
  stroke: var(--color-success, #0d9488);
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: completion-draw 0.6s ease-out 0.2s forwards;
}

.completion-path {
  stroke: var(--color-success, #0d9488);
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: completion-draw 0.4s ease-out 0.5s forwards;
}

@keyframes completion-draw {
  to { stroke-dashoffset: 0; }
}

.completion-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.completion-message {
  font-size: 1rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.6;
  margin: 0 0 1.25rem;
}

.completion-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted, #94a3b8);
}

.question-card {
  padding: 2rem;
}

.question-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.question-input {
  margin-bottom: 2rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.audio-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
}

.question-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.spacer {
  flex: 1;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.submit-error {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  text-align: center;
}

.submit-error .error-text {
  color: var(--color-error);
  margin-bottom: 0.75rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .survey-view {
    padding: 1rem 0.5rem;
  }

  .question-card {
    padding: 1.5rem;
  }

  .question-title {
    font-size: 1.25rem;
  }
}

/* Email Collection Styles */
.email-collection {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.email-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.email-description {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.email-input-group {
  margin-bottom: 2rem;
  text-align: left;
}

.email-label {
  display: block;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.email-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.email-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.email-error {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
