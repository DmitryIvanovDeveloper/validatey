<template>
  <div class="scenario-manual-editor">
    <p class="editor-hint">Add and edit survey questions. No technical knowledge required.</p>

    <div class="questions-list">
      <div
        v-for="(q, index) in questions"
        :key="q.id"
        class="question-card"
      >
        <div class="question-card-header">
          <span class="question-title">{{ q.text?.trim() || `Question ${index + 1}` }}</span>
          <button
            type="button"
            class="btn-remove"
            aria-label="Remove question"
            @click="removeQuestion(index)"
          >
            ×
          </button>
        </div>

        <div class="form-group">
          <label>Question text</label>
          <input
            v-model="q.text"
            type="text"
            class="form-input"
            placeholder="e.g. How important is this feature to you?"
            @input="emitUpdate"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Answer type</label>
            <select v-model="q.type" class="form-input" @change="onTypeChange(q)">
              <option value="open">Open text (free answer)</option>
              <option value="scale">Scale (e.g. 1–5)</option>
              <option value="multiple_choice">Multiple choice</option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="q.required" type="checkbox" @change="emitUpdate" />
              Required
            </label>
          </div>
        </div>

        <div v-if="q.type === 'scale'" class="form-group options-group">
          <label>Scale</label>
          <div class="scale-options">
            <input v-model.number="q.options.min" type="number" min="1" max="10" placeholder="1" class="form-input small" @input="emitUpdate" />
            <span>to</span>
            <input v-model.number="q.options.max" type="number" min="1" max="10" placeholder="5" class="form-input small" @input="emitUpdate" />
          </div>
        </div>

        <div v-if="q.type === 'multiple_choice'" class="form-group options-group">
          <label>Choices (one per line)</label>
          <textarea
            :value="(q.options.choices || []).join('\n')"
            class="form-input"
            rows="3"
            placeholder="Yes&#10;No&#10;Maybe"
            @input="(e) => setChoices(q, (e.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
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

function removeQuestion(index: number) {
  if (questions.value.length <= 1) return;
  questions.value.splice(index, 1);
  emitUpdate();
}
</script>

<style scoped>
.scenario-manual-editor {
  margin-top: 0.5rem;
}

.editor-hint {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin-bottom: 1.25rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.question-card {
  padding: 1.25rem;
  background: var(--color-bg-page, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 0.5rem);
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.question-title {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9375rem;
  flex: 1;
  min-width: 0;
  margin-right: 0.5rem;
  line-height: 1.4;
  word-break: break-word;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-md);
}

.btn-remove:hover {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error, #dc2626);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
  margin-bottom: 0.35rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.form-input.small {
  width: 4rem;
  display: inline-block;
  text-align: center;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: end;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 400;
}

.options-group {
  margin-top: 0.75rem;
}

.scale-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add-question {
  margin-top: 1.25rem;
  padding: 0.75rem 1.25rem;
  border: 2px dashed var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  width: 100%;
}

.btn-add-question:hover {
  border-color: var(--color-accent, #0d9488);
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
