<template>
  <div class="synthesis-widget">
    <div v-if="!report || (!report.summary?.trim() && !report.recommendations?.length)" class="empty-state">
      <div class="empty-icon">
        <Lightbulb class="w-12 h-12" />
      </div>
      <h3 class="empty-title">No Synthesis Available</h3>
      <p class="empty-description">AI synthesis will be generated after research completion.</p>
    </div>

    <div v-else class="synthesis-content">
      <!-- Summary Section -->
      <div v-if="report.summary?.trim()" class="synthesis-card synthesis-summary">
        <div class="synthesis-card-header">
          <div class="synthesis-card-icon">
            <Lightbulb class="w-5 h-5" />
          </div>
          <h5 class="synthesis-card-title">Executive Summary</h5>
        </div>
        <div class="synthesis-card-content">
          <p class="synthesis-summary-text">{{ report.summary }}</p>
        </div>
      </div>

      <!-- Recommendations Section -->
      <div v-if="report.recommendations?.length" class="synthesis-card synthesis-recommendations">
        <div class="synthesis-card-header">
          <div class="synthesis-card-icon">
            <Target class="w-5 h-5" />
          </div>
          <h5 class="synthesis-card-title">Strategic Recommendations</h5>
        </div>
        <div class="synthesis-card-content">
          <ul class="synthesis-recommendations-list">
            <li
              v-for="rec in report.recommendations"
              :key="rec"
              class="synthesis-recommendation-item"
            >
              <div class="recommendation-check">
                <CheckCircle class="w-4 h-4" />
              </div>
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lightbulb, Target, CheckCircle } from 'lucide-vue-next';
import type { SynthesisReport } from '../../../domain/entities/research-canvas.entity';

interface Props {
  report: SynthesisReport | null;
}

const props = defineProps<Props>();
</script>

<style scoped>
.synthesis-widget {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1.5rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.empty-icon {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.empty-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

.synthesis-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.synthesis-card {
  background: transparent;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  transition: border-color 0.2s;
  margin-bottom: 1.5rem;
}

.synthesis-summary {
  border-left: 4px solid var(--color-success);
}

.synthesis-recommendations {
  border-left: 4px solid var(--color-info);
  background: var(--color-info-bg);
}

.synthesis-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-light);
}

.synthesis-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 50%;
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.synthesis-summary .synthesis-card-icon {
  color: var(--color-success);
  border-color: var(--color-success-light);
}

.synthesis-recommendations .synthesis-card-icon {
  color: var(--color-info);
  border-color: var(--color-info-light);
}

.synthesis-card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.synthesis-card-content {
  padding: 1.5rem;
  background: transparent;
}

.synthesis-summary-text {
  font-size: 0.875rem;
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  margin: 0;
}

.synthesis-recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.synthesis-recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.synthesis-recommendation-item:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.recommendation-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.synthesis-recommendation-item {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: var(--leading-relaxed);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .synthesis-card {
    margin-bottom: 1rem;
  }

  .synthesis-card-header {
    padding: 1rem;
  }

  .synthesis-card-content {
    padding: 1rem;
  }

  .synthesis-card-icon {
    width: 2rem;
    height: 2rem;
  }

  .synthesis-card-title {
    font-size: var(--text-base);
  }

  .synthesis-recommendation-item {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .recommendation-check {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>