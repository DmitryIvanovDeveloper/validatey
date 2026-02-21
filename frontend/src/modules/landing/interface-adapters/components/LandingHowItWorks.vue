<template>
  <section id="how-it-works" class="how-it-works-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">How it works</h2>
        <p class="section-subtitle">
          From idea to validation in three simple steps
        </p>
      </div>

      <div class="steps-container">
        <div class="steps-connector"></div>
        
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-card"
        >
          <div class="step-number">{{ step.number }}</div>
          <div class="step-content">
            <div :class="['step-icon', step.iconBg]">
              <component :is="step.icon" />
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
            <div class="step-detail">{{ step.detail }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h } from 'vue';

const steps = [
  {
    number: '01',
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' })
    ),
    title: 'Who & What?',
    description: 'Define your target segment (who) and hypothesis (what you\'re testing). Add key assumptions and market context.',
    detail: 'Project Wizard Step 1',
    iconBg: 'bg-blue-50'
  },
  {
    number: '02',
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ),
    title: 'Scenarios for Survey',
    description: 'Choose validation type (Problem, Solution, Pricing, or Survey) and generate AI-powered scenarios tailored to your hypothesis.',
    detail: 'Project Wizard Step 2',
    iconBg: 'bg-green-50'
  },
  {
    number: '03',
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' })
    ),
    title: 'Collect Comments',
    description: 'Fetch real feedback from Reddit, Hacker News, and LinkedIn. Our AI analyzes responses and provides validation insights.',
    detail: 'Comments Tab',
    iconBg: 'bg-purple-50'
  }
];
</script>

<style scoped>
.how-it-works-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background: var(--color-bg, #ffffff);
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

.steps-container {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .steps-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

.steps-connector {
  display: none;
}

@media (min-width: 1024px) {
  .steps-connector {
    display: block;
    position: absolute;
    top: 6rem;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-border, #cbd5e1);
    z-index: 0;
  }
}

.step-card {
  position: relative;
  z-index: 10;
  background: var(--color-bg, #ffffff);
  border-radius: var(--radius-xl, 1rem);
  padding: 2rem;
  border: 1px solid var(--color-border, #cbd5e1);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
  transition: box-shadow 0.2s, transform 0.2s;
}

.step-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-4px);
}

.step-number {
  position: absolute;
  top: -1rem;
  left: -1rem;
  width: 4rem;
  height: 4rem;
  background: var(--color-accent, #0d9488);
  border-radius: var(--radius-xl, 1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
}

.step-content {
  margin-top: 1rem;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.step-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
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

.bg-purple-50 {
  background-color: #faf5ff;
}

.bg-purple-50 .icon {
  color: #9333ea;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.75rem;
}

.step-description {
  color: var(--color-text-muted, #475569);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.step-detail {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent, #0d9488);
}
</style>
