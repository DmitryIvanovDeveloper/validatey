<template>
  <div class="user-signals-widget">
    <div v-if="!insights || (!insights.wtp && !insights.retentionHint && !insights.topPains?.length)" class="empty-state">
      <div class="empty-icon">
        <User class="w-12 h-12" />
      </div>
      <h3 class="empty-title">No User Signals</h3>
      <p class="empty-description">User validation signals will appear here after analysis.</p>
    </div>

    <div v-else class="signals-content">
      <div class="signals-header">
        <div class="signals-title-section">
          <AlertTriangle class="title-icon" />
          <h4 class="signals-title">User Validation Signals</h4>
        </div>
        <p class="signals-subtitle">Key insights from respondent feedback</p>
      </div>

      <div class="signals-grid">
        <!-- Willingness to Pay -->
        <div v-if="insights.wtp" class="signal-card signal-wtp">
          <div class="signal-header">
            <div class="signal-icon">
              <DollarSign class="w-5 h-5" />
            </div>
            <h5 class="signal-title">Willingness to Pay</h5>
          </div>
          <div class="signal-content">
            <p class="signal-value">{{ insights.wtp }}</p>
            <p class="signal-note">Strong validation signal!</p>
          </div>
        </div>

        <!-- Retention Hint -->
        <div v-if="insights.retentionHint" class="signal-card signal-retention">
          <div class="signal-header">
            <div class="signal-icon">
              <RotateCcw class="w-5 h-5" />
            </div>
            <h5 class="signal-title">Customer Retention</h5>
          </div>
          <div class="signal-content">
            <p class="signal-value">{{ insights.retentionHint }}</p>
          </div>
        </div>
      </div>

      <!-- Pain Points -->
      <div v-if="insights.topPains?.length" class="pain-points-section">
        <h4 class="section-title">Pain Points</h4>
        <p class="section-subtitle">Key challenges identified from user feedback</p>

        <div class="pain-points-list">
          <div
            v-for="(pain, index) in insights.topPains"
            :key="index"
            class="pain-point-item"
          >
            <div class="pain-point-number">{{ index + 1 }}</div>
            <div class="pain-point-content">
              <p class="pain-point-text">{{ pain }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="signals-actions">
        <router-link
          v-if="projectId"
          :to="`/projects/${projectId}/responses`"
          class="btn btn-primary"
        >
          View Responses
        </router-link>
        <router-link
          v-if="projectId"
          :to="`/projects/${projectId}/responses`"
          class="btn btn-secondary"
        >
          Analyze Responses
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, DollarSign, RotateCcw, AlertTriangle } from 'lucide-vue-next';
import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';

interface Props {
  insights?: ResearchCanvas['userInsights'] | null;
  projectId?: string;
}

const props = defineProps<Props>();
</script>

<style scoped>
.user-signals-widget {
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
  border: var(--border-width) var(--border-style) var(--color-border-light);
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

.signals-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.signals-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  border: var(--border-width) var(--border-style) var(--color-border-light);
}

.signals-title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.title-icon {
  color: var(--color-accent);
  width: 1.25rem;
  height: 1.25rem;
}

.signals-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.signals-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.signal-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: var(--border-width) var(--border-style) var(--color-border-light);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.signal-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.signal-wtp {
  border-left: var(--border-width) var(--border-style) var(--color-success);
  background: var(--color-success-bg);
}

.signal-retention {
  border-left: var(--border-width) var(--border-style) var(--color-info);
  background: var(--color-info-bg);
}

.signal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.signal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  border-radius: 50%;
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.signal-wtp .signal-icon {
  color: #10b981;
}

.signal-retention .signal-icon {
  color: #3b82f6;
}

.signal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.signal-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signal-value {
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.signal-note {
  font-size: var(--text-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.pain-points-section {
  margin-top: 2rem;
  background: var(--color-bg);
  border: var(--border-width) var(--border-style) var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}


.pain-points-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pain-point-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: var(--border-width) var(--border-style) var(--color-border-light);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.pain-point-item:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.pain-point-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pain-point-content {
  flex: 1;
}

.pain-point-text {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
  font-weight: var(--font-weight-medium);
}

.signals-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: var(--border-width) var(--border-style) transparent;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.btn-secondary {
  background: white;
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-subtle);
}

@media (max-width: 640px) {
  .signals-grid {
    grid-template-columns: 1fr;
  }

  .signals-actions {
    flex-direction: column;
  }
}
</style>