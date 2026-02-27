<template>
  <div class="synthesis-tab-view">
    <!-- Research Synthesis -->
    <div class="section-card synthesis-card">
      <div class="section-card-header">
          <span class="section-icon section-icon-brain" aria-hidden="true">
            <Brain class="w-5 h-5" />
          </span>
        <div>
          <h3 class="section-title">Research Synthesis</h3>
          <p class="section-subtitle">AI-powered insights and recommendations</p>
        </div>
      </div>

      <div class="synthesis-content">
        <div class="synthesis-header">
          <h4 class="synthesis-title">
            <Target class="w-5 h-5 mr-2" />
            Research Synthesis
          </h4>
          <p class="synthesis-subtitle">AI-powered insights and strategic recommendations</p>
        </div>

        <div v-if="synthesisReport && (synthesisReport.summary?.trim() || synthesisReport.recommendations?.length)" class="synthesis-grid">
          <!-- Summary Section -->
          <div v-if="synthesisReport.summary?.trim()" class="synthesis-card synthesis-summary">
            <div class="synthesis-card-header">
              <span class="synthesis-card-icon">
                <FileText class="w-5 h-5" />
              </span>
              <h5 class="synthesis-card-title">Executive Summary</h5>
            </div>
            <div class="synthesis-card-content">
              <p class="synthesis-summary-text">{{ synthesisReport.summary }}</p>
            </div>
          </div>

          <!-- Recommendations Section -->
          <div v-if="synthesisReport.recommendations?.length" class="synthesis-card synthesis-recommendations">
            <div class="synthesis-card-header">
              <span class="synthesis-card-icon">
                <Lightbulb class="w-5 h-5" />
              </span>
              <h5 class="synthesis-card-title">Strategic Recommendations</h5>
            </div>
            <div class="synthesis-card-content">
              <ul class="synthesis-recommendations-list">
                <li
                  v-for="rec in synthesisReport.recommendations"
                  :key="rec"
                  class="synthesis-recommendation-item"
                >
                  <span class="recommendation-check">
                    <CheckCircle class="w-4 h-4" />
                  </span>
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="synthesis-empty-state">
          <div class="empty-state-icon">
            <Brain class="w-16 h-16" />
          </div>
          <div class="empty-state-content">
            <h5 class="empty-state-title">
              {{ synthesisReport ? 'Analysis in Progress' : 'Synthesis Not Generated' }}
            </h5>
            <p class="empty-state-description">
              {{ synthesisReport
                ? 'AI is analyzing your research data. Results will appear here shortly.'
                : 'Complete market research first, then AI will generate strategic insights and recommendations.'
              }}
            </p>
            <div v-if="!synthesisReport" class="empty-state-actions">
              <button
                @click="$emit('start-research')"
                :disabled="false"
                class="btn btn-research-primary"
              >
                <span class="btn-icon">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </span>
                Start Research
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Brain, Target, Lightbulb, RefreshCw, FileText, CheckCircle } from 'lucide-vue-next';

// Emits
const emit = defineEmits<{
  startResearch: [];
}>();

interface Props {
  synthesisReport?: {
    summary: string;
    recommendations: string[];
  } | null;
}

defineProps<Props>();
</script>

<style scoped>
.synthesis-tab-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section cards */
.section-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
  padding: 1.5rem;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: -1.5rem -1.5rem 1.5rem -1.5rem;
  padding: 0.5rem 1.5rem 1.5rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.section-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent, #0d9488);
}

.section-icon-brain {
  background: rgba(13, 148, 136, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.15rem 0;
  letter-spacing: -0.01em;
}


.synthesis-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.synthesis-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.synthesis-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.synthesis-title .w-5 {
  flex-shrink: 0;
}

.synthesis-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.synthesis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.synthesis-card {
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  transition: border-color 0.2s;
}

.synthesis-summary {
  border-color: #bbf7d0;
}

.synthesis-recommendations {
  background: #fef3c7;
  border-color: #fcd34d;
}

.synthesis-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.synthesis-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.synthesis-recommendations .synthesis-card-icon {
  background: rgba(245, 158, 11, 0.1);
}

.synthesis-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.synthesis-card-content {
  padding: 1.5rem;
  background: transparent;
}

.synthesis-summary-text {
  color: #166534;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

.synthesis-recommendations-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.synthesis-recommendation-item {
  color: #92400e;
  font-size: 0.875rem;
  line-height: 1.5;
  position: relative;
  padding-left: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.recommendation-check {
  color: #ea580c;
  font-weight: bold;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.synthesis-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.processing-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.processing-text {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

/* Empty State */
.synthesis-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--color-bg-subtle, #f8fafc);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
}

.empty-state-icon {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.empty-state-content {
  max-width: 400px;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.empty-state-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.empty-state-actions .btn-research-primary {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}

.empty-state-actions .btn-research-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}

.empty-state-actions .btn-research-primary .btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* States */
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  font-size: 0.9375rem;
  text-align: center;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-md);
}

.state-empty {
  color: var(--color-text-muted);
}

.state-icon {
  font-size: 2rem;
}

.state-title {
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0.5rem 0 0.25rem 0;
}

.state-desc {
  color: var(--color-text-muted, #64748b);
  margin: 0;
  font-size: 0.875rem;
}
</style>