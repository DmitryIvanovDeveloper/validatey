<template>
  <section id="validation-types" class="validation-types-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Four ways to validate</h2>
        <p class="section-subtitle">
          Choose the validation type that matches your stage
        </p>
      </div>

      <div class="types-grid">
        <div
          v-for="(type, index) in types"
          :key="index"
          class="type-card"
        >
          <div class="type-header">
            <div :class="['type-icon', type.iconBg]">
              <component :is="type.icon" />
            </div>
            <div class="type-badge">{{ type.badge }}</div>
          </div>
          <h3 class="type-title">{{ type.name }}</h3>
          <div class="type-responses">{{ type.responses }}</div>
          <p class="type-description">{{ type.description }}</p>
          <ul class="type-features">
            <li v-for="(feature, fIndex) in type.features" :key="fIndex" class="feature-item">
              <svg class="feature-check" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h } from 'vue';

const types = [
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
    ),
    name: 'Problem Validation',
    badge: 'For Ideas',
    responses: '8 interviews',
    description: 'Understand if the problem is real and how much people will pay',
    features: ['Deep problem exploration', 'Willingness to pay analysis', 'Target audience insights', 'Email collection'],
    iconBg: 'bg-blue-500'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' })
    ),
    name: 'Solution Validation',
    badge: 'For Prototypes',
    responses: '8 interviews',
    description: 'Test your prototype and get usability feedback',
    features: ['Prototype testing', 'Usability feedback', 'Feature prioritization', 'User experience insights'],
    iconBg: 'bg-purple-500'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ),
    name: 'Pricing Validation',
    badge: 'Before Launch',
    responses: '20 responses',
    description: 'Find the optimal price point for your product',
    features: ['Price sensitivity analysis', 'Competitive positioning', 'Value perception', 'Revenue optimization'],
    iconBg: 'bg-green-500'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ),
    name: 'Survey',
    badge: 'For Launched',
    responses: '40+ responses',
    description: 'Statistical significance with launched products',
    features: ['Custom questions', 'Statistical analysis', 'Trend identification', 'Data export'],
    iconBg: 'bg-orange-500'
  }
];
</script>

<style scoped>
.validation-types-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background-color: white;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .section-title {
    font-size: 3rem;
  }
}

.section-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-muted, #475569);
  max-width: 42rem;
  margin: 0 auto;
}

.types-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .types-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .types-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.type-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.type-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.type-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.bg-blue-500 {
  background: var(--color-accent, #0d9488);
}

.bg-purple-500 {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.bg-green-500 {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.bg-orange-500 {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.type-badge {
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  color: var(--color-text-muted, #475569);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.5rem;
}

.type-responses {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.type-description {
  color: var(--color-text-muted, #475569);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.type-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
}

.feature-check {
  width: 1rem;
  height: 1rem;
  color: #16a34a;
  flex-shrink: 0;
  margin-top: 0.125rem;
}
</style>
