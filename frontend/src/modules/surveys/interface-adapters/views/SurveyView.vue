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
        <div class="completion-icon">✅</div>
        <h2>Thank you for participating!</h2>
        <p>Your answers have been successfully submitted.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import ScaleInput from '@/shared/components/ScaleInput.vue';
import MultipleChoiceInput from '@/shared/components/MultipleChoiceInput.vue';
import AudioRecorder from '@/shared/components/AudioRecorder.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { trackSurveyStart, trackSurveyComplete, trackSurveyDropoff } from '@/infrastructure/router/middleware/telemetry-middleware';
import { SurveyViewModel } from '../view-models/survey.view-model';
import { SurveyPresenter } from '../presenters/survey.presenter';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { QuestionType } from '../../domain/value-objects/survey-question.vo';

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
  const startTime = Date.now();
  
  isSubmitting.value = true;
  submitError.value = null;
  
  try {
    // Submit all answers
    const result = await presenter.submitAnswers(token, answers.value);
    
    if (result.success) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      trackSurveyComplete(token, duration);
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
    trackSurveyStart(token);
  }
});

// Отслеживание дроп-оффов при уходе со страницы
onBeforeUnmount(() => {
  const token = route.params.token as string;
  const survey = viewModel.survey.value;
  if (token && survey && !isCompleted.value) {
    trackSurveyDropoff(token, viewModel.currentQuestionIndex.value, currentQuestion.value?.id || '');
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
.consent-error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.loading-state,
.error-state,
.completion-screen {
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon,
.completion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.loading-state p,
.error-state p,
.completion-screen p {
  color: var(--color-text-muted);
  margin-top: 1rem;
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
</style>
