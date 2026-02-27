<template>
  <div class="scenario-manual-editor">
    <div class="editor-header">
      <div class="editor-info">
        <h3 class="editor-title">Manual Question Editor</h3>
        <p class="editor-subtitle">Create and customize your survey questions</p>
      </div>
      <div class="editor-stats">
        <span class="stats-badge">{{ questions.length }} questions</span>
      </div>
    </div>

    <div class="questions-list">
      <div
        v-for="(q, index) in questions"
        :key="q.id"
        class="question-card"
        :class="{ 'question-card--empty': !q.text?.trim() }"
      >
        <div class="question-card-header">
          <div class="question-drag-handle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 9h8M8 15h8"/>
              <circle cx="6" cy="9" r="1"/>
              <circle cx="6" cy="15" r="1"/>
              <circle cx="18" cy="9" r="1"/>
              <circle cx="18" cy="15" r="1"/>
            </svg>
          </div>
          <div class="question-header-content">
            <div class="question-number-badge">
              Q{{ index + 1 }}
            </div>
            <div class="question-type-indicator">
              <div class="question-type-icon">
                <svg v-if="q.type === 'open'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <svg v-else-if="q.type === 'scale'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 9V3"/>
                  <path d="M12 15v-6"/>
                  <path d="M6 21v-6"/>
                </svg>
                <svg v-else-if="q.type === 'multiple_choice'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <span class="question-type-label">{{ getTypeDisplayName(q.type) }}</span>
            </div>
          </div>
          <div class="question-actions">
            <button
              type="button"
              class="btn-action btn-duplicate"
              aria-label="Duplicate question"
              @click="duplicateQuestion(index)"
              title="Duplicate question"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button
              type="button"
              class="btn-action btn-remove"
              aria-label="Remove question"
              @click="removeQuestion(index)"
              :disabled="questions.length <= 1"
              title="Remove question"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="question-content">
          <div class="question-main-form">
            <div class="form-group">
              <label class="form-label">Question Text</label>
              <div class="input-with-validation">
                <input
                  v-model="q.text"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': !q.text?.trim() }"
                  placeholder="Enter your question here..."
                  @input="emitUpdate"
                />
                <div v-if="!q.text?.trim()" class="input-hint input-hint--warning">
                  Question text is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Answer Type</label>
                <select v-model="q.type" class="form-input form-select" @change="onTypeChange(q)">
                  <option value="open">📝 Open Text</option>
                  <option value="scale">📊 Rating Scale</option>
                  <option value="multiple_choice">☑️ Multiple Choice</option>
                </select>
              </div>
              <div class="form-group form-group--checkbox">
                <label class="checkbox-label">
                  <input v-model="q.required" type="checkbox" @change="emitUpdate" />
                  <span class="checkbox-mark"></span>
                  Required question
                </label>
              </div>
            </div>
          </div>

          <div v-if="q.type === 'scale'" class="question-options-panel">
            <div class="options-header">
              <h4 class="options-title">Scale Settings</h4>
            </div>
            <div class="scale-config">
              <div class="scale-input-group">
                <label class="scale-label">From</label>
                <input
                  v-model.number="q.options.min"
                  type="number"
                  min="0"
                  max="10"
                  class="form-input scale-input"
                  @input="emitUpdate"
                />
              </div>
              <div class="scale-separator">to</div>
              <div class="scale-input-group">
                <label class="scale-label">To</label>
                <input
                  v-model.number="q.options.max"
                  type="number"
                  min="1"
                  max="10"
                  class="form-input scale-input"
                  @input="emitUpdate"
                />
              </div>
            </div>
            <div class="scale-preview">
              <div class="scale-preview-bar">
                <div
                  v-for="n in Math.max(1, (q.options.max || 5) - (q.options.min || 1) + 1)"
                  :key="n"
                  class="scale-preview-point"
                  :class="{ 'scale-preview-point--active': n === Math.floor(((q.options.max || 5) - (q.options.min || 1) + 1) / 2) }"
                >
                  {{ (q.options.min || 1) + n - 1 }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="q.type === 'multiple_choice'" class="question-options-panel">
            <div class="options-header">
              <h4 class="options-title">Answer Choices</h4>
              <span class="options-count">{{ (q.options?.choices || []).length }} options</span>
            </div>
            <textarea
              :value="(q.options?.choices || []).join('\n')"
              class="form-input choices-textarea"
              rows="4"
              placeholder="Enter each choice on a new line:&#10;Yes&#10;No&#10;Maybe&#10;Not sure"
              @input="(e) => setChoices(q, (e.target as HTMLTextAreaElement).value)"
            />
            <div class="choices-preview">
              <div class="choices-preview-title">Preview:</div>
              <div class="choices-list">
                <label
                  v-for="(choice, choiceIndex) in (q.options?.choices || []).slice(0, 4)"
                  :key="choiceIndex"
                  class="choice-item"
                >
                  <input type="radio" :name="`preview-${q.id}`" disabled />
                  <span class="choice-text">{{ choice }}</span>
                </label>
                <div v-if="(q.options?.choices || []).length > 4" class="choices-more">
                  +{{ (q.options?.choices || []).length - 4 }} more options
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="question-content">
          <div class="question-main-form">
            <div class="form-group">
              <label class="form-label">Question Text</label>
              <div class="input-with-validation">
                <input
                  v-model="q.text"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': !q.text?.trim() }"
                  placeholder="Enter your question here..."
                  @input="emitUpdate"
                />
                <div v-if="!q.text?.trim()" class="input-hint input-hint--warning">
                  Question text is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Answer Type</label>
                <select v-model="q.type" class="form-input form-select" @change="onTypeChange(q)">
                  <option value="open">📝 Open Text</option>
                  <option value="scale">📊 Rating Scale</option>
                  <option value="multiple_choice">☑️ Multiple Choice</option>
                </select>
              </div>
              <div class="form-group form-group--checkbox">
                <label class="checkbox-label">
                  <input v-model="q.required" type="checkbox" @change="emitUpdate" />
                  <span class="checkbox-mark"></span>
                  Required question
                </label>
              </div>
            </div>
          </div>

          <div v-if="q.type === 'scale'" class="question-options-panel">
            <div class="options-header">
              <h4 class="options-title">Scale Settings</h4>
            </div>
            <div class="scale-config">
              <div class="scale-input-group">
                <label class="scale-label">From</label>
                <input
                  v-model.number="q.options.min"
                  type="number"
                  min="0"
                  max="10"
                  class="form-input scale-input"
                  @input="emitUpdate"
                />
              </div>
              <div class="scale-separator">to</div>
              <div class="scale-input-group">
                <label class="scale-label">To</label>
                <input
                  v-model.number="q.options.max"
                  type="number"
                  min="1"
                  max="10"
                  class="form-input scale-input"
                  @input="emitUpdate"
                />
              </div>
            </div>
            <div class="scale-preview">
              <div class="scale-preview-bar">
                <div
                  v-for="n in Math.max(1, (q.options.max || 5) - (q.options.min || 1) + 1)"
                  :key="n"
                  class="scale-preview-point"
                  :class="{ 'scale-preview-point--active': n === Math.floor(((q.options.max || 5) - (q.options.min || 1) + 1) / 2) }"
                >
                  {{ (q.options.min || 1) + n - 1 }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="q.type === 'multiple_choice'" class="question-options-panel">
            <div class="options-header">
              <h4 class="options-title">Answer Choices</h4>
              <span class="options-count">{{ (q.options?.choices || []).length }} options</span>
            </div>
            <textarea
              :value="(q.options?.choices || []).join('\n')"
              class="form-input choices-textarea"
              rows="4"
              placeholder="Enter each choice on a new line:&#10;Yes&#10;No&#10;Maybe&#10;Not sure"
              @input="(e) => setChoices(q, (e.target as HTMLTextAreaElement).value)"
            />
            <div class="choices-preview">
              <div class="choices-preview-title">Preview:</div>
              <div class="choices-list">
                <label
                  v-for="(choice, choiceIndex) in (q.options?.choices || []).slice(0, 4)"
                  :key="choiceIndex"
                  class="choice-item"
                >
                  <input type="radio" :name="`preview-${q.id}`" disabled />
                  <span class="choice-text">{{ choice }}</span>
                </label>
                <div v-if="(q.options?.choices || []).length > 4" class="choices-more">
                  +{{ (q.options?.choices || []).length - 4 }} more options
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="editor-footer">
      <button type="button" class="btn-add-question" @click="addQuestion">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add New Question
      </button>
    </div>

    <button type="button" class="btn-add-question" @click="addQuestion">
      + Add question
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

export interface ManualQuestion {
  id: string;
  text: string;
  type: 'open' | 'scale' | 'multiple_choice';
  required: boolean;
  options?: { min?: number; max?: number; label?: string } | { choices?: string[] };
}

const props = defineProps<{
  content: string;
}>();

const emit = defineEmits<{
  'update:content': [value: string];
}>();

function parseContent(str: string): ManualQuestion[] {
  if (!str?.trim()) return [];
  try {
    const data = JSON.parse(str);
    const list = Array.isArray(data.questions) ? data.questions : [];
    return list.map((q: Record<string, unknown>, i: number) => ({
      id: (typeof q.id === 'string' ? q.id : '') || `q_${i + 1}`,
      text: typeof q.text === 'string' ? q.text : '',
      type: ['open', 'scale', 'multiple_choice'].includes(String(q.type)) ? String(q.type) : 'open',
      required: !!q.required,
      options: q.type === 'scale'
        ? { min: (q.options && typeof q.options === 'object' && 'min' in q.options ? (q.options as Record<string, unknown>).min : undefined) ?? 1, max: (q.options && typeof q.options === 'object' && 'max' in q.options ? (q.options as Record<string, unknown>).max : undefined) ?? 5, label: (q.options && typeof q.options === 'object' && 'label' in q.options ? (q.options as Record<string, unknown>).label : undefined) }
        : q.type === 'multiple_choice'
          ? { choices: Array.isArray((q.options as Record<string, unknown>)?.choices) ? (q.options as Record<string, unknown>).choices as string[] : [] }
          : undefined,
    }));
  } catch {
    return [];
  }
}

function defaultQuestion(): ManualQuestion {
  return {
    id: `q_${Date.now()}`,
    text: '',
    type: 'open',
    required: true,
  };
}

function getTypeDisplayName(type: string): string {
  const names = {
    open: 'Open Text',
    scale: 'Rating Scale',
    multiple_choice: 'Multiple Choice'
  };
  return names[type as keyof typeof names] || type;
}

const questions = ref<ManualQuestion[]>([]);

function initFromProp() {
  const list = parseContent(props.content);
  questions.value = list.length > 0 ? list : [defaultQuestion()];
}

watch(() => props.content, initFromProp, { immediate: true });

function buildJson(): string {
  const list = questions.value.map((q) => {
    const base: Record<string, unknown> = { id: q.id, text: q.text.trim() || 'Question', type: q.type, required: q.required };
    if (q.type === 'scale' && q.options) {
      base.options = { min: q.options.min ?? 1, max: q.options.max ?? 5 };
      if ('label' in q.options && q.options.label) (base.options as Record<string, unknown>).label = q.options.label;
    }
    if (q.type === 'multiple_choice' && q.options && Array.isArray((q.options as { choices?: string[] }).choices)) {
      base.options = { choices: (q.options as { choices: string[] }).choices.filter((c: string) => c?.trim()) };
    }
    return base;
  });
  return JSON.stringify({ questions: list }, null, 2);
}

function emitUpdate() {
  emit('update:content', buildJson());
}

function onTypeChange(q: ManualQuestion) {
  if (q.type === 'scale' && !q.options) q.options = { min: 1, max: 5 };
  if (q.type === 'multiple_choice' && !q.options) q.options = { choices: [] };
  emitUpdate();
}

function setChoices(q: ManualQuestion, text: string) {
  const opts = q.options as { choices?: string[] } | undefined;
  if (!opts?.choices) q.options = { choices: [] };
  (q.options as { choices: string[] }).choices = text.split('\n').map((s) => s.trim()).filter(Boolean);
  emitUpdate();
}

function addQuestion() {
  questions.value.push(defaultQuestion());
  emitUpdate();
}

function duplicateQuestion(index: number) {
  const question = questions.value[index];
  const newQuestion = {
    ...question,
    id: `q_${Date.now()}`,
    text: question.text ? `${question.text} (Copy)` : '',
  };
  questions.value.splice(index + 1, 0, newQuestion);
  emitUpdate();
}

function removeQuestion(index: number) {
  if (questions.value.length <= 1) return;
  questions.value.splice(index, 1);
  emitUpdate();
}
</script>

<style scoped>
.scenario-manual-editor {
  margin-top: 1rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.editor-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.editor-subtitle {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.editor-stats {
  display: flex;
  align-items: center;
}

.stats-badge {
  background: var(--color-accent-bg);
  color: var(--color-accent);
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--color-accent);
}

.question-card--empty {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
}

.question-card--empty .question-card-header {
  background: linear-gradient(135deg, var(--color-warning-bg), rgba(245, 158, 11, 0.05));
}

.question-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-light);
}

.question-drag-handle {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: grab;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.question-drag-handle:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.question-drag-handle:active {
  cursor: grabbing;
}

.question-drag-handle svg {
  width: 1rem;
  height: 1rem;
}

.question-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.question-number-badge {
  background: var(--color-accent);
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.question-type-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.question-type-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-accent);
  flex-shrink: 0;
}

.question-type-icon svg {
  width: 100%;
  height: 100%;
}

.question-type-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: var(--color-bg);
  color: var(--color-text);
  transform: scale(1.05);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-action:disabled:hover {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-duplicate:hover {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.btn-remove:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.btn-action svg {
  width: 1rem;
  height: 1rem;
}

.question-content {
  padding: 1.5rem;
}

.question-main-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group--checkbox {
  display: flex;
  align-items: center;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.input-with-validation {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.form-input.input-error {
  border-color: var(--color-error);
}

.form-input.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
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
  grid-template-columns: 2fr 1fr;
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

.question-options-panel {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-top: 1rem;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.options-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.options-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
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
}

.scale-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scale-input {
  width: 4rem;
  text-align: center;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.scale-separator {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.scale-preview {
  margin-top: 1rem;
}

.scale-preview-bar {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.scale-preview-point {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.scale-preview-point--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: scale(1.1);
}

.choices-textarea {
  margin-bottom: 1rem;
  resize: vertical;
  min-height: 6rem;
  font-family: inherit;
  line-height: 1.5;
}

.choices-preview {
  margin-top: 1rem;
}

.choices-preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
}

.choice-item input[type="radio"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-accent);
}

.choice-text {
  font-size: 0.875rem;
  color: var(--color-text);
  flex: 1;
}

.choices-more {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
}

.editor-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
}

.btn-add-question {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
  width: 100%;
  justify-content: center;
}

.btn-add-question:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
}

.btn-add-question svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .question-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .question-header-content {
    width: 100%;
    justify-content: space-between;
  }

  .question-actions {
    opacity: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .scale-config {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .scale-preview-bar {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .question-card {
    margin: 0 -0.5rem;
  }

  .question-content {
    padding: 1rem;
  }

  .options-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
