<template>
  <div class="user-signals-tab-view">
    <!-- User Signals -->
    <div class="section-card signals-card">
      <div class="section-card-header">
          <span class="section-icon section-icon-signals" aria-hidden="true">
            <MapPin class="w-5 h-5" />
          </span>
        <div>
          <h3 class="section-title">User Signals</h3>
          <p class="section-subtitle">Early signals from respondent answers</p>
        </div>
      </div>

      <div v-if="insights?.wtp || insights?.retentionHint" class="signals-content">
        <div class="signals-header">
          <h4 class="signals-title">📊 User Validation Signals</h4>
          <p class="signals-subtitle">Key insights from respondent feedback</p>
        </div>

        <div class="signals-grid">
          <!-- Willingness to Pay -->
          <div v-if="insights.wtp" class="signal-card signal-wtp">
            <div class="signal-header">
              <span class="signal-icon">
                <DollarSign class="w-5 h-5" />
              </span>
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
              <span class="signal-icon">
                <RotateCcw class="w-5 h-5" />
              </span>
              <h5 class="signal-title">Customer Retention</h5>
            </div>
            <div class="signal-content">
              <p class="signal-value">{{ insights.retentionHint }}</p>
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

      <!-- No data message -->
      <div v-else class="state state-empty">
        <span class="state-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"/>
            <line x1="18" y1="20" x2="18" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="16"/>
            <path d="M4 12h16"/>
          </svg>
        </span>
        <p class="state-title">No user signals collected yet</p>
        <p class="state-desc">Launch validation and collect responses for early signals and metrics.</p>
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
import { MapPin, Frown, DollarSign, RotateCcw } from 'lucide-vue-next';

interface Props {
  insights?: {
    topPains?: string[];
    wtp?: string;
    retentionHint?: string;
  } | null;
  projectId?: string;
}

defineProps<Props>();
</script>

<style scoped>
.user-signals-tab-view {
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

.section-icon-signals {
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

.signals-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signals-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.signals-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.signals-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.signal-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.signal-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.signal-pains,
.signal-retention {
  background: var(--color-bg-subtle, #f8fafc);
}

.signal-wtp {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.signal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.signal-icon {
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

.signal-wtp .signal-icon {
  background: rgba(21, 128, 61, 0.1);
}

.signal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.signal-wtp .signal-title {
  color: #14532d;
}

.signal-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signal-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signal-list-item {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.5;
  position: relative;
  padding-left: 1.25rem;
}

.signal-list-item:before {
  content: '•';
  color: var(--color-accent);
  font-weight: bold;
  position: absolute;
  left: 0;
  top: 0;
}

.signal-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.signal-wtp .signal-value {
  color: #166534;
}

.signal-note {
  font-size: 0.8125rem;
  color: #15803d;
  margin: 0;
  font-style: italic;
}

.signals-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-accent, #0d9488);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
}

.btn-secondary {
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
}

.btn-secondary:hover {
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text);
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

@media (max-width: 640px) {
  .signals-actions {
    flex-direction: column;
  }

  .signals-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>