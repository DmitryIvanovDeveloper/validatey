<template>
  <div class="scale-input">
    <label>{{ label }}</label>
    <div class="scale-buttons">
      <button
        v-for="value in scaleValues"
        :key="value"
        :class="{ active: modelValue === value }"
        @click="$emit('update:modelValue', value)"
      >
        {{ value }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  modelValue: number;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 5,
});

defineEmits<{
  'update:modelValue': [value: number];
}>();

const scaleValues = computed(() => {
  const values: number[] = [];
  for (let i = props.min; i <= props.max; i++) {
    values.push(i);
  }
  return values;
});
</script>

<style scoped>
.scale-input {
  margin: 1rem 0;
}

.scale-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.scale-buttons {
  display: flex;
  gap: 0.5rem;
}

.scale-buttons button {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ccc;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.scale-buttons button:hover {
  border-color: #007AFF;
}

.scale-buttons button.active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}
</style>



