<template>
  <section class="solution-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ labels.sectionTitle }}</h2>
        <p class="section-subtitle">
          {{ labels.sectionSubtitle }}
          <span class="highlight"> {{ labels.sectionSubtitleHighlight }}</span>
        </p>
      </div>

      <div class="solutions-grid">
        <div
          v-for="(solution, index) in solutionsWithIcons"
          :key="index"
          class="solution-card"
        >
          <div :class="['solution-icon', solution.iconBg]">
            <component :is="solution.icon" />
          </div>
          <h3 class="solution-title">{{ solution.title }}</h3>
          <p class="solution-description">{{ solution.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h, computed } from 'vue';
import { DEFAULT_LANDING_LABELS } from '../landing-default-labels';

const props = withDefaults(
  defineProps<{ labels?: Partial<typeof DEFAULT_LANDING_LABELS.solution>>()>(),
  () => ({})
);

const labels = computed(() => ({ ...DEFAULT_LANDING_LABELS.solution, ...props.labels }));

const iconBgs = ['bg-blue-50', 'bg-green-50', 'bg-orange-50', 'bg-purple-50'] as const;
const icons = [
  () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
  ),
  () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
  ),
  () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
  ),
  () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
  ),
];

const solutionsWithIcons = computed(() =>
  labels.value.solutions.map((s, i) => ({
    ...s,
    icon: icons[i],
    iconBg: iconBgs[i],
  }))
);
</script>

<style scoped>
.solution-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background-color: var(--color-bg, #ffffff);
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

.highlight {
  font-weight: 600;
  color: var(--color-accent, #0d9488);
}

.solutions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .solutions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .solutions-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.solution-card {
  background: var(--color-bg, #ffffff);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 2rem;
  border: 2px solid var(--color-border, #cbd5e1);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.solution-card:hover {
  border-color: var(--color-accent-muted, #5eead4);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
  transform: translateY(-2px);
}

.solution-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: transform 0.2s;
}

.solution-card:hover .solution-icon {
  transform: scale(1.1);
}

.solution-icon .icon {
  width: 1.75rem;
  height: 1.75rem;
}

.bg-blue-50 {
  background-color: var(--color-bg-subtle, #e2e8f0);
}

.bg-blue-50 .icon {
  color: var(--color-accent, #0d9488);
}

.bg-green-50 {
  background-color: #f0fdf4;
}

.bg-green-50 .icon {
  color: #16a34a;
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

.solution-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.75rem;
}

.solution-description {
  color: var(--color-text-muted, #475569);
  line-height: 1.6;
}
</style>
