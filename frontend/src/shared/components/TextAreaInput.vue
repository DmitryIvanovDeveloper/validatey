<template>
  <div class="textarea-input">
    <label v-if="label">{{ label }}</label>
    <textarea
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :placeholder="placeholder"
      :required="required"
      rows="4"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue: string;
  placeholder?: string;
  required?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.textarea-input {
  margin: 1rem 0;
}

.textarea-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.textarea-input textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
}

.textarea-input textarea:focus {
  outline: none;
  border-color: #007AFF;
}
</style>



