<template>
  <!-- Floating hint: top-right -->
  <Teleport to="body">
    <button
      type="button"
      class="tips-float"
      aria-label="What comment analysis cannot validate"
      title="What comment analysis cannot validate"
      @click="isOpen = true"
    >
      <span class="tips-float-icon">
        <AlertCircle :size="18" stroke-width="2" />
      </span>
      <span class="tips-float-label">Tips</span>
    </button>
  </Teleport>

  <!-- Popup overlay + panel -->
  <Teleport to="body">
    <Transition name="tips-popup">
      <div v-show="isOpen" class="tips-overlay" @click.self="isOpen = false">
        <div class="tips-popup" role="dialog" aria-modal="true" aria-labelledby="tips-popup-title">
          <div class="tips-popup-header">
            <h3 id="tips-popup-title" class="tips-popup-title">What comment analysis cannot validate</h3>
            <button
              type="button"
              class="tips-popup-close"
              aria-label="Close"
              @click="isOpen = false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="tips-popup-body">
            <div class="tips-header">
              <div class="tips-nav">
                <button
                  type="button"
                  class="tips-btn tips-btn-prev"
                  :disabled="currentIndex === 0"
                  aria-label="Previous tip"
                  @click="prev"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span class="tips-counter">{{ currentIndex + 1 }} / {{ tips.length }}</span>
                <button
                  type="button"
                  class="tips-btn tips-btn-next"
                  :disabled="currentIndex === tips.length - 1"
                  aria-label="Next tip"
                  @click="next"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="tips-dots" role="tablist" aria-label="Tip pages">
              <button
                v-for="(tip, idx) in tips"
                :key="tip.id"
                type="button"
                class="tips-dot"
                :class="{ active: idx === currentIndex }"
                :aria-label="`Tip ${idx + 1}: ${tip.title}`"
                :aria-selected="idx === currentIndex"
                role="tab"
                @click="currentIndex = idx"
              />
            </div>
            <div class="tips-slide">
              <div v-for="(tip, idx) in tips" :key="tip.id" v-show="idx === currentIndex" class="tips-card">
                <h4 class="tips-card-title">{{ tip.title }}</h4>
                <div class="tips-card-body">
                  <template v-for="(section, si) in tip.sections" :key="si">
                    <p v-if="section.type === 'p'" class="tips-p">{{ section.text }}</p>
                    <ul v-else-if="section.type === 'list'" class="tips-list">
                      <li v-for="(item, i) in section.items" :key="i">{{ item }}</li>
                    </ul>
                    <div v-else-if="section.type === 'table'" class="tips-table-wrap">
                      <table class="tips-table">
                        <thead>
                          <tr>
                            <th v-for="(h, hi) in section.headers" :key="hi">{{ h }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(row, ri) in section.rows" :key="ri">
                            <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { commentAnalysisTips } from '../data/comment-analysis-tips';
import type { Tip } from '../data/comment-analysis-tips';

interface Props {
  /** Override default tips (e.g. for i18n). */
  tipsList?: Tip[];
}

const props = defineProps<Props>();

const tips = computed(() => props.tipsList ?? commentAnalysisTips);
const currentIndex = ref(0);
const isOpen = ref(false);

function prev() {
  if (currentIndex.value > 0) currentIndex.value--;
}

function next() {
  if (currentIndex.value < tips.value.length - 1) currentIndex.value++;
}
</script>

<style scoped>
/* Floating hint: top-right */
.tips-float {
  position: fixed;
  top: 7.4rem;
  right: 1rem;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg-page);
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  animation: tips-float-pulse 2.5s ease-in-out infinite;
}

.tips-float:hover {
  background: var(--color-bg-subtle);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  animation: none;
}

.tips-float-icon {
  display: flex;
  color: var(--color-accent, #0f766e);
}

@keyframes tips-float-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
  50% { box-shadow: 0 2px 14px rgba(15, 118, 110, 0.25); }
}

.tips-float-label {
  line-height: 1;
}

/* Popup overlay */
.tips-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

.tips-popup {
  width: 100%;
  max-width: 36rem;
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.tips-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
  flex-shrink: 0;
}

.tips-popup-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
  min-width: 0;
}

.tips-popup-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.tips-popup-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.tips-popup-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.tips-popup-body {
  padding: 1rem 1.25rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* Transition */
.tips-popup-enter-active,
.tips-popup-leave-active {
  transition: opacity 0.2s ease;
}

.tips-popup-enter-active .tips-popup,
.tips-popup-leave-active .tips-popup {
  transition: transform 0.2s ease;
}

.tips-popup-enter-from,
.tips-popup-leave-to {
  opacity: 0;
}

.tips-popup-enter-from .tips-popup,
.tips-popup-leave-to .tips-popup {
  transform: scale(0.96);
}

.tips-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.tips-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tips-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.tips-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.tips-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tips-btn svg {
  width: 1rem;
  height: 1rem;
}

.tips-counter {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: center;
}

.tips-dots {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.tips-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.tips-dot:hover {
  background: var(--color-text-muted);
}

.tips-dot.active {
  background: var(--color-accent, #0f766e);
  transform: scale(1.25);
}

.tips-slide {
  min-height: 8rem;
  position: relative;
}

.tips-card {
  animation: tips-fade 0.2s ease;
}

@keyframes tips-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tips-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.tips-card-body {
  font-size: 0.8125rem;
  color: var(--color-text);
  line-height: 1.5;
}

.tips-p {
  margin: 0 0 0.5rem 0;
}

.tips-p:last-child {
  margin-bottom: 0;
}

.tips-list {
  margin: 0.25rem 0 0.5rem 1.25rem;
  padding: 0;
}

.tips-list li {
  margin-bottom: 0.25rem;
}

.tips-table-wrap {
  overflow-x: auto;
  margin: 0.5rem 0;
}

.tips-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.tips-table th,
.tips-table td {
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.5rem;
  text-align: left;
  vertical-align: top;
}

.tips-table th {
  background: var(--color-bg-subtle);
  font-weight: 600;
  color: var(--color-text);
}

.tips-table td {
  color: var(--color-text);
}
</style>
