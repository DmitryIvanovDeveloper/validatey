<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-start gap-3 mb-3">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <component :is="icon" class="w-5 h-5 text-blue-600" />
      </div>
      <h3 class="font-bold text-gray-900 flex-1">{{ title }}</h3>
    </div>
    <p class="text-gray-700 mb-3">{{ content }}</p>
    <div class="text-xs text-gray-500">Источник: {{ source }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: any;
  title: string;
  content: string;
  source: string;
}

defineProps<Props>();
</script>

<style>
.w-10 {
  width: 2.5rem;
}

.h-10 {
  height: 2.5rem;
}

.bg-blue-100 {
  background-color: #dbeafe;
}

.text-blue-600 {
  color: #2563eb;
}

.flex-1 {
  flex: 1 1 0%;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.text-gray-700 {
  color: #374151;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-gray-500 {
  color: #6b7280;
}
</style>