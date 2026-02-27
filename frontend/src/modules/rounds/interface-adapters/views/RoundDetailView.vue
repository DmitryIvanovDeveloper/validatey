<template>
  <div class="round-detail-view">
    <!-- Loading -->
    <div v-if="loading" class="round-loading">
      <div class="round-spinner" />
      <p class="text-gray-500 text-sm mt-3">Loading round…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="round-error">
      <p class="text-red-600 font-medium">{{ error }}</p>
      <button class="btn btn-secondary btn-sm mt-3" @click="loadRound">Retry</button>
    </div>

    <!-- Content -->
    <div v-else-if="round" class="round-content">
      <!-- Header -->
      <div class="round-header">
        <div class="round-meta">
          <span :class="['round-status-badge', `round-status-${round.status}`]">{{ round.status }}</span>
          <span class="round-type-badge">{{ TYPE_LABELS[round.type] ?? round.type }}</span>
        </div>
        <h2 class="round-title">{{ round.title }}</h2>
        <p class="round-created">Created {{ formatDate(round.createdAt) }}</p>
      </div>

      <!-- Action bar -->
      <div class="round-actions-bar">
        <button
          v-if="round.status === 'draft'"
          class="btn-action btn-activate"
          :disabled="statusUpdating"
          @click="setStatus('active')"
        >
          {{ statusUpdating ? 'Updating…' : 'Activate Round' }}
        </button>
        <button
          v-if="round.status === 'active'"
          class="btn-action btn-finalize"
          :disabled="finalizing"
          @click="finalizeRound"
        >
          <span v-if="finalizing" class="btn-spinner" />
          {{ finalizing ? 'Running synthesis…' : 'Complete & Synthesize' }}
        </button>
        <button
          v-if="round.status === 'completed' || round.status === 'archived'"
          class="btn-action btn-secondary-sm"
          :disabled="statusUpdating"
          @click="setStatus('archived')"
        >
          Archive
        </button>
      </div>

      <!-- Synthesis result card -->
      <div v-if="round.results" class="synthesis-card">
        <h3 class="synthesis-heading">Synthesis Result</h3>
        <div class="synthesis-verdict" :class="`verdict-${round.results.confidence >= 0.8 ? 'validated' : round.results.confidence <= 0.2 ? 'rejected' : 'needs-more-data'}`">
          {{
            round.results.confidence >= 0.8
              ? 'Validated'
              : round.results.confidence <= 0.2
              ? 'Rejected'
              : 'Needs More Data'
          }}
          <span class="synthesis-confidence">{{ Math.round(round.results.confidence * 100) }}% confidence</span>
        </div>
        <p v-if="round.results.keyFinding" class="synthesis-finding">
          {{ round.results.keyFinding }}
        </p>
        <div v-if="round.results.nextQuestions?.length" class="synthesis-next">
          <h4 class="synthesis-next-title">Next Questions</h4>
          <ul class="synthesis-next-list">
            <li v-for="(q, i) in round.results.nextQuestions" :key="i">{{ q }}</li>
          </ul>
        </div>
      </div>

      <!-- Empty synthesis state -->
      <div v-else class="synthesis-empty">
        <div class="synthesis-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <p class="synthesis-empty-text">No synthesis yet.</p>
        <p class="synthesis-empty-hint">
          {{ round.status === 'active'
              ? 'Collect responses & comments, then click "Complete & Synthesize" above.'
              : 'Activate this round, collect data, then complete it to generate synthesis.' }}
        </p>
      </div>

      <!-- Scenario section -->
      <div class="scenario-section">
        <h3 class="section-subtitle">Scenario & Survey</h3>
        <p class="section-desc">This round uses the project scenario to collect responses.</p>
        <div class="scenario-actions">
          <router-link :to="`${projectBase}/invitations`" class="btn-action btn-secondary-sm">
            Manage Invitations
          </router-link>
          <router-link :to="`${projectBase}/responses`" class="btn-action btn-secondary-sm">
            View Responses
          </router-link>
          <router-link :to="`${projectBase}/comments`" class="btn-action btn-secondary-sm">
            Comments
          </router-link>
        </div>
      </div>
    </div>

    <!-- Finalize success toast -->
    <div v-if="finalizeSuccess" class="finalize-toast">
      Round completed! Synthesis saved to results.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

type RoundStatus = 'draft' | 'active' | 'completed' | 'archived';
type RoundType = 'survey' | 'interview' | 'ab_test' | 'field';

interface RoundResults {
  keyFinding?: string;
  confidence?: number;
  nextQuestions?: string[];
}

interface RoundDTO {
  id: string;
  projectId: string;
  title: string;
  status: RoundStatus;
  type: RoundType;
  sortOrder: number;
  results: RoundResults | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  survey: 'Survey',
  interview: 'Interview',
  ab_test: 'A/B Test',
  field: 'Field Study',
};

const route = useRoute();
const projectId = route.params.projectId as string;
const roundId = route.params.roundId as string;
const workspaceId = route.params.workspaceId as string;
const projectBase = computed(() => `/workspaces/${workspaceId}/projects/${projectId}`);

const httpClient = container.get<HttpClientPort>(TYPES.HttpClient);

const round = ref<RoundDTO | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const statusUpdating = ref(false);
const finalizing = ref(false);
const finalizeSuccess = ref(false);

async function loadRound() {
  loading.value = true;
  error.value = null;
  try {
    const data = await httpClient.get<RoundDTO>(API_CONFIG.ENDPOINTS.ROUND(projectId, roundId));
    round.value = data;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load round';
  } finally {
    loading.value = false;
  }
}

async function setStatus(status: RoundStatus) {
  if (!round.value || statusUpdating.value) return;
  statusUpdating.value = true;
  try {
    const updated = await httpClient.patch<RoundDTO>(
      API_CONFIG.ENDPOINTS.ROUND(projectId, roundId),
      { status }
    );
    round.value = updated;
  } catch (e) {
    console.error('Failed to update status', e);
  } finally {
    statusUpdating.value = false;
  }
}

async function finalizeRound() {
  if (finalizing.value) return;
  finalizing.value = true;
  try {
    const result = await httpClient.post<{ roundId: string; verdict: string | null; keyFinding: string | null; confidence: number; nextQuestions: string[] }>(
      API_CONFIG.ENDPOINTS.ROUND_FINALIZE(projectId, roundId)
    );
    // Reload round to get updated results and status
    await loadRound();
    if (result.verdict) {
      finalizeSuccess.value = true;
      setTimeout(() => { finalizeSuccess.value = false; }, 3500);
    }
  } catch (e) {
    console.error('Failed to finalize round', e);
  } finally {
    finalizing.value = false;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

onMounted(loadRound);
</script>

<style scoped>
.round-detail-view {
  padding: 2rem 0;
  max-width: 720px;
}

.round-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 0;
}

.round-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(13, 148, 136, 0.2);
  border-top-color: #0d9488;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.round-error {
  padding: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
}

.round-header {
  margin-bottom: 1.5rem;
}

.round-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.round-status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.round-status-draft    { background: rgba(148,163,184,0.15); color: #64748b; }
.round-status-active   { background: rgba(8,145,178,0.12);   color: #0891b2; }
.round-status-completed{ background: rgba(22,163,74,0.12);   color: #166534; }
.round-status-archived { background: rgba(0,0,0,0.06);       color: #94a3b8; }

.round-type-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  background: rgba(124,58,237,0.08);
  color: #7c3aed;
  font-weight: 600;
}

.round-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.round-created {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
}

/* Action bar */
.round-actions-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-activate {
  background: linear-gradient(135deg, #0891b2, #0d9488);
  color: #fff;
}
.btn-activate:hover { opacity: 0.9; }

.btn-finalize {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
}
.btn-finalize:hover { opacity: 0.9; }

.btn-secondary-sm {
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.1);
  color: #374151;
  text-decoration: none;
}
.btn-secondary-sm:hover { background: rgba(0,0,0,0.08); }

.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Synthesis card */
.synthesis-card {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
}

.synthesis-heading {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin: 0 0 0.75rem 0;
}

.synthesis-verdict {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.verdict-validated    { background: rgba(22,163,74,0.1);   color: #166534; }
.verdict-needs-more-data { background: rgba(234,179,8,0.1); color: #854d0e; }
.verdict-rejected     { background: rgba(239,68,68,0.1);   color: #991b1b; }

.synthesis-confidence {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.75;
}

.synthesis-finding {
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.65;
  margin: 0 0 1rem 0;
}

.synthesis-next-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.synthesis-next-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.synthesis-next-list li {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
}

/* Empty synthesis */
.synthesis-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 2rem;
  background: rgba(248,250,252,0.8);
  border: 1px dashed #cbd5e1;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.synthesis-empty-icon { margin-bottom: 0.75rem; }

.synthesis-empty-text {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.synthesis-empty-hint {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
  max-width: 380px;
}

/* Scenario section */
.scenario-section {
  background: rgba(255,255,255,0.8);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.section-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
}

.scenario-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Toast */
.finalize-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #166534;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 9999;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
