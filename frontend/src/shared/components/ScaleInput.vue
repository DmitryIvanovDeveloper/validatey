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
defineProps<{
  label: string;
  modelValue: number;
}>();

defineEmits<{
  'update:modelValue': [value: number];
}>();

const scaleValues = [1, 2, 3, 4, 5];
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



