<template>
  <div class="synthesis-tab-view">
    <!-- Research Synthesis -->
    <div class="section-card synthesis-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-brain" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1a3 3 0 0 1 3 3v6h6a3 3 0 0 1 0 6h-6v6a3 3 0 1 1-6 0v-6H3a3 3 0 1 1 0-6h6V4a3 3 0 0 1 3-3z"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Research Synthesis</h3>
          <p class="section-subtitle">AI-powered insights and recommendations</p>
        </div>
      </div>

      <div v-if="synthesisReport" class="synthesis-content">
        <div class="synthesis-opportunities">
          <h4 class="synthesis-section-title">🚀 Opportunities</h4>
          <div class="synthesis-summary-card">
            <p v-if="synthesisReport.summary?.trim()" class="synthesis-summary">{{ synthesisReport.summary }}</p>
            <ul v-if="synthesisReport.recommendations?.length" class="synthesis-recommendations">
              <li
                v-for="rec in synthesisReport.recommendations"
                :key="rec"
                class="synthesis-recommendation-item"
              >
                <span class="recommendation-check">✓</span>
                {{ rec }}
              </li>
            </ul>
            <p v-if="!synthesisReport.summary?.trim() && !synthesisReport.recommendations?.length" class="synthesis-summary">
              AI analysis completed. Synthesis report is being processed...
            </p>
          </div>
        </div>
      </div>

      <!-- No synthesis available -->
      <div v-else class="state state-empty">
        <span class="state-icon" aria-hidden="true">🧠</span>
        <p class="state-title">Synthesis will appear here</p>
        <p class="state-desc">Complete AI research and analysis to generate insights.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
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

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
}

.synthesis-content {
  padding: 1.5rem;
}

.synthesis-opportunities {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.synthesis-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.synthesis-summary-card {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1.25rem;
}

.synthesis-summary {
  color: #166534;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.synthesis-recommendations {
  margin: 0;
  padding: 0;
  list-style: none;
}

.synthesis-recommendation-item {
  color: #166534;
  font-size: 0.8125rem;
  line-height: 1.5;
  padding: 0.375rem 0;
  position: relative;
  padding-left: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.recommendation-check {
  color: #16a34a;
  font-weight: bold;
  font-size: 0.75rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
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