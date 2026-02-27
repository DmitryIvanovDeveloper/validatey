<template>
  <section class="who-its-for-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Built for everyone in the ecosystem</h2>
        <p class="section-subtitle">
          Founders validate, users discover, investors decide
        </p>
      </div>

      <div class="audiences-grid">
        <div
          v-for="(audience, index) in audiences"
          :key="index"
          class="audience-card"
        >
          <div :class="['audience-icon', audience.iconBg]">
            <component :is="audience.icon" />
          </div>
          <h3 class="audience-title">{{ audience.title }}</h3>
          <blockquote class="audience-quote">
            <p>"{{ audience.quote }}"</p>
          </blockquote>
          <div v-if="audience.name" class="audience-author">
            <div :class="['author-avatar', audience.iconBg]">
              {{ audience.name.charAt(0) }}
            </div>
            <div class="author-info">
              <div class="author-name">{{ audience.name }}</div>
              <div class="author-role">{{ audience.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h } from 'vue';

const audiences = [
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
    ),
    title: 'For Entrepreneurs',
    quote: 'I finally know if my idea is worth pursuing before I waste time building it',
    name: '',
    role: '',
    iconBg: 'bg-blue-50'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
    ),
    title: 'For Users',
    quote: 'In 30 seconds I know if this product solves my problem. No registration required.',
    name: '',
    role: '',
    iconBg: 'bg-green-50'
  },
  {
    icon: () => h('svg', { class: 'icon', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' })
    ),
    title: 'For Investors',
    quote: 'I see real validation data, not just a pitch deck full of assumptions',
    name: '',
    role: '',
    iconBg: 'bg-orange-50'
  }
];
</script>

<style scoped>
.who-its-for-section {
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

.audiences-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .audiences-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.audience-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s, transform 0.2s;
}

.audience-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-4px);
}

.audience-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.audience-icon .icon {
  width: 2rem;
  height: 2rem;
}

.bg-blue-50 {
  background-color: var(--color-bg-subtle, #e2e8f0);
}

.bg-blue-50 .icon {
  color: var(--color-text-muted, #475569);
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

.audience-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin-bottom: 1rem;
}

.audience-quote {
  margin: 0 0 1.5rem 0;
}

.audience-quote p {
  font-size: 1.125rem;
  font-style: italic;
  color: var(--color-text-muted, #475569);
  line-height: 1.6;
}

.audience-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.bg-blue-50.author-avatar {
  background-color: var(--color-accent-light, #ccfbf1);
  color: var(--color-accent, #0d9488);
}

.bg-green-50.author-avatar {
  background-color: #f0fdf4;
  color: #16a34a;
}

.bg-orange-50.author-avatar {
  background-color: #fff7ed;
  color: #ea580c;
}

.author-name {
  font-weight: 600;
  color: var(--color-text, #0f172a);
}

.author-role {
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
}
</style>
