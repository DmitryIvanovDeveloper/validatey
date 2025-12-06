<template>
  <div class="create-project-wizard">
    <div class="wizard-container">
      <h1 class="wizard-title">Создание нового проекта</h1>
      <Wizard :steps="wizardSteps" @complete="handleComplete" @step-change="handleStepChange">
        <template #default="{ step }">
          <div class="step-content">
            <!-- Step 1: Segment -->
            <div v-if="step === 0" class="step-panel">
              <h2>Шаг 1: Определите целевой сегмент</h2>
              <p class="step-description">Опишите целевую аудиторию для вашей гипотезы</p>
              
              <div class="form-group">
                <label for="segment-description">Описание сегмента *</label>
                <textarea
                  id="segment-description"
                  v-model="formData.segmentDescription"
                  rows="4"
                  placeholder="Например: Молодые профессионалы 25-35 лет, работающие в IT, с доходом выше среднего..."
                  class="form-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="segment-demographics">Демография *</label>
                <textarea
                  id="segment-demographics"
                  v-model="formData.segmentDemographics"
                  rows="3"
                  placeholder="Возраст, пол, профессия, доход, география, интересы..."
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <!-- Step 2: Hypothesis -->
            <div v-if="step === 1" class="step-panel">
              <h2>Шаг 2: Сформулируйте гипотезу</h2>
              <p class="step-description">Опишите вашу продуктовую гипотезу и предположения</p>
              
              <div class="form-group">
                <label for="hypothesis-description">Описание гипотезы *</label>
                <textarea
                  id="hypothesis-description"
                  v-model="formData.hypothesisDescription"
                  rows="5"
                  placeholder="Например: Мы считаем, что молодые IT-специалисты хотят изучать новые технологии в игровом формате..."
                  class="form-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Предположения *</label>
                <div class="assumptions-list">
                  <div
                    v-for="(assumption, index) in formData.hypothesisAssumptions"
                    :key="index"
                    class="assumption-item"
                  >
                    <input
                      v-model="formData.hypothesisAssumptions[index]"
                      type="text"
                      :placeholder="`Предположение ${index + 1}`"
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
                    + Добавить предположение
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
                  AI-помощник для формулировки
                </button>
              </div>
            </div>

            <!-- Step 3: Scenario -->
            <div v-if="step === 2" class="step-panel">
              <h2>Шаг 3: Редактирование сценария</h2>
              <p class="step-description">Сценарий будет автоматически сгенерирован на основе вашей гипотезы</p>
              
              <div v-if="scenarioLoading" class="scenario-generating">
                <LoadingSpinner />
                <p>Генерируем сценарий с помощью AI...</p>
              </div>

              <div v-else-if="scenarioError" class="scenario-error">
                <div class="error-message">{{ scenarioError }}</div>
                <button @click="generateScenario" class="btn btn-secondary">Попробовать снова</button>
              </div>

              <div v-else-if="scenarioContent" class="scenario-editor">
                <div class="form-group">
                  <label for="scenario-content">Сценарий опроса *</label>
                  <textarea
                    id="scenario-content"
                    v-model="scenarioContent"
                    rows="15"
                    class="form-input scenario-textarea"
                    placeholder="Сценарий опроса будет сгенерирован автоматически..."
                  ></textarea>
                </div>
                <button @click="regenerateScenario" class="btn-regenerate" type="button">
                  🔄 Сгенерировать заново
                </button>
              </div>
            </div>

            <!-- Step 4: Audience & Pricing -->
            <div v-if="step === 3" class="step-panel">
              <h2>Шаг 4: Аудитория и оплата</h2>
              <p class="step-description">Укажите параметры запуска проекта</p>
              
              <div class="form-group">
                <label for="project-name">Название проекта *</label>
                <input
                  id="project-name"
                  v-model="formData.name"
                  type="text"
                  placeholder="Название вашего проекта"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="audience-size">Размер аудитории *</label>
                  <input
                    id="audience-size"
                    v-model.number="formData.audienceSize"
                    type="number"
                    min="1"
                    placeholder="100"
                    class="form-input"
                  />
                  <span class="form-hint">Количество респондентов</span>
                </div>

                <div class="form-group">
                  <label for="price-per-response">Цена за ответ *</label>
                  <input
                    id="price-per-response"
                    v-model.number="formData.pricePerResponse"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5.00"
                    class="form-input"
                  />
                  <span class="form-hint">₽ за ответ</span>
                </div>
              </div>

              <div class="price-summary">
                <div class="price-row">
                  <span>Стоимость проекта:</span>
                  <span class="price-amount">
                    {{ totalPrice.toFixed(2) }} ₽
                  </span>
                </div>
                <div class="price-hint">
                  {{ formData.audienceSize || 0 }} респондентов × {{ formData.pricePerResponse || 0 }} ₽
                </div>
              </div>
            </div>
          </div>
        </template>
      </Wizard>
    </div>

    <!-- AI Helper Modal -->
    <Modal v-model="showAIHelper" title="AI-помощник для формулировки гипотезы">
      <p>Функция AI-помощника будет интегрирована с backend API.</p>
      <template #footer>
        <button @click="showAIHelper = false" class="btn btn-secondary">Закрыть</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Wizard from '@/shared/components/Wizard.vue';
import Modal from '@/shared/components/Modal.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
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
  { label: 'Сегмент' },
  { label: 'Гипотеза' },
  { label: 'Сценарий' },
  { label: 'Аудитория' },
];

const formData = ref({
  name: '',
  segmentDescription: '',
  segmentDemographics: '',
  hypothesisDescription: '',
  hypothesisAssumptions: [''],
  audienceSize: 100,
  pricePerResponse: 5.0,
});

const scenarioContent = ref<string>('');
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);
const showAIHelper = ref(false);
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

const handleStepChange = async (step: number) => {
  // При переходе на шаг 3 (сценарий) создаём проект и генерируем сценарий
  if (step === 2 && !scenarioContent.value && formData.value.hypothesisDescription) {
    await generateScenario();
  }
};

const generateScenario = async () => {
  scenarioLoading.value = true;
  scenarioError.value = null;
  scenarioContent.value = '';

  try {
    // 1. Создаём проект, если ещё не создан
    if (!currentProjectId.value) {
      const projectName = formData.value.name || `Проект ${new Date().toLocaleDateString()}`;
      const projectId = await projectPresenter.createProject(
        projectName,
        formData.value.segmentDescription,
        formData.value.segmentDemographics,
        formData.value.hypothesisDescription,
        formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0)
      );

      if (!projectId) {
        scenarioError.value = 'Не удалось создать проект';
        scenarioLoading.value = false;
        return;
      }

      currentProjectId.value = projectId;
    } else {
      // Обновляем проект с актуальными данными
      await projectPresenter.updateProject(
        currentProjectId.value,
        formData.value.name || undefined,
        formData.value.segmentDescription || undefined,
        formData.value.segmentDemographics || undefined,
        formData.value.hypothesisDescription || undefined,
        formData.value.hypothesisAssumptions.filter(a => a.trim().length > 0) || undefined
      );
    }

    // 2. Генерируем сценарий через UseCase -> Repository -> HttpClient -> Backend API
    // Преобразуем текстовые demographics в объект
    let demographicsParsed: Record<string, any> = {};
    if (formData.value.segmentDemographics) {
      try {
        // Пытаемся распарсить как JSON
        demographicsParsed = JSON.parse(formData.value.segmentDemographics);
      } catch {
        // Если не JSON, сохраняем как текстовое поле
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

    await scenarioPresenter.generateScenario(
      currentProjectId.value!,
      scenarioViewModel,
      segment,
      hypothesis
    );

    if (scenarioViewModel.scenario.value) {
      scenarioContent.value = scenarioViewModel.scenario.value.content;
      scenarioLoading.value = false;
    } else if (scenarioViewModel.error.value) {
      scenarioError.value = scenarioViewModel.error.value;
      scenarioLoading.value = false;
    }
  } catch (error) {
    scenarioError.value = error instanceof Error ? error.message : 'Неизвестная ошибка при генерации сценария';
    scenarioLoading.value = false;
    console.error('Failed to generate scenario:', error);
  }
};

const regenerateScenario = async () => {
  scenarioContent.value = '';
  await generateScenario();
};

const handleComplete = async () => {
  // Обновляем название проекта, если было изменено на шаге 4
  if (currentProjectId.value && formData.value.name) {
    await projectPresenter.updateProject(
      currentProjectId.value,
      formData.value.name
    );
  }

  // Перенаправляем на список проектов
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
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.wizard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 2rem;
  text-align: center;
}

.step-content {
  min-height: 400px;
}

.step-panel {
  animation: fadeIn 0.3s;
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
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.step-description {
  color: #718096;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
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
  background: #fed7d7;
  color: #c53030;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fc8181;
  color: white;
}

.btn-add {
  padding: 0.75rem;
  border: 2px dashed #cbd5e0;
  background: transparent;
  color: #718096;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add:hover {
  border-color: #4299e1;
  color: #4299e1;
}

.ai-helper {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
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
  color: #718096;
}

.scenario-error {
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fed7d7;
  border-radius: 0.5rem;
}

.scenario-editor {
  margin-top: 1rem;
}

.btn-regenerate {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #edf2f7;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-regenerate:hover {
  background: #e2e8f0;
}

.price-summary {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
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
  color: #4299e1;
}

.price-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #718096;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .wizard-container {
    padding: 1rem;
  }
}
</style>
