<template>
  <div class="quick-start-tab-view">
    <!-- Quick Start -->
    <div class="section-card quick-start-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-rocket" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0L12 20.5l2 2c1.5 1.5 4 1.5 5.5 0s1.5-4 0-5.5L16.5 12l-2-2L4.5 16.5z"/>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M12 12v10"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Quick Start</h3>
          <p class="section-subtitle">Validate this hypothesis now</p>
        </div>
      </div>

      <div class="quick-start-content">
        <div v-if="recommendedTemplate" class="recommended-method">
          <ul class="method-details">
            <li class="method-detail">
              <span class="method-label">Recommended method:</span>
              <span class="method-value">{{ recommendedTemplate.name }}</span>
            </li>
            <li class="method-detail">
              <span class="method-label">Time:</span>
              <span class="method-value">2–3 days</span>
            </li>
            <li class="method-detail">
              <span class="method-label">Cost:</span>
              <span class="method-value">Free (public link)</span>
            </li>
          </ul>
        </div>

        <div class="quick-start-actions">
          <button
            @click="startResearch"
            :disabled="collectLoading"
            class="btn btn-primary"
          >
            {{ collectLoading ? 'Researching...' : 'Start Research' }}
          </button>
          <router-link
            v-if="projectId"
            :to="`/projects/${projectId}/invitations`"
            class="btn btn-secondary"
          >
            Launch Validation
          </router-link>
        </div>
      </div>
    </div>

    <!-- Optional: geography & segment -->
    <div class="section-card targeting-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-target" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Target Research</h3>
          <p class="section-subtitle">Narrow research scope (optional)</p>
        </div>
      </div>

      <div class="targeting-form">
        <div class="input-group">
          <input
            v-model="collectGeography"
            type="text"
            class="input-field"
            placeholder="Geography (e.g. US, EU)"
            :disabled="collectLoading"
          />
          <input
            v-model="collectSegment"
            type="text"
            class="input-field"
            placeholder="Segment (e.g. B2B SMB)"
            :disabled="collectLoading"
          />
        </div>
      </div>
    </div>

    <!-- Progress when researching market -->
    <div v-if="collectLoading" class="section-card progress-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-brain" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1a3 3 0 0 1 3 3v6h6a3 3 0 0 1 0 6h-6v6a3 3 0 1 1-6 0v-6H3a3 3 0 1 1 0-6h6V4a3 3 0 0 1 3-3z"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Researching Market</h3>
          <p class="section-subtitle">AI-powered market analysis in progress</p>
        </div>
      </div>

      <div class="progress-content">
        <ul class="progress-steps">
          <li class="progress-step completed">
            <span class="step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </span>
            <span class="step-text">Gathering market size from open sources</span>
          </li>
          <li class="progress-step completed">
            <span class="step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </span>
            <span class="step-text">Finding main competitors and their pricing</span>
          </li>
          <li class="progress-step completed">
            <span class="step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </span>
            <span class="step-text">Analyzing trends and niches</span>
          </li>
        </ul>
        <p class="progress-note">Takes 30–60 seconds</p>
      </div>
    </div>

    <!-- Errors -->
    <div v-if="collectError || synthesisError" class="error-card">
      <span class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </span>
      <div class="error-content">
        <div v-if="collectError" class="error-message">
          <strong>Collection Error:</strong> {{ collectError }}
        </div>
        <div v-if="synthesisError" class="error-message">
          <strong>Synthesis Error:</strong> {{ synthesisError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Props
const props = defineProps<{
  projectId?: string;
  recommendedTemplate?: { name: string; slug: string; description: string } | null;
  collectLoading?: boolean;
  collectError?: string | null;
  synthesisError?: string | null;
}>();

// Emits
const emit = defineEmits<{
  startResearch: [geography?: string, segment?: string];
}>();

// Local state
const collectGeography = ref('');
const collectSegment = ref('');

// Methods
const startResearch = () => {
  emit('startResearch', collectGeography.value || undefined, collectSegment.value || undefined);
};
</script>

<style scoped>
.quick-start-tab-view {
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

.section-icon-rocket {
  background: rgba(13, 148, 136, 0.1);
}

.section-icon-target {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.section-icon-brain {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
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

.quick-start-content {
  padding: 1.5rem;
}

.recommended-method {
  margin-bottom: 1.5rem;
}

.method-details {
  margin: 0;
  padding: 0;
  list-style: none;
}

.method-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.method-detail:last-child {
  border-bottom: none;
}

.method-label {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.method-value {
  color: var(--color-text);
  font-size: 0.875rem;
}

.quick-start-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
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

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.targeting-form {
  padding: 1.5rem;
}

.input-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.input-field {
  flex: 1;
  min-width: 12rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-content {
  padding: 1.5rem;
}

.progress-steps {
  margin: 0 0 1rem 0;
  padding: 0;
  list-style: none;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: var(--color-text);
  font-size: 0.875rem;
}

.step-icon {
  width: 1rem;
  height: 1rem;
  color: #10b981;
  flex-shrink: 0;
}

.step-text {
  line-height: 1.4;
}

.progress-note {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
}

.error-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content {
  flex: 1;
}

.error-message {
  color: #991b1b;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.error-message:last-child {
  margin-bottom: 0;
}

.error-message strong {
  font-weight: 600;
}

@media (max-width: 640px) {
  .quick-start-actions,
  .input-group {
    flex-direction: column;
  }

  .btn,
  .input-field {
    width: 100%;
  }

  .method-detail {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>