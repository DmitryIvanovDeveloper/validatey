<template>
  <div class="scenario-viewer">
    <div class="viewer-header">
      <div class="viewer-title">
        <h3>Survey Scenario</h3>
        <p class="viewer-description">Review and edit the generated survey scenario</p>
      </div>
      <div class="viewer-actions">
        <button 
          @click="toggleViewMode" 
          class="btn-view-toggle"
          type="button"
        >
          {{ viewMode === 'visual' ? '📝 Show JSON' : '👁️ Show Preview' }}
        </button>
      </div>
    </div>

    <!-- Visual Mode: Show formatted questions -->
    <div v-if="viewMode === 'visual'" class="scenario-preview">
      <div v-if="formattedScenario && formattedScenario.questions && formattedScenario.questions.length > 0" class="questions-list">
        <div 
          v-for="(question, index) in formattedScenario.questions" 
          :key="question.id || index"
          class="question-card"
        >
          <div class="question-header">
            <span class="question-number">Q{{ index + 1 }}</span>
            <span v-if="question.required" class="question-required">Required</span>
          </div>
          <div class="question-text">{{ question.text }}</div>
          <div v-if="question.type === 'scale' && question.options" class="question-options">
            <div class="scale-info">
              Scale from {{ question.options.min || 1 }} to {{ question.options.max || 5 }}
              <span v-if="question.options.label">: {{ question.options.label }}</span>
            </div>
          </div>
          <div v-else-if="question.type === 'open'" class="question-options">
            <span class="question-type">Open text response</span>
          </div>
          <div v-else-if="question.type === 'multiple_choice' && question.options" class="question-options">
            <div class="choices-list">
              <div 
                v-for="(choice, choiceIndex) in question.options" 
                :key="choiceIndex"
                class="choice-item"
              >
                {{ choice }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="jsonError" class="empty-state">
        <p class="error-text">⚠️ Unable to parse scenario JSON: {{ jsonError }}</p>
        <p class="hint-text">Click "Show JSON" to view and fix the content</p>
      </div>
      <div v-else class="empty-state">
        <p>No questions found in the scenario</p>
      </div>
    </div>

    <!-- JSON Mode: Show editable JSON -->
    <div v-else class="scenario-json">
      <div class="json-editor">
        <label for="scenario-json-content">JSON Content</label>
        <textarea
          id="scenario-json-content"
          :value="jsonContent"
          @input="handleJsonChange"
          rows="20"
          class="json-textarea"
          placeholder="JSON scenario content..."
        ></textarea>
        <div v-if="jsonError" class="json-error">
          ⚠️ Invalid JSON: {{ jsonError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Question {
  id?: string;
  text: string;
  type: string;
  required?: boolean;
  options?: any;
}

interface Scenario {
  questions?: Question[];
  [key: string]: any;
}

const props = defineProps<{
  content: string;
}>();

const emit = defineEmits<{
  'update:content': [value: string];
}>();

const viewMode = ref<'visual' | 'json'>('visual');
const jsonContent = ref(props.content);
const jsonError = ref<string | null>(null);

const formattedScenario = computed<Scenario | null>(() => {
  if (!jsonContent.value) return null;
  
  try {
    const parsed = JSON.parse(jsonContent.value);
    return parsed;
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'Unknown error';
    return null;
  }
});

watch(() => props.content, (newContent) => {
  jsonContent.value = newContent;
  jsonError.value = null;
}, { immediate: true });

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'visual' ? 'json' : 'visual';
  jsonError.value = null;
};

const handleJsonChange = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  jsonContent.value = target.value;
  jsonError.value = null;
  
  // Validate JSON
  try {
    JSON.parse(target.value);
    emit('update:content', target.value);
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'Invalid JSON';
  }
};

// Format JSON when switching to JSON mode
watch(viewMode, (mode) => {
  if (mode === 'json' && jsonContent.value) {
    try {
      const parsed = JSON.parse(jsonContent.value);
      jsonContent.value = JSON.stringify(parsed, null, 2);
      emit('update:content', jsonContent.value);
    } catch {
      // Keep as-is if invalid
    }
  }
});
</script>

<style scoped>
.scenario-viewer {
  margin-top: 1rem;
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
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}

.question-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.question-number {
  font-weight: 600;
  color: #4299e1;
  font-size: 0.875rem;
}

.question-required {
  font-size: 0.75rem;
  color: #e53e3e;
  font-weight: 500;
}

.question-text {
  font-size: 1rem;
  color: #2d3748;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.question-options {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.scale-info {
  font-size: 0.875rem;
  color: #718096;
}

.question-type {
  font-size: 0.875rem;
  color: #718096;
  font-style: italic;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-item {
  font-size: 0.875rem;
  color: #4a5568;
  padding: 0.5rem;
  background: #f7fafc;
  border-radius: 0.25rem;
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
</style>

