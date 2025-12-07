<template>
  <div class="survey-view">
    <div class="survey-container">
      <!-- Progress Bar -->
      <div class="survey-progress">
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

      <!-- Survey Content -->
      <div v-else-if="viewModel.survey.value && currentQuestion" class="survey-content">
        <div class="question-card">
          <h2 class="question-title">{{ currentQuestion.text }}</h2>
          
          <!-- Scale Question (1-5) -->
          <div v-if="currentQuestion.type === 'scale'" class="question-input">
            <ScaleInput
              :label="'Rate on a scale from 1 to 5'"
              :model-value="typeof currentAnswer === 'number' ? currentAnswer : 0"
              @update:model-value="updateAnswer"
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
              v-if="canGoNext"
              @click="nextQuestion"
              class="btn btn-primary"
            >
              Next →
            </button>
            <button
              v-else-if="isLastQuestion"
              @click="submitSurvey"
              class="btn btn-primary btn-large"
            >
              Complete Survey
            </button>
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

const currentAnswer = ref<string | number>('');
const isCompleted = ref(false);

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
  if (question.required && !currentAnswer.value) return false;
  return true;
});

const isLastQuestion = computed(() => {
  const survey = viewModel.survey.value;
  if (!survey) return false;
  return viewModel.currentQuestionIndex.value === survey.questions.length - 1;
});

const updateAnswer = (value: string | number) => {
  currentAnswer.value = value;
  // TODO: Автосохранение ответа через presenter
};

const handleAudioRecorded = async (blob: Blob) => {
  // TODO: Загрузка аудио через AudioUploadService и сохранение URL
  const audioUrl = URL.createObjectURL(blob);
  currentAnswer.value = audioUrl;
};

const nextQuestion = () => {
  if (!canGoNext.value) return;
  
  // TODO: Сохранение ответа
  saveAnswer();
  
  const survey = viewModel.survey.value;
  if (survey && viewModel.currentQuestionIndex.value < survey.questions.length - 1) {
    viewModel.currentQuestionIndex.value++;
    currentAnswer.value = '';
  }
};

const prevQuestion = () => {
  if (viewModel.currentQuestionIndex.value > 0) {
    viewModel.currentQuestionIndex.value--;
    currentAnswer.value = ''; // TODO: Загрузить сохранённый ответ
  }
};

const saveAnswer = async () => {
  const question = currentQuestion.value;
  if (!question || !currentAnswer.value) return;
  
  // TODO: Вызов presenter для сохранения ответа
  // await presenter.submitAnswer(token, question.id, currentAnswer.value);
};

const submitSurvey = async () => {
  await saveAnswer();
  
  const token = route.params.token as string;
  const startTime = Date.now();
  
  // TODO: Завершение опроса через presenter
  // await presenter.completeSurvey(token);
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  trackSurveyComplete(token, duration);
  
  isCompleted.value = true;
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
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.survey-progress {
  padding: 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
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
  color: #718096;
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
  color: #2d3748;
  margin-bottom: 0.75rem;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.audio-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.question-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
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
