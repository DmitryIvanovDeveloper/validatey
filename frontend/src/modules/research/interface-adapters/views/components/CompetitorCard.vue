<template>
  <div class="p-6">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-bold text-gray-900 mb-1">{{ name }}</h3>
        <p class="text-gray-600 text-sm">{{ positioning }}</p>
      </div>
      <div class="text-right">
        <div class="text-sm font-medium text-gray-900">{{ price }}</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-xs font-medium text-green-700 mb-2">Strengths</div>
        <ul class="space-y-1">
          <li v-for="strength in strengths" :key="strength" class="text-sm text-gray-700">
            ✓ {{ strength }}
          </li>
        </ul>
      </div>
      <div>
          <div class="text-xs font-medium text-red-700 mb-2">Weaknesses</div>
        <ul class="space-y-1">
          <li v-for="weakness in weaknesses" :key="weakness" class="text-sm text-gray-700">
            ✗ {{ weakness }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  price: string;
}

defineProps<Props>();
</script>

<style>
.p-6 {
  padding: 1.5rem;
}

.justify-between {
  justify-content: space-between;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.font-bold {
  font-weight: 700;
}

.text-gray-900 {
  color: #111827;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.text-gray-600 {
  color: #4b5563;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.font-medium {
  font-weight: 500;
}

.text-right {
  text-align: right;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-green-700 {
  color: #047857;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.text-gray-700 {
  color: #374151;
}

.text-red-700 {
  color: #b91c1c;
}
</style>