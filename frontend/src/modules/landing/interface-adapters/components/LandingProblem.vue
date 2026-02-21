<template>
  <section class="problem-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Building in the dark is risky</h2>
        <p class="section-subtitle">
          Every founder faces these challenges when trying to validate their ideas
        </p>
      </div>

      <div class="problems-grid">
        <div
          v-for="(problem, index) in problems"
          :key="index"
          class="problem-card"
        >
          <div :class="['problem-icon', problem.iconBg]">
            <component :is="problem.icon" />
          </div>
          <h3 class="problem-title">{{ problem.title }}</h3>
          <p class="problem-description">{{ problem.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h } from 'vue';

const problems = [
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' })
    ),
    title: 'Reddit roulette',
    description: 'Your post lives for 2 hours, then disappears with 3 comments',
    iconBg: 'bg-red-50'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
    ),
    title: 'Friend feedback',
    description: "They'll say it's great to be nice, not to help",
    iconBg: 'bg-orange-50'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ),
    title: 'Investor catch-22',
    description: 'They want data, you have none',
    iconBg: 'bg-purple-50'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
    ),
    title: 'The big fear',
    description: 'Months of work on something nobody wants',
    iconBg: 'bg-gray-100'
  }
];
</script>

<style scoped>
.problem-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background-color: var(--color-bg-page, #f1f5f9);
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

.problems-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .problems-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .problems-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.problem-card {
  background: var(--color-bg, #ffffff);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 1.5rem;
  border: 1px solid var(--color-border, #cbd5e1);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  transition: box-shadow 0.2s;
}

.problem-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.problem-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.problem-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.bg-red-50 {
  background-color: #fef2f2;
}

.bg-red-50 .icon {
  color: #dc2626;
}

.bg-orange-50 {
  background-color: #fff7ed;
}

.bg-orange-50 .icon {
  color: #ea580c;
}

.bg-purple-50 {
  background-color: #faf5ff;
}

.bg-purple-50 .icon {
  color: #9333ea;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.bg-gray-100 .icon {
  color: var(--color-text-muted, #475569);
}

.problem-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.5rem;
}

.problem-description {
  color: var(--color-text-muted, #475569);
  line-height: 1.5;
}
</style>
