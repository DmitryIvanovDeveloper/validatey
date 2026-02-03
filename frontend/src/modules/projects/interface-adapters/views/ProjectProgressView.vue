<template>
  <div class="project-progress-view">
    <!-- Header: context + actions -->
    <header class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <router-link :to="`/projects/${projectId}`" class="breadcrumb-link">Project</router-link>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span class="breadcrumb-current">Progress</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">Project Progress</h1>
        <div class="header-actions">
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">
            Manage Invitations
          </router-link>
          <router-link :to="`/projects/${projectId}/report`" class="btn btn-primary">
            View Report
          </router-link>
          <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back</router-link>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Loading progress data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
    </div>

    <div v-else class="progress-content">
      <!-- Hero: Response progress (primary metric) -->
      <section class="hero-progress" aria-labelledby="progress-heading">
        <h2 id="progress-heading" class="sr-only">Response progress</h2>
        <div class="progress-visual">
          <div class="progress-ring" :style="{ '--p': responseRate }">
            <span class="progress-value">{{ responseRate }}%</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-value">{{ invitationStats.responded }}</span>
            <span class="hero-stat-label">of {{ invitationStats.sent }} sent responded</span>
          </div>
          <p v-if="invitationStats.sent === 0" class="hero-hint">Send invitations to start collecting responses.</p>
          <p v-else-if="responseRate >= 80" class="hero-hint success">Strong response rate. Consider generating the report.</p>
          <p v-else class="hero-hint">Collect more responses for reliable insights.</p>
        </div>
      </section>

      <!-- Two-column layout: operations | insights -->
      <div class="two-col">
        <!-- Left: Operations (metrics + invitations) -->
        <aside class="col-operations">
          <div class="metrics-compact">
            <div class="metric-row">
              <span class="metric-label">Total</span>
              <span class="metric-value">{{ invitationStats.total }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Sent</span>
              <span class="metric-value">{{ invitationStats.sent }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Responded</span>
              <span class="metric-value">{{ invitationStats.responded }}</span>
            </div>
          </div>

          <section class="panel invitations-panel">
            <h3 class="panel-title">Invitations</h3>
            <div v-if="invitations.length === 0" class="panel-empty">
              No invitations yet.
            </div>
            <ul v-else class="invitation-list">
              <li v-for="invitation in invitations" :key="invitation.id" class="invitation-row">
                <span class="inv-email" :title="invitation.email">{{ truncateEmail(invitation.email) }}</span>
                <span :class="['inv-status', `status-${invitation.status}`]">{{ getStatusLabel(invitation.status) }}</span>
              </li>
            </ul>
          </section>
        </aside>

        <!-- Right: Insights (signals + responses) -->
        <main class="col-insights">
          <!-- Early Signals (grouped by type) -->
          <section class="panel signals-panel" aria-labelledby="signals-heading">
            <h3 id="signals-heading" class="panel-title">Early Signals</h3>
            <p class="panel-desc">AI insights from respondent feedback</p>
            <div v-if="earlySignals.length === 0" class="panel-empty">
              No signals yet. Responses with comments will be analyzed automatically.
            </div>
            <div v-else class="signals-grouped">
              <div v-for="type in ['positive', 'negative', 'neutral']" :key="type" class="signal-group">
                <div v-if="signalsByType[type].length" class="signal-group-label" :class="`label-${type}`">
                  {{ type === 'positive' ? 'Positive' : type === 'negative' ? 'Negative' : 'Neutral' }}
                </div>
                <div class="signal-group-items">
                  <div
                    v-for="signal in signalsByType[type]"
                    :key="signal.id"
                    class="signal-card"
                    :class="`signal-${signal.type}`"
                  >
                    <span class="signal-icon" :aria-hidden="true">{{ getSignalIcon(signal.type) }}</span>
                    <div class="signal-body">
                      <strong class="signal-title">{{ signal.title }}</strong>
                      <p class="signal-desc">{{ signal.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Responses (collapsible) -->
          <section class="panel responses-panel" aria-labelledby="responses-heading">
            <div class="panel-head">
              <h3 id="responses-heading" class="panel-title">Responses</h3>
              <span v-if="responses.length > 0" class="panel-count">{{ responses.length }} total</span>
            </div>
            <p class="panel-desc">Individual answers by respondent</p>
            <div v-if="responses.length === 0" class="panel-empty">
              No responses yet. Complete invitations to see answers here.
            </div>
            <div v-else class="responses-accordion">
              <div
                v-for="(response, idx) in responses"
                :key="response.id"
                class="response-block"
                :class="{ 'is-expanded': expandedResponses.has(response.id) }"
              >
                <button
                  type="button"
                  class="response-trigger"
                  :aria-expanded="expandedResponses.has(response.id)"
                  :aria-controls="`response-${response.id}`"
                  :id="`trigger-${response.id}`"
                  @click="toggleResponse(response.id)"
                >
                  <span class="response-num">#{{ idx + 1 }}</span>
                  <span class="response-date">{{ formatDate(new Date(response.createdAt)) }}</span>
                  <span v-if="response.audioUrl" class="badge">Audio</span>
                  <span v-if="response.transcript" class="badge">Transcript</span>
                  <span class="response-chevron" aria-hidden="true">{{ expandedResponses.has(response.id) ? '−' : '+' }}</span>
                </button>
                <div
                  :id="`response-${response.id}`"
                  class="response-body"
                  role="region"
                  :aria-labelledby="`trigger-${response.id}`"
                >
                  <div class="response-answers">
                    <div v-for="(answer, questionId) in response.answers" :key="questionId" class="answer-row">
                      <dt class="answer-q">{{ getQuestionLabel(questionId) }}</dt>
                      <dd class="answer-a">
                        <span v-if="typeof answer === 'object'">{{ formatAnswerValue(answer) }}</span>
                        <span v-else>{{ answer }}</span>
                      </dd>
                    </div>
                  </div>
                  <div v-if="response.transcript" class="response-transcript">
                    <strong class="transcript-label">Transcript</strong>
                    <p class="transcript-text">{{ response.transcript }}</p>
                  </div>
                  <div v-if="response.audioUrl" class="response-audio">
                    <audio :src="response.audioUrl" controls class="audio-player"></audio>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES as INVITATION_TYPES } from '@/modules/invitations/infrastructure/bootstrap/types';
import type { InvitationRepositoryPort } from '@/modules/invitations/application/ports/invitation-repository.port';
import { InvitationStatus } from '@/modules/invitations/domain/entities/invitation.entity';
import { TYPES as ROOT_TYPES } from '@/infrastructure/bootstrap/types';
import type { HttpClientPort } from '@/infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '@/infrastructure/config/api.config';

const route = useRoute();
const projectId = route.params.projectId as string;

const loading = ref(true);
const error = ref<string | null>(null);
const invitations = ref<Array<{
  id: string;
  email: string;
  status: InvitationStatus;
  sentAt: Date | null;
  respondedAt: Date | null;
}>>([]);

const earlySignals = ref<Array<{
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  timestamp: Date;
}>>([]);

const questionLabels = ref<Record<string, string>>({});
const expandedResponses = ref<Set<string>>(new Set());

const responses = ref<Array<{
  id: string;
  invitationId: string;
  projectId: string;
  answers: Record<string, any>;
  audioUrl: string | null;
  transcript: string | null;
  createdAt: string;
  updatedAt: string;
}>>([]);

const invitationRepository = container.get<InvitationRepositoryPort>(INVITATION_TYPES.InvitationRepository);
const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const invitationStats = computed(() => {
  return {
    total: invitations.value.length,
    sent: invitations.value.filter(i => i.status === 'sent' || i.status === 'responded' || i.status === 'completed').length,
    responded: invitations.value.filter(i => i.status === 'responded' || i.status === 'completed').length,
  };
});

const responseRate = computed(() => {
  if (invitationStats.value.sent === 0) return 0;
  return Math.round((invitationStats.value.responded / invitationStats.value.sent) * 100);
});

const signalsByType = computed(() => {
  const byType: Record<string, typeof earlySignals.value> = {
    positive: [],
    negative: [],
    neutral: [],
  };
  earlySignals.value.forEach((s) => byType[s.type].push(s));
  return byType;
});

const toggleResponse = (id: string) => {
  const next = new Set(expandedResponses.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedResponses.value = next;
};

const truncateEmail = (email: string, max = 24) => {
  if (!email || email.length <= max) return email || '—';
  return email.slice(0, max - 3) + '…';
};

const getStatusLabel = (status: InvitationStatus): string => {
  const labels: Record<InvitationStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    responded: 'Responded',
    completed: 'Completed',
    expired: 'Expired',
  };
  return labels[status] || status;
};

const getSignalIcon = (type: string): string => {
  const icons: Record<string, string> = {
    positive: '✓',
    negative: '⚠',
    neutral: 'ℹ',
  };
  return icons[type] || '•';
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getQuestionLabel = (questionId: string): string => {
  const labels = questionLabels.value;
  const direct = labels[questionId];
  if (direct) return direct;
  // Try normalized variants (q1 <-> q_1)
  const alt = questionId.startsWith('q_') ? questionId.replace('q_', 'q') : `q_${questionId.replace(/^q/, '')}`;
  return labels[alt] || questionId;
};

const formatAnswerValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value && typeof value === 'object' && 'text' in value) {
    return String((value as { text: string }).text);
  }
  return JSON.stringify(value, null, 2);
};

function parseQuestionsFromScenario(content: string): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!content?.trim()) return labels;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return labels;
  try {
    const parsed = JSON.parse(trimmed) as { questions?: Array<{ id?: string; text?: string }> };
    if (parsed.questions && Array.isArray(parsed.questions)) {
      parsed.questions.forEach((q, i) => {
        const id = q.id || `q_${i + 1}`;
        const text = typeof q.text === 'string' ? q.text.trim() : '';
        if (text) labels[id] = text;
      });
    }
  } catch {
    // ignore parse errors
  }
  return labels;
}

onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Загружаем приглашения
    const invitationsResult = await invitationRepository.getStatuses(projectId);
    
    if (invitationsResult.isSuccess) {
      invitations.value = invitationsResult.data.map(inv => ({
        id: inv.id,
        email: inv.email || 'No email',
        status: inv.status,
        sentAt: inv.sentAt,
        respondedAt: inv.respondedAt || (inv.status === 'completed' || inv.status === 'responded' ? new Date() : null),
      }));
    } else {
      error.value = 'Failed to load invitations';
      invitations.value = [];
    }

    // Load scenario to get question labels (q1, q2 -> question text)
    try {
      const scenarioUrl = API_CONFIG.ENDPOINTS.SCENARIOS(projectId);
      const scenarioData = await httpClient.get<{ scenario: { content: string } }>(scenarioUrl);
      if (scenarioData?.scenario?.content) {
        questionLabels.value = parseQuestionsFromScenario(scenarioData.scenario.content);
      }
    } catch {
      questionLabels.value = {};
    }
    
    // Загружаем ответы
    try {
      const responsesUrl = API_CONFIG.ENDPOINTS.RESPONSES(projectId);
      console.log('Loading responses from:', responsesUrl);
      const responsesData = await httpClient.get<{ responses: Array<{
        id: string;
        invitationId: string;
        projectId: string;
        answers: Record<string, any>;
        audioUrl: string | null;
        transcript: string | null;
        createdAt: string;
        updatedAt: string;
      }> }>(responsesUrl);
      
      console.log('Responses data received:', responsesData);
      
      if (responsesData && responsesData.responses) {
        responses.value = responsesData.responses;
        console.log('Loaded responses count:', responses.value.length);
      } else {
        console.warn('No responses in data:', responsesData);
        responses.value = [];
      }
    } catch (err) {
      console.error('Failed to load responses:', err);
      responses.value = [];
    }
    
    // Загружаем early signals (бэкенд анализирует комментарии через LLM и возвращает сигналы)
    try {
      const earlySignalsUrl = API_CONFIG.ENDPOINTS.EARLY_SIGNALS(projectId);
      const earlySignalsData = await httpClient.get<{ signals: Array<{
        id: string;
        type: 'positive' | 'negative' | 'neutral';
        title: string;
        description: string;
        timestamp: string;
      }> }>(earlySignalsUrl);

      if (earlySignalsData?.signals) {
        earlySignals.value = earlySignalsData.signals.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          description: s.description,
          timestamp: new Date(s.timestamp),
        }));
      } else {
        earlySignals.value = [];
      }
    } catch (err) {
      console.error('Failed to load early signals:', err);
      earlySignals.value = [];
    }

    // Expand first response by default
    if (responses.value.length > 0) {
      expandedResponses.value = new Set([responses.value[0].id]);
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
    invitations.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.project-progress-view {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
}

.breadcrumb-link:hover { color: #0f172a; }

.breadcrumb-sep { opacity: 0.5; }

.breadcrumb-current { color: #0f172a; font-weight: 600; }

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-primary {
  background: #0f172a;
  color: white;
}

.btn-primary:hover { background: #1e293b; }

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
}

.btn-secondary:hover { background: #e2e8f0; }

.btn-ghost {
  background: transparent;
  color: #64748b;
}

.btn-ghost:hover { color: #0f172a; background: #f8fafc; }

/* Loading / Error */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.error-text { color: #dc2626; font-weight: 500; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

/* Hero progress */
.hero-progress {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
}

.progress-visual {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-ring {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: conic-gradient(#22c55e calc(var(--p, 0) * 3.6deg), #e2e8f0 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: white;
}

.progress-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  position: relative;
  z-index: 1;
}

.hero-stats { flex: 1; min-width: 0; }

.hero-stat { margin-bottom: 0.25rem; }

.hero-stat-value { font-size: 1.25rem; font-weight: 700; color: #0f172a; }

.hero-stat-label { font-size: 0.875rem; color: #64748b; margin-left: 0.25rem; }

.hero-hint {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.5rem 0 0;
}

.hero-hint.success { color: #15803d; }

/* Two-column layout */
.two-col {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
}

/* Left column: operations */
.col-operations {
  position: sticky;
  top: 1rem;
}

.metrics-compact {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.875rem;
}

.metric-label { color: #64748b; }

.metric-value { font-weight: 600; color: #0f172a; }

.panel {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.panel + .panel { margin-top: 1rem; }

.panel-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.panel-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.75rem;
}

.panel-empty {
  font-size: 0.875rem;
  color: #94a3b8;
  padding: 0.5rem 0;
}

.invitation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.invitation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
}

.invitation-row:last-child { border-bottom: none; }

.inv-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
  color: #334155;
}

.inv-status {
  flex-shrink: 0;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 500;
}

.status-pending { background: #f1f5f9; color: #475569; }
.status-sent { background: #dbeafe; color: #1d4ed8; }
.status-responded,
.status-completed { background: #dcfce7; color: #15803d; }
.status-expired { background: #fee2e2; color: #dc2626; }

/* Right column: insights */
.col-insights { min-width: 0; }

.signals-panel,
.responses-panel {
  margin-bottom: 1.5rem;
}

.signals-grouped { display: flex; flex-direction: column; gap: 1rem; }

.signal-group-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
  color: #64748b;
}

.label-positive { color: #15803d; }
.label-negative { color: #dc2626; }
.label-neutral { color: #0369a1; }

.signal-group-items { display: flex; flex-direction: column; gap: 0.5rem; }

.signal-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.signal-card.signal-positive { background: #f0fdf4; border-left-color: #22c55e; }
.signal-card.signal-negative { background: #fef2f2; border-left-color: #ef4444; }
.signal-card.signal-neutral { background: #f0f9ff; border-left-color: #0ea5e9; }

.signal-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  background: rgba(255,255,255,0.8);
}

.signal-body { flex: 1; min-width: 0; }

.signal-title { font-size: 0.875rem; display: block; margin-bottom: 0.25rem; color: #0f172a; }

.signal-desc { font-size: 0.8125rem; color: #475569; margin: 0; line-height: 1.5; }

/* Responses accordion */
.panel-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.panel-count { font-size: 0.75rem; color: #94a3b8; }

.responses-accordion { display: flex; flex-direction: column; gap: 0.5rem; }

.response-block { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }

.response-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.response-trigger:hover { background: #f1f5f9; }

.response-num { font-weight: 600; color: #64748b; min-width: 2ch; }

.response-date { flex: 1; color: #334155; }

.badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  background: #e2e8f0;
  color: #475569;
}

.response-chevron {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 300;
}

.response-body {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.response-block:not(.is-expanded) .response-body { display: none; }

.response-answers {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.answer-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.25rem;
}

.answer-q {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.answer-a {
  font-size: 0.875rem;
  color: #0f172a;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.response-transcript {
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.transcript-label { font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; }

.transcript-text { font-size: 0.875rem; color: #334155; margin: 0; line-height: 1.6; white-space: pre-wrap; }

.response-audio {
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.audio-player { width: 100%; max-width: 100%; }

</style>

