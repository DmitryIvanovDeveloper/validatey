<template>
  <div class="executive-summary-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <div class="header-content">
          <h3 class="section-title">Executive Summary</h3>
          <button v-if="summary?.trim()" @click="handleShowDetails" class="show-details-btn">
            <span class="btn-text">Details</span>
          </button>
        </div>
      </div>

      <!-- Loading state: only show animated dots while actually loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="loading-text">Analyzing research data...</p>
      </div>

      <!-- Empty state: no data in DB, loading finished -->
      <div v-else-if="!summary?.trim()" class="empty-state">
        <p class="empty-text">No research insights available yet</p>
        <p class="empty-subtext">Run research and collect responses to see the executive summary here.</p>
      </div>

      <!-- Content -->
      <div v-else class="summary-content">
        <p class="summary-text">{{ summary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { FileText } from 'lucide-vue-next';

interface Props {
  summary: string | null;
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
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
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
  font-size: 0.9375rem;
  line-height: 1.5;
  font-weight: var(--font-weight-normal);
  color: var(--color-text);
  margin: 0;
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
  gap: var(--space-1);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: loading-dots 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.empty-state {
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