<template>
  <div class="executive-summary-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <div class="header-content">
          <div class="section-title-row">
            <h3 class="section-title">Executive Summary</h3>
            <SectionHintButton
              text="Short conclusion on the hypothesis from comments; use as the main takeaway; for details see below."
              aria-label="Hint: Executive Summary"
            />
          </div>
          <button v-if="(summary?.trim() || recommendations?.length)" @click="handleShowDetails" class="show-details-btn">
            <span class="btn-text">Details</span>
          </button>
        </div>
      </div>

      <!-- Loading state: only show animated dots while actually loading -->
      <div v-if="loading" class="loading-state">
        <LoadingSpots message="Analyzing research data..." size="md" />
      </div>

      <!-- Empty state: no data in DB, loading finished -->
      <div v-else-if="!summary?.trim() && !(recommendations?.length)" class="empty-state">
        <p class="empty-text">No research insights available yet</p>
        <p class="empty-subtext">Run research and collect responses to see the executive summary here.</p>
      </div>

      <!-- Content -->
      <div v-else class="summary-content">
        <p v-if="summary?.trim()" class="summary-text">{{ summary }}</p>
        <!-- Strategic Recommendations (Overview) -->
        <div v-if="recommendations?.length" class="strategic-recommendations">
          <h5 class="strategic-recommendations-title">Strategic Recommendations</h5>
          <ul class="strategic-recommendations-list">
            <li
              v-for="rec in recommendations"
              :key="rec"
              class="strategic-recommendation-item"
            >
              <span class="recommendation-check" aria-hidden="true">
                <CheckCircle class="w-4 h-4" />
              </span>
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { CheckCircle } from 'lucide-vue-next';
import SectionHintButton from '../../../../shared/components/SectionHintButton.vue';

interface Props {
  summary: string | null;
  /** Strategic recommendations from synthesis (shown in Overview). */
  recommendations?: string[];
  loading?: boolean;
}

const props = defineProps<Props>();

// Debug logging
console.log('ExecutiveSummaryWidget props:', {
  summary: props.summary,
  summaryLength: props.summary?.length || 0,
  summaryTrimmed: props.summary?.trim(),
  summaryTrimmedLength: props.summary?.trim()?.length || 0,
  loading: props.loading
});

const handleShowDetails = () => {
  emit('show-details');
};

const emit = defineEmits<{
  'show-details': [];
}>();
</script>

<style scoped>
.executive-summary-widget {
  width: 100%;
}

.section-card {
  background: var(--color-bg-page);
  border-radius: 0.75rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 1rem;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.section-icon-brain {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  margin: 0;
}

.show-details-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: transparent;
  color: var(--color-accent);
  border: var(--border-width) var(--border-style) var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-details-btn:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-accent);
}

.btn-text {
  display: inline;
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .show-details-btn {
    align-self: flex-end;
  }

  .btn-text {
    display: none;
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.summary-text {
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: var(--font-weight-normal);
  color: var(--color-text);
  margin: 0;
}

.strategic-recommendations {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.strategic-recommendations-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.strategic-recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.strategic-recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.strategic-recommendation-item:last-child {
  margin-bottom: 0;
}

.recommendation-check {
  flex-shrink: 0;
  color: var(--color-success, #059669);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) 0;
  gap: var(--space-3);
}

.loading-dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-4);
  text-align: center;
  gap: var(--space-2);
}

.empty-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin: 0;
}

.empty-subtext {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}
</style>