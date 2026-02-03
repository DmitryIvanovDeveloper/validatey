<template>
  <div class="multiple-choice-input">
    <div v-if="choices && choices.length > 0" class="choices-container">
      <label
        v-for="(choice, index) in choices"
        :key="index"
        class="choice-item"
        :class="{ 'choice-selected': isSelected(choice) }"
      >
        <input
          :type="multiple ? 'checkbox' : 'radio'"
          :name="`question-${questionId}`"
          :value="choice"
          :checked="isSelected(choice)"
          @change="handleChange(choice, $event)"
          class="choice-input"
        />
        <span class="choice-text">{{ choice }}</span>
      </label>
    </div>
    <div v-else class="no-choices">
      <p class="no-choices-text">No options available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  questionId: string;
  choices: string[];
  multiple?: boolean;
  modelValue: string | string[];
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void;
}>();

const isSelected = (choice: string): boolean => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(choice);
  }
  return props.modelValue === choice;
};

const handleChange = (choice: string, event: Event) => {
  const target = event.target as HTMLInputElement;

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    if (target.checked) {
      if (!currentValue.includes(choice)) {
        currentValue.push(choice);
      }
    } else {
      const index = currentValue.indexOf(choice);
      if (index > -1) {
        currentValue.splice(index, 1);
      }
    }
    emit('update:modelValue', currentValue);
  } else {
    emit('update:modelValue', target.checked ? choice : '');
  }
};
</script>

<style scoped>
.multiple-choice-input {
  width: 100%;
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.choice-item:hover {
  border-color: #4299e1;
  background: #f7fafc;
}

.choice-item.choice-selected {
  border-color: #4299e1;
  background: #ebf8ff;
}

.choice-input {
  margin-right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #4299e1;
}

.choice-text {
  flex: 1;
  font-size: 1rem;
  color: #2d3748;
  user-select: none;
}

.no-choices {
  padding: 1rem;
  text-align: center;
}

.no-choices-text {
  color: #718096;
  font-size: 0.875rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .choice-item {
    padding: 0.75rem;
  }

  .choice-text {
    font-size: 0.9375rem;
  }
}
</style>
