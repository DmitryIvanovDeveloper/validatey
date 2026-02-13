<template>
  <div class="scenario-viewer">
    <div class="viewer-header">
      <div class="viewer-title">
        <h3>{{ dynamicTitle }}</h3>
        <p class="viewer-description">{{ dynamicDescription }}</p>
      </div>
      <div class="viewer-actions">
        <button @click="addNewQuestion" class="btn-add-question" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Question
        </button>
      </div>
    </div>

    <!-- Show formatted questions or plain text script -->
    <div class="scenario-preview">
      <div v-if="formattedScenario && formattedScenario.questions && formattedScenario.questions.length > 0" class="questions-list">
        <div
          v-for="(question, index) in formattedScenario.questions"
          :key="question.id || index"
          class="question-card"
        >
          <div class="question-header">
            <div class="question-icon">
              <svg v-if="question.type === 'scale'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/>
                <path d="M18 9V3"/>
                <path d="M12 15v-6"/>
                <path d="M6 21v-6"/>
              </svg>
              <svg v-else-if="question.type === 'open'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <svg v-else-if="question.type === 'multiple_choice'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <div class="question-content">
              <div v-if="editingQuestionId === (question.id || `temp-${Date.now()}`)" class="question-edit-mode">
                <div class="edit-form">
                  <div class="form-group">
                    <label class="form-label">Question Text</label>
                    <textarea
                      :value="getQuestionField(question, 'text')"
                      class="form-input edit-textarea"
                      @input="(e) => updateQuestionField(question, 'text', (e.target as HTMLTextAreaElement).value)"
                      rows="2"
                      placeholder="Enter your question here..."
                    ></textarea>
                  </div>

                  <div class="form-group form-group--checkbox">
                    <label class="checkbox-label">
                      <input
                        :checked="getQuestionField(question, 'required')"
                        type="checkbox"
                        @change="(e) => updateQuestionField(question, 'required', (e.target as HTMLInputElement).checked)"
                      />
                      <span class="checkbox-mark"></span>
                      Required question
                    </label>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Answer Type</label>
                    <select
                      :value="getQuestionField(question, 'type')"
                      class="form-input form-select"
                      @change="(e) => updateQuestionField(question, 'type', (e.target as HTMLSelectElement).value)"
                    >
                      <option value="open">Open Text</option>
                      <option value="scale">Rating Scale</option>
                      <option value="multiple_choice">Multiple Choice</option>
                    </select>
                  </div>

                  <div v-if="getQuestionField(question, 'type') === 'scale'" class="question-options-panel">
                    <div class="options-header">
                      <h4 class="options-title">Scale Settings</h4>
                    </div>
                    <div class="scale-config">
                      <div class="scale-input-group">
                        <label class="scale-label">From</label>
                        <input
                          :value="getQuestionField(question, 'options.min')"
                          type="number"
                          min="0"
                          max="10"
                          class="form-input scale-input"
                          @input="(e) => updateQuestionField(question, 'options.min', parseInt((e.target as HTMLInputElement).value))"
                        />
                      </div>
                      <div class="scale-separator">to</div>
                      <div class="scale-input-group">
                        <label class="scale-label">To</label>
                        <input
                          :value="getQuestionField(question, 'options.max')"
                          type="number"
                          min="1"
                          max="10"
                          class="form-input scale-input"
                          @input="(e) => updateQuestionField(question, 'options.max', parseInt((e.target as HTMLInputElement).value))"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="getQuestionField(question, 'type') === 'multiple_choice'" class="question-options-panel">
                    <div class="options-header">
                      <h4 class="options-title">Answer Choices</h4>
                    </div>
                    <textarea
                      :value="getQuestionField(question, 'options.choices')?.join('\n') || ''"
                      class="form-input choices-textarea"
                      rows="4"
                      placeholder="Enter each choice on a new line:&#10;Yes&#10;No&#10;Maybe&#10;Not sure"
                      @input="(e) => updateChoices(question, (e.target as HTMLTextAreaElement).value)"
                    />
                  </div>

                  <div class="edit-actions">
                    <button @click="saveQuestionEdit(question)" class="btn-save-edit" type="button">Save Changes</button>
                    <button @click="cancelQuestionEdit" class="btn-cancel-edit" type="button">Cancel</button>
                  </div>
                </div>
              </div>
              <div v-else class="question-display">
                <span class="question-text">
                  {{ question.text }}
                  <span v-if="question.required" class="question-required-star">*</span>
                </span>
                <div class="question-meta">
                  <!-- Type badges removed for cleaner look -->
                </div>
              </div>
            </div>
            <div class="question-actions">
              <div class="drag-handle" title="Drag to reorder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 9h8M8 15h8"/>
                  <circle cx="6" cy="9" r="1"/>
                  <circle cx="6" cy="15" r="1"/>
                  <circle cx="18" cy="9" r="1"/>
                  <circle cx="18" cy="15" r="1"/>
                </svg>
              </div>
              <button
                @click="startEditingQuestion(question)"
                class="btn-action btn-edit"
                type="button"
                title="Edit question"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click="duplicateQuestion(question)"
                class="btn-action btn-duplicate"
                type="button"
                title="Duplicate question"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button
                @click="deleteQuestion(question.id || '')"
                class="btn-action btn-delete"
                type="button"
                title="Delete question"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="question.type === 'scale' && question.options" class="question-details">
            <div class="scale-visual">
              <div class="scale-bar">
                <div class="scale-point" v-for="n in (question.options.max || 5) - (question.options.min || 1) + 1" :key="n">
                  {{ (question.options.min || 1) + n - 1 }}
                </div>
              </div>
              <div class="scale-label" v-if="question.options.label">{{ question.options.label }}</div>
            </div>
          </div>

          <div v-else-if="question.type === 'open'" class="question-details">
            <div class="open-response-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Open-ended text response
            </div>
          </div>

          <div v-else-if="question.type === 'multiple_choice' && question.options" class="question-details">
            <div class="choices-preview">
              <div
                v-for="(choice, choiceIndex) in question.options.choices?.slice(0, 3) || []"
                :key="choiceIndex"
                class="choice-preview"
              >
                <div class="choice-radio"></div>
                <span class="choice-text">{{ choice }}</span>
              </div>
              <div v-if="question.options.choices && question.options.choices.length > 3" class="choices-more">
                +{{ question.options.choices.length - 3 }} more options
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="isPlainText" class="scenario-plain-text">
        <p class="plain-text-label">Interview script (generated by AI)</p>
        <div class="plain-text-wrapper">
          <pre class="plain-text-content">{{ jsonContent }}</pre>
        </div>
        <p class="plain-text-hint">Use “Show JSON” to switch to raw view or edit.</p>
      </div>
      <div v-else-if="jsonError" class="empty-state">
        <p class="error-text">⚠️ Invalid JSON: {{ jsonError }}</p>
        <p class="hint-text">Click "Show JSON" to view and fix the content</p>
      </div>
      <div v-else class="empty-state">
        <p>No questions found in the scenario</p>
      </div>
    </div>

    <div class="viewer-footer">
      <button @click="addNewQuestion" class="btn-add-question" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add New Question
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface QuestionOptions {
  min?: number;
  max?: number;
  label?: string;
  choices?: string[];
  multiple?: boolean;
}

interface Question {
  id?: string;
  text: string;
  type: string;
  required?: boolean;
  options?: QuestionOptions;
}

interface Scenario {
  questions?: Question[];
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    content: string;
    /** When 'json', show editable textarea first (e.g. for "Edit manually" in wizard) */
    defaultViewMode?: 'visual' | 'json';
    /** Selected validation type for dynamic title */
    validationType?: string;
  }>(),
  { defaultViewMode: 'visual', validationType: '' }
);

const emit = defineEmits<{
  'update:content': [value: string];
}>();

const jsonContent = ref(props.content);
const jsonError = ref<string | null>(null);
const editingQuestionId = ref<string | null>(null);

const dynamicTitle = computed(() => {
  if (!props.validationType) return 'Survey Scenario';

  const titles = {
    'problem-validation': 'Problem Validation Interview',
    'solution-validation': 'Solution Validation Interview',
    'pricing-validation': 'Pricing Validation Survey',
    'survey': 'Online Survey',
    'statistical-analysis': 'Statistical Analysis Survey'
  };

  return titles[props.validationType as keyof typeof titles] || 'Survey Scenario';
});

const dynamicDescription = computed(() => {
  if (!props.validationType) return 'Review and edit the generated survey scenario';

  const descriptions = {
    'problem-validation': 'Deep interview questions to understand user problems and willingness to pay',
    'solution-validation': 'Interview questions to validate solutions and test prototypes',
    'pricing-validation': 'Survey questions to test price sensitivity and willingness to pay',
    'survey': 'Online survey questions optimized for statistical significance',
    'statistical-analysis': 'Survey questions designed for statistical analysis and A/B testing'
  };

  return descriptions[props.validationType as keyof typeof descriptions] || 'Review and edit the generated survey scenario';
});

function getJsonError(): string | null {
  if (!jsonContent.value?.trim()) return null;
  try {
    JSON.parse(jsonContent.value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

const formattedScenario = computed<Scenario | null>(() => {
  if (!jsonContent.value || !jsonContent.value.trim()) return null;
  try {
    const parsed = JSON.parse(jsonContent.value);
    return parsed;
  } catch {
    return null;
  }
});

const isPlainText = computed(() => {
  if (!jsonContent.value || !jsonContent.value.trim()) return false;
  if (formattedScenario.value?.questions?.length) return false;
  const trimmed = jsonContent.value.trim();
  return trimmed[0] !== '{' && trimmed[0] !== '[';
});

const getQuestionTypeLabel = (type: string): string => {
  const labels = {
    scale: 'Rating Scale',
    open: 'Open Text',
    multiple_choice: 'Multiple Choice'
  };
  return labels[type as keyof typeof labels] || type;
};

// Temporary storage for editing question
const editingQuestion = ref<Question | null>(null);

const startEditingQuestion = (question: Question) => {
  editingQuestionId.value = question.id || `temp-${Date.now()}`;
  // Create a deep copy for editing
  editingQuestion.value = JSON.parse(JSON.stringify(question));
};

const getQuestionField = (question: Question, path: string) => {
  if (!editingQuestion.value || editingQuestionId.value !== (question.id || `temp-${Date.now()}`)) {
    // Return original value if not editing this question
    return path.split('.').reduce((obj, key) => obj?.[key], question);
  }
  // Return editing value
  return path.split('.').reduce((obj, key) => obj?.[key], editingQuestion.value);
};

const updateQuestionField = (question: Question, path: string, value: any) => {
  if (!editingQuestion.value || editingQuestionId.value !== (question.id || `temp-${Date.now()}`)) {
    return;
  }

  const keys = path.split('.');
  let current = editingQuestion.value;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
};

const updateChoices = (question: Question, text: string) => {
  if (!editingQuestion.value || editingQuestionId.value !== (question.id || `temp-${Date.now()}`)) {
    return;
  }

  if (!editingQuestion.value.options) {
    editingQuestion.value.options = { choices: [] };
  }

  const choices = text.split('\n').map(s => s.trim()).filter(Boolean);
  (editingQuestion.value.options as any).choices = choices;
};

const saveQuestionEdit = (originalQuestion: Question) => {
  if (!editingQuestion.value || !editingQuestionId.value) return;

  try {
    const scenario = JSON.parse(jsonContent.value);
    if (scenario.questions) {
      const questionIndex = scenario.questions.findIndex((q: Question) =>
        (q.id || `temp-${Date.now()}`) === editingQuestionId.value
      );

      if (questionIndex !== -1) {
        // Update the question with edited values
        scenario.questions[questionIndex] = { ...editingQuestion.value };
        jsonContent.value = JSON.stringify(scenario, null, 2);
        emit('update:content', jsonContent.value);
      }
    }
  } catch (error) {
    console.error('Failed to save question edit:', error);
  }

  cancelQuestionEdit();
};

const cancelQuestionEdit = () => {
  editingQuestionId.value = null;
  editingQuestion.value = null;
};

const deleteQuestion = (questionId: string) => {
  if (!confirm('Are you sure you want to delete this question?')) return;

  try {
    const scenario = JSON.parse(jsonContent.value);
    if (scenario.questions) {
      scenario.questions = scenario.questions.filter((q: Question) =>
        (q.id || '') !== questionId
      );
      jsonContent.value = JSON.stringify(scenario, null, 2);
      emit('update:content', jsonContent.value);
    }
  } catch (error) {
    console.error('Failed to delete question:', error);
  }
};

const duplicateQuestion = (question: Question) => {
  try {
    const scenario = JSON.parse(jsonContent.value);
    if (scenario.questions) {
      const newQuestion = {
        ...question,
        id: `q_${Date.now()}`,
        text: `${question.text} (Copy)`
      };
      scenario.questions.push(newQuestion);
      jsonContent.value = JSON.stringify(scenario, null, 2);
      emit('update:content', jsonContent.value);
    }
  } catch (error) {
    console.error('Failed to duplicate question:', error);
  }
};

const addNewQuestion = () => {
  try {
    const scenario = JSON.parse(jsonContent.value);
    if (!scenario.questions) scenario.questions = [];

    const newQuestion = {
      id: `q_${Date.now()}`,
      text: 'New question text',
      type: 'open',
      required: false
    };

    scenario.questions.push(newQuestion);
    jsonContent.value = JSON.stringify(scenario, null, 2);
    emit('update:content', jsonContent.value);

    // Start editing the new question
    setTimeout(() => {
      startEditingQuestion(newQuestion);
    }, 100);
  } catch (error) {
    console.error('Failed to add new question:', error);
  }
};

watch(() => props.content, (newContent) => {
  jsonContent.value = newContent;
  jsonError.value = getJsonError();
}, { immediate: true });

</script>

<style scoped>
.scenario-viewer {
  margin-top: 1rem;
  min-width: 0;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.viewer-title h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.viewer-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.btn-view-toggle {
  padding: 0.5rem 1rem;
  background: #edf2f7;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-view-toggle:hover {
  background: #e2e8f0;
}

.scenario-preview {
  background: #f7fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  min-width: 0;
  overflow: hidden;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.question-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-hover));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.question-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.question-card:hover::before {
  opacity: 1;
}

.question-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.question-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: var(--color-accent-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.question-icon svg {
  width: 1rem;
  height: 1rem;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-text {
  font-size: 1rem;
  color: #1a202c;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  display: block;
  font-weight: 500;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}



.question-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.scale-visual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scale-bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.scale-point {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--color-accent);
}

.scale-label {
  font-size: 0.875rem;
  color: #64748b;
  font-style: italic;
}

.open-response-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.open-response-hint svg {
  width: 1rem;
  height: 1rem;
  color: var(--color-accent);
}

.choices-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.choice-radio {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.choice-radio::after {
  content: '';
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.3;
}

.choice-text {
  font-size: 0.875rem;
  color: #374151;
  flex: 1;
  flex-shrink: 0;
}

.choices-more {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  padding: 0.25rem 0.5rem;
  text-align: center;
}

.question-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.question-card:hover .question-actions {
  opacity: 1;
}

.btn-action {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent);
  transform: scale(1.05);
}

.btn-action svg {
  width: 1rem;
  height: 1rem;
}

.btn-delete:hover {
  background: #fed7d7;
  color: #dc2626;
}

.question-edit-mode {
  width: 100%;
}

.question-edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-accent);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 3rem;
  background: white;
  color: #1a202c;
  transition: border-color 0.2s ease;
}

.question-edit-input:focus {
  outline: none;
  border-color: var(--color-accent-hover);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.question-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: flex-end;
}

.btn-save-edit,
.btn-cancel-edit {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-edit {
  background: var(--color-accent);
  color: white;
}

.btn-save-edit:hover {
  background: var(--color-accent-hover);
}

.btn-cancel-edit {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel-edit:hover {
  background: #e2e8f0;
}

/* Edit mode styles */
.question-edit-mode {
  width: 100%;
  position: relative;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--color-bg);
  border: 2px solid var(--color-accent);
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}

.edit-form::before {
  content: '✏️';
  position: absolute;
  top: -10px;
  left: 1rem;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edit-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 4rem;
  background: white;
  transition: all 0.2s ease;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.edit-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1.25rem;
  margin-top: 0.5rem;
  border-top: 2px solid var(--color-border-light);
}

.btn-save-edit,
.btn-cancel-edit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-save-edit {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);
}

.btn-save-edit:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(13, 148, 136, 0.4);
}

.btn-cancel-edit {
  background: #f1f5f9;
  color: #64748b;
  border: 2px solid var(--color-border);
}

.btn-cancel-edit:hover {
  background: #e2e8f0;
  border-color: #cbd5e0;
}

.btn-add-question {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);
}

.btn-add-question:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(13, 148, 136, 0.3);
}

.btn-add-question svg {
  width: 1rem;
  height: 1rem;
}

.viewer-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.drag-handle {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e0;
  cursor: grab;
  transition: color 0.2s ease;
  border-radius: 0.375rem;
  margin-right: 0.25rem;
}

.drag-handle:hover {
  color: #64748b;
  background: #f8fafc;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle svg {
  width: 1rem;
  height: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.error-text {
  color: #e53e3e;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.hint-text {
  color: #718096;
  font-size: 0.875rem;
}

.scenario-json {
  margin-top: 1rem;
}

.json-editor label {
  display: block;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.json-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 400px;
}

.json-textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.json-error {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fed7d7;
  color: #c53030;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.scenario-plain-text {
  padding: 0;
  min-width: 0;
}

.plain-text-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4a5568;
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.02em;
}

.plain-text-wrapper {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.plain-text-content {
  margin: 0;
  padding: 1.25rem 1.25rem 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #2d3748;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.plain-text-content::-webkit-scrollbar {
  width: 8px;
}

.plain-text-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.plain-text-content::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.plain-text-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.plain-text-hint {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0.75rem 0 0;
}

/* Form elements in edit mode */
.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  margin-bottom: 0.75rem;
  letter-spacing: 0.025em;
}

.input-with-validation {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.625rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
  color: var(--color-text);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
  transform: translateY(-1px);
}

.form-input.input-error {
  border-color: var(--color-error);
  background: rgba(220, 38, 38, 0.02);
}

.form-input.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
  background: white;
}

.form-select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.875rem center;
  background-repeat: no-repeat;
  background-size: 1.125rem;
  padding-right: 2.75rem;
  appearance: none;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.input-hint--warning {
  color: var(--color-warning);
}

.input-hint svg {
  width: 0.75rem;
  height: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: end;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
}

.checkbox-mark {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.25rem;
  position: relative;
  background: white;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-mark {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-mark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}


.question-required-star {
  color: var(--color-error);
  font-weight: bold;
  margin-left: 0.25rem;
}

.scale-input {
  width: 4rem;
  text-align: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  background: white;
  transition: all 0.2s ease;
}

.scale-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.choices-textarea {
  margin-bottom: 1rem;
  resize: vertical;
  min-height: 6rem;
  font-family: inherit;
  line-height: 1.6;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.625rem;
  transition: all 0.2s ease;
}

.choices-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.scale-config {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.scale-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.scale-input {
  width: 4rem;
  text-align: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  background: white;
  transition: all 0.2s ease;
}

.scale-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}
</style>

