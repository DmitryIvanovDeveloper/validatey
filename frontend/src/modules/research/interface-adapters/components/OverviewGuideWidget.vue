<template>
  <div class="overview-guide-widget">
    <button
      type="button"
      class="guide-trigger"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="guide-trigger-icon">
        <HelpCircle class="w-5 h-5" />
      </span>
      <span class="guide-trigger-text">How to read this Overview — when is the hypothesis confirmed?</span>
      <span class="guide-trigger-chevron" :class="{ open: isOpen }">
        <ChevronDown class="w-4 h-4" />
      </span>
    </button>

    <div v-show="isOpen" class="guide-content">
      <div class="guide-section">
        <h4 class="guide-heading">What each block means</h4>
        <ul class="guide-list">
          <li><strong>Executive Summary</strong> — AI summary of your research. Read it first for the main conclusion.</li>
          <li><strong>Comment Pattern Analysis (score)</strong> — How much collected comments support your idea: <strong>Strong Evidence (≥70%)</strong> = hypothesis supported by data; <strong>Moderate (30–70%)</strong> = mixed signals; <strong>Early Stage (&lt;30%)</strong> = too little data or weak support.</li>
          <li><strong>Top Pain Points</strong> — Main problems your audience talks about (from research). Use them to align your solution.</li>
          <li><strong>Early Signals</strong> — Positive/negative/neutral signals from the same research. High-confidence signals are more reliable.</li>
          <li><strong>Decision Pathway</strong> — Your validation steps (e.g. collect responses → run round → get verdict). Green = done, blue = in progress.</li>
        </ul>
      </div>
      <div class="guide-section guide-verdict">
        <h4 class="guide-heading">When is the hypothesis confirmed?</h4>
        <ul class="guide-list guide-verdict-list">
          <li>
            <span class="badge badge-confirmed">Confirmed</span>
            <span class="guide-verdict-text">Comment Pattern score <strong>≥60%</strong> (Strong Evidence) and/or Synthesis verdict <strong>validated</strong> / <strong>strong-validation</strong>. Enough data and clear support.</span>
          </li>
          <li>
            <span class="badge badge-more">Need more data</span>
            <span class="guide-verdict-text">Score 30–70% or verdict <strong>needs-more-data</strong>. Keep collecting responses and comments, then re-check.</span>
          </li>
          <li>
            <span class="badge badge-rejected">Not supported</span>
            <span class="guide-verdict-text">Verdict <strong>rejected</strong> or very low score with enough data. Consider pivoting or changing the hypothesis.</span>
          </li>
        </ul>
        <p class="guide-tip">Tip: Use the <strong>Details</strong> button next to Executive Summary to see Synthesis, Early Signals, and full research breakdown.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HelpCircle, ChevronDown } from 'lucide-vue-next';

const isOpen = ref(false);
</script>

<style scoped>
.overview-guide-widget {
  background: none;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 1rem;
  max-width: 100%;
  box-sizing: border-box;
}

.guide-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9375rem;
  color: #0c4a6e;
  font-weight: 500;
  transition: background 0.2s;
}

.guide-trigger:hover {
  background: rgba(255, 255, 255, 0.6);
}

.guide-trigger-icon {
  flex-shrink: 0;
  color: #0284c7;
}

.guide-trigger-text {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
}

.guide-trigger-chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.guide-trigger-chevron.open {
  transform: rotate(180deg);
}

.guide-content {
  padding: 0 1rem 1rem;
  border-top: 1px solid rgba(2, 132, 199, 0.2);
  max-width: 100%;
  box-sizing: border-box;
}

.guide-section {
  margin-top: 1rem;
}

.guide-section:first-child {
  margin-top: 0.75rem;
}

.guide-heading {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0 0 0.5rem 0;
}

.guide-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #075985;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.guide-list li {
  margin-bottom: 0.35rem;
  max-width: 100%;
}

.guide-list li:last-child {
  margin-bottom: 0;
}

.guide-verdict .guide-list,
.guide-verdict-list {
  list-style: none;
  padding-left: 0;
}

.guide-verdict-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  max-width: 100%;
}

.guide-verdict-text {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.badge {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-confirmed {
  background: #dcfce7;
  color: #166534;
}

.badge-more {
  background: #fef9c3;
  color: #854d0e;
}

.badge-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.guide-tip {
  margin: 0.75rem 0 0;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #075985;
  border-left: 3px solid #0284c7;
}
</style>
