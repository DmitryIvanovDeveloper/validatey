<template>
  <div class="project-progress-view">
    <PageHeader
      title="Project Progress"
      subtitle="Response metrics and early signals"
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: `/projects/${projectId}` },
        { label: 'Progress' }
      ]"
    >
      <template #actions>
        <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">Manage Invitations</router-link>
        <router-link :to="`/projects/${projectId}/report`" class="btn btn-primary">View Report</router-link>
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back</router-link>
      </template>
    </PageHeader>

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
              <div v-if="responses.length > 0" class="panel-actions">
                <button type="button" class="btn btn-ghost btn-sm" :disabled="exportLoading" @click="exportResponses('json')">
                  {{ exportLoading ? 'Exporting…' : 'Export JSON' }}
                </button>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="exportLoading" @click="exportResponses('csv')">
                  Export CSV
                </button>
              </div>
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

          <!-- Moderation (public-link responses) -->
          <section class="panel moderation-panel" aria-labelledby="moderation-heading">
            <div class="panel-head">
              <h3 id="moderation-heading" class="panel-title">Moderation</h3>
              <span v-if="moderationResponses.length > 0" class="panel-count">{{ moderationResponses.length }} to review</span>
              <div class="panel-actions">
                <select v-model="moderationFilter" class="moderation-filter" @change="loadModerationResponses">
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="moderationLoading" @click="loadModerationResponses">
                  {{ moderationLoading ? 'Loading…' : 'Refresh' }}
                </button>
              </div>
            </div>
            <p class="panel-desc">Approve or reject responses from the public link.</p>
            <div v-if="moderationLoading" class="panel-empty">Loading…</div>
            <div v-else-if="moderationResponses.length === 0" class="panel-empty">
              No responses to moderate for this filter.
            </div>
            <div v-else class="moderation-table-wrap">
              <table class="moderation-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Summary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in moderationResponses" :key="r.id">
                    <td>{{ formatDate(new Date(r.createdAt)) }}</td>
                    <td class="moderation-summary">{{ responseSummary(r) }}</td>
                    <td>
                      <span :class="['moderation-badge', `moderation-${r.moderationStatus ?? 'none'}`]">
                        {{ r.moderationStatus ?? '—' }}
                      </span>
                    </td>
                    <td>
                      <template v-if="r.moderationStatus === 'pending'">
                        <button
                          type="button"
                          class="btn btn-sm btn-approve"
                          :disabled="moderatingId === r.id"
                          @click="setModerationStatus(r.id, 'approved')"
                        >
                          {{ moderatingId === r.id ? '…' : 'Approve' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-reject"
                          :disabled="moderatingId === r.id"
                          @click="setModerationStatus(r.id, 'rejected')"
                        >
                          Reject
                        </button>
                      </template>
                      <span v-else class="moderation-done">Done</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Survey consent: template + custom text + links -->
          <section class="panel consent-config-panel" aria-labelledby="consent-config-heading">
            <h3 id="consent-config-heading" class="panel-title">Survey consent</h3>
            <p class="panel-desc">Text and links shown to respondents before the survey. Leave empty to skip the consent screen.</p>
            <div class="consent-form">
              <div class="form-row">
                <label for="consent-template" class="form-label">Template</label>
                <select id="consent-template" v-model="consentTemplateId" class="form-select" @change="onConsentTemplateChange">
                  <option v-for="opt in CONSENT_TEMPLATE_OPTIONS" :key="opt.value || 'none'" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div class="form-row">
                <label for="consent-text" class="form-label">Consent text</label>
                <textarea id="consent-text" v-model="consentText" class="form-textarea" rows="4" placeholder="Optional. If set, respondents must accept before starting the survey."></textarea>
              </div>
              <div class="form-row">
                <label for="data-usage-text" class="form-label">How we use your data (optional)</label>
                <textarea id="data-usage-text" v-model="dataUsageText" class="form-textarea" rows="2" placeholder="Optional description of data usage."></textarea>
              </div>
              <div class="form-row">
                <label for="privacy-policy-url" class="form-label">Privacy Policy URL</label>
                <input id="privacy-policy-url" v-model="privacyPolicyUrl" type="url" class="form-input" placeholder="https://..." />
              </div>
              <div class="form-row">
                <label for="terms-url" class="form-label">Terms of Service URL</label>
                <input id="terms-url" v-model="termsOfServiceUrl" type="url" class="form-input" placeholder="https://..." />
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-primary btn-sm" :disabled="consentSaveLoading" @click="saveConsent">
                  {{ consentSaveLoading ? 'Saving…' : 'Save' }}
                </button>
                <span v-if="consentSaveMessage" class="consent-save-message" :class="consentSaveSuccess ? 'success' : 'error'">{{ consentSaveMessage }}</span>
              </div>
            </div>
          </section>

          <!-- Compliance: Export consents -->
          <section class="panel compliance-panel" aria-labelledby="compliance-heading">
            <h3 id="compliance-heading" class="panel-title">Compliance</h3>
            <p class="panel-desc">Export consent records for audit</p>
            <div class="panel-actions">
              <button type="button" class="btn btn-ghost btn-sm" :disabled="consentExportLoading" @click="exportConsents('json')">
                {{ consentExportLoading ? 'Exporting…' : 'Export consents (JSON)' }}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" :disabled="consentExportLoading" @click="exportConsents('csv')">
                Export consents (CSV)
              </button>
            </div>
          </section>

          <!-- Deletion requests -->
          <section class="panel deletion-requests-panel" aria-labelledby="deletion-requests-heading">
            <h3 id="deletion-requests-heading" class="panel-title">Deletion requests</h3>
            <p class="panel-desc">Data deletion / anonymization requests from respondents</p>
            <div v-if="deletionRequests.length === 0" class="panel-empty">
              No deletion requests.
            </div>
            <div v-else class="deletion-requests-table-wrap">
              <table class="deletion-requests-table" role="table">
                <thead>
                  <tr>
                    <th scope="col">Identifier</th>
                    <th scope="col">Status</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="req in deletionRequests" :key="req.id">
                    <td>{{ req.identifier }}</td>
                    <td><span :class="['deletion-status', `status-${req.status}`]">{{ req.status }}</span></td>
                    <td>{{ formatDate(req.requestedAt) }}</td>
                    <td>
                      <button
                        v-if="req.status === 'pending'"
                        type="button"
                        class="btn btn-ghost btn-sm btn-danger"
                        :disabled="executingRequestId === req.id"
                        @click="confirmExecuteDeletion(req)"
                      >
                        {{ executingRequestId === req.id ? 'Executing…' : 'Execute' }}
                      </button>
                      <span v-else class="deletion-done">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeletionConfirm"
      title="Execute deletion request?"
      message="Remove or anonymize data for this request? This action cannot be undone."
      confirm-label="Execute"
      cancel-label="Cancel"
      variant="danger"
      @confirm="onConfirmExecuteDeletion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES as INVITATION_TYPES } from '@/modules/invitations/infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '@/modules/projects/infrastructure/bootstrap/types';
import type { InvitationRepositoryPort } from '@/modules/invitations/application/ports/invitation-repository.port';
import type { ProjectRepositoryPort } from '@/modules/projects/application/ports/project-repository.port';
import { ProjectPresenter } from '@/modules/projects/interface-adapters/presenters/project.presenter';
import { InvitationStatus } from '@/modules/invitations/domain/entities/invitation.entity';
import { TYPES as ROOT_TYPES } from '@/infrastructure/bootstrap/types';
import type { HttpClientPort } from '@/infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '@/infrastructure/config/api.config';
import { CONSENT_TEMPLATES, CONSENT_TEMPLATE_OPTIONS } from '@/modules/projects/interface-adapters/constants/consent-templates';
import type { ConsentTemplateId } from '@/modules/projects/interface-adapters/constants/consent-templates';

const route = useRoute();
const projectId = route.params.projectId as string;

const projectRepository = container.get<ProjectRepositoryPort>(PROJECT_TYPES.ProjectRepository);
const projectPresenter = container.get<ProjectPresenter>(PROJECT_TYPES.ProjectPresenter);

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
const exportLoading = ref(false);
const consentExportLoading = ref(false);

const project = ref<{ consentText: string | null; dataUsageText: string | null; privacyPolicyUrl: string | null; termsOfServiceUrl: string | null } | null>(null);
const consentTemplateId = ref<'' | ConsentTemplateId>('');
const consentText = ref('');
const dataUsageText = ref('');
const privacyPolicyUrl = ref('');
const termsOfServiceUrl = ref('');
const consentSaveLoading = ref(false);
const consentSaveMessage = ref('');
const consentSaveSuccess = ref(false);

type DeletionRequestItem = {
  id: string;
  identifier: string;
  status: string;
  requestedAt: Date;
  completedAt: Date | null;
};
const deletionRequests = ref<DeletionRequestItem[]>([]);
const executingRequestId = ref<string | null>(null);
const showDeletionConfirm = ref(false);
const deletionRequestToExecute = ref<DeletionRequestItem | null>(null);

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

type ModerationResponseItem = {
  id: string;
  invitationId: string;
  projectId: string;
  answers: Record<string, any>;
  audioUrl: string | null;
  transcript: string | null;
  moderationStatus: 'pending' | 'approved' | 'rejected' | null;
  createdAt: string;
  updatedAt: string;
};
const moderationResponses = ref<ModerationResponseItem[]>([]);
const moderationLoading = ref(false);
const moderationFilter = ref('pending');
const moderatingId = ref<string | null>(null);

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

function responseSummary(r: ModerationResponseItem): string {
  const keys = Object.keys(r.answers || {});
  if (keys.length === 0) return r.transcript ? r.transcript.slice(0, 60) + '…' : '—';
  const first = r.answers[keys[0]];
  const str = typeof first === 'object' ? JSON.stringify(first) : String(first);
  return str.length > 60 ? str.slice(0, 60) + '…' : str;
}

async function loadModerationResponses() {
  if (!projectId) return;
  moderationLoading.value = true;
  try {
    const status = moderationFilter.value || undefined;
    const url = API_CONFIG.ENDPOINTS.RESPONSES_MODERATION(projectId, status);
    const data = await httpClient.get<{ responses: ModerationResponseItem[] }>(url);
    moderationResponses.value = (data?.responses ?? []).map((r) => ({
      ...r,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt as Date).toISOString?.(),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : (r.updatedAt as Date).toISOString?.(),
    }));
  } catch (err) {
    console.error('Load moderation failed:', err);
    moderationResponses.value = [];
  } finally {
    moderationLoading.value = false;
  }
}

async function setModerationStatus(responseId: string, status: 'approved' | 'rejected') {
  if (!projectId || moderatingId.value) return;
  moderatingId.value = responseId;
  try {
    const url = API_CONFIG.ENDPOINTS.RESPONSE_MODERATE(projectId, responseId);
    await httpClient.patch<{ response: ModerationResponseItem }>(url, { status });
    const idx = moderationResponses.value.findIndex((r) => r.id === responseId);
    if (idx >= 0) {
      const next = [...moderationResponses.value];
      next[idx] = { ...next[idx], moderationStatus: status };
      moderationResponses.value = next;
    }
  } catch (err) {
    console.error('Moderate failed:', err);
  } finally {
    moderatingId.value = null;
  }
}

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
  const alt = questionId.startsWith('q_') ? questionId.replace('q_', 'q') : `q_${questionId.replace(/^q/, '')}`;
  if (labels[alt]) return labels[alt];
  // Fallback: "Question 1" instead of "q_1" when no scenario labels loaded
  const match = questionId.match(/^q_?(\d+)$/i);
  if (match) return `Question ${match[1]}`;
  return questionId;
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

function syncConsentFormFromProject(p: { consentText?: string | null; dataUsageText?: string | null; privacyPolicyUrl?: string | null; termsOfServiceUrl?: string | null }) {
  consentText.value = p.consentText ?? '';
  dataUsageText.value = p.dataUsageText ?? '';
  privacyPolicyUrl.value = p.privacyPolicyUrl ?? '';
  termsOfServiceUrl.value = p.termsOfServiceUrl ?? '';
}

function onConsentTemplateChange() {
  const id = consentTemplateId.value;
  if (id && CONSENT_TEMPLATES[id]) {
    const t = CONSENT_TEMPLATES[id];
    consentText.value = t.consentText;
    if (t.dataUsageText) dataUsageText.value = t.dataUsageText;
  }
}

async function saveConsent() {
  if (consentSaveLoading.value) return;
  consentSaveMessage.value = '';
  try {
    consentSaveLoading.value = true;
    const result = await projectPresenter.updateProject(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      consentText.value.trim() || null,
      dataUsageText.value.trim() || null,
      privacyPolicyUrl.value.trim() || null,
      termsOfServiceUrl.value.trim() || null
    );
    if (result.ok) {
      consentSaveSuccess.value = true;
      consentSaveMessage.value = 'Saved.';
      if (project.value) {
        project.value = {
          ...project.value,
          consentText: consentText.value.trim() || null,
          dataUsageText: dataUsageText.value.trim() || null,
          privacyPolicyUrl: privacyPolicyUrl.value.trim() || null,
          termsOfServiceUrl: termsOfServiceUrl.value.trim() || null,
        };
      }
    } else {
      consentSaveSuccess.value = false;
      consentSaveMessage.value = result.error ?? 'Failed to save';
    }
  } catch (e) {
    consentSaveSuccess.value = false;
    consentSaveMessage.value = e instanceof Error ? e.message : 'Failed to save';
  } finally {
    consentSaveLoading.value = false;
  }
}

async function exportResponses(format: 'json' | 'csv') {
  if (exportLoading.value) return;
  try {
    exportLoading.value = true;
    const url = API_CONFIG.ENDPOINTS.RESPONSES_EXPORT(projectId, format);
    const blob = await httpClient.getBlob(url);
    const filename = `responses-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error('Export failed:', err);
    error.value = err instanceof Error ? err.message : 'Export failed';
  } finally {
    exportLoading.value = false;
  }
}

async function exportConsents(format: 'json' | 'csv') {
  if (consentExportLoading.value) return;
  try {
    consentExportLoading.value = true;
    const url = API_CONFIG.ENDPOINTS.CONSENTS_EXPORT(projectId, format);
    const blob = await httpClient.getBlob(url);
    const filename = `consents-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error('Export consents failed:', err);
    error.value = err instanceof Error ? err.message : 'Export consents failed';
  } finally {
    consentExportLoading.value = false;
  }
}

async function loadDeletionRequests() {
  try {
    const url = API_CONFIG.ENDPOINTS.DELETION_REQUESTS(projectId);
    const data = await httpClient.get<{ requests: Array<{
      id: string;
      identifier: string;
      status: string;
      requestedAt: string;
      completedAt: string | null;
    }> }>(url);
    const list = data?.requests ?? [];
    deletionRequests.value = list.map((r) => ({
      id: r.id,
      identifier: r.identifier,
      status: r.status,
      requestedAt: new Date(r.requestedAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : null,
    }));
  } catch {
    deletionRequests.value = [];
  }
}

function confirmExecuteDeletion(req: DeletionRequestItem) {
  deletionRequestToExecute.value = req;
  showDeletionConfirm.value = true;
}

function onConfirmExecuteDeletion() {
  const req = deletionRequestToExecute.value;
  deletionRequestToExecute.value = null;
  if (req) executeDeletionRequest(req.id);
}

async function executeDeletionRequest(requestId: string) {
  if (executingRequestId.value) return;
  try {
    executingRequestId.value = requestId;
    const url = API_CONFIG.ENDPOINTS.DELETION_REQUEST_EXECUTE(projectId, requestId);
    await httpClient.post<{ requestId: string; status: string; completedAt: string }>(url, {});
    const idx = deletionRequests.value.findIndex((r) => r.id === requestId);
    if (idx >= 0) {
      const next = [...deletionRequests.value];
      next[idx] = { ...next[idx], status: 'completed', completedAt: new Date() };
      deletionRequests.value = next;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to execute deletion request';
  } finally {
    executingRequestId.value = null;
  }
}

function parseQuestionsFromScenario(content: string): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!content?.trim()) return labels;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return labels;
  try {
    const parsed = JSON.parse(trimmed) as {
      questions?: Array<{ id?: string; text?: string; label?: string; question?: string }>;
    };
    if (parsed.questions && Array.isArray(parsed.questions)) {
      parsed.questions.forEach((q, i) => {
        const text =
          (typeof q.text === 'string' && q.text.trim()) ||
          (typeof q.label === 'string' && q.label.trim()) ||
          (typeof q.question === 'string' && q.question.trim()) ||
          '';
        if (!text) return;
        const id = (q.id && q.id.trim()) || `q_${i + 1}`;
        labels[id] = text;
        // Store under alternate keys so q_1 / q1 both resolve
        const normalized = id.startsWith('q_') ? id.replace('q_', 'q') : `q_${id.replace(/^q/, '')}`;
        if (normalized !== id) labels[normalized] = text;
        labels[`q_${i + 1}`] = text;
        if (i >= 0) labels[`q${i + 1}`] = text;
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

    const projectResult = await projectRepository.getById(projectId);
    if (projectResult.isSuccess) {
      const p = projectResult.data;
      project.value = {
        consentText: p.consentText ?? null,
        dataUsageText: p.dataUsageText ?? null,
        privacyPolicyUrl: p.privacyPolicyUrl ?? null,
        termsOfServiceUrl: p.termsOfServiceUrl ?? null,
      };
      syncConsentFormFromProject(p);
    } else {
      project.value = null;
    }
    
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

    // Load scenario to get question labels (q_1, q_2 -> question text)
    try {
      const scenarioUrl = API_CONFIG.ENDPOINTS.SCENARIOS(projectId);
      const scenarioData = await httpClient.get<{ scenario?: { content?: string }; data?: { scenario?: { content?: string } } }>(scenarioUrl);
      const content = scenarioData?.scenario?.content ?? scenarioData?.data?.scenario?.content ?? '';
      if (content) {
        questionLabels.value = parseQuestionsFromScenario(content);
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

    await loadDeletionRequests();
    await loadModerationResponses();

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
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover { background: var(--color-accent-hover); box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3); }

.btn-secondary {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.btn-secondary:hover { background: var(--color-border); color: var(--color-text); }

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover { color: var(--color-accent); background: var(--color-accent-light); }

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
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-accent-light) 0%, #e0f2fe 50%, #f0fdfa 100%);
  border-radius: var(--radius-xl);
  margin-bottom: 2rem;
  border: 1px solid rgba(13, 148, 136, 0.2);
  box-shadow: var(--shadow-md);
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
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: conic-gradient(var(--color-accent) calc(var(--p, 0) * 3.6deg), var(--color-border) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 4px white, 0 2px 8px rgba(13, 148, 136, 0.2);
}

.progress-ring::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: white;
}

.progress-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  position: relative;
  z-index: 1;
}

.hero-stats { flex: 1; min-width: 0; }

.hero-stat { margin-bottom: 0.25rem; }

.hero-stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-accent); }

.hero-stat-label { font-size: 0.9375rem; color: var(--color-text-muted); margin-left: 0.25rem; }

.hero-hint {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
}

.hero-hint.success { color: var(--color-success); font-weight: 500; }

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
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
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

.consent-form .form-row { margin-bottom: 0.75rem; }
.consent-form .form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.25rem;
}
.consent-form .form-select,
.consent-form .form-input {
  width: 100%;
  max-width: 28rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
}
.consent-form .form-textarea {
  width: 100%;
  max-width: 36rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  resize: vertical;
}
.consent-form .form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.consent-form .consent-save-message { font-size: 0.875rem; }
.consent-form .consent-save-message.success { color: var(--color-success, #059669); }
.consent-form .consent-save-message.error { color: #dc2626; }

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

.btn-danger { color: #dc2626; }
.btn-danger:hover { background: #fee2e2; color: #b91c1c; }

.deletion-requests-panel { margin-bottom: 1.5rem; }
.deletion-requests-table-wrap { overflow-x: auto; }
.deletion-requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.deletion-requests-table th,
.deletion-requests-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.deletion-requests-table th { font-weight: 600; color: #64748b; }
.deletion-status {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}
.deletion-done { color: #94a3b8; }

/* Moderation panel */
.moderation-panel { margin-bottom: 1.5rem; }
.moderation-filter {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
}
.moderation-table-wrap { overflow-x: auto; }
.moderation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.moderation-table th,
.moderation-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.moderation-table th { font-weight: 600; color: var(--color-text-muted, #64748b); }
.moderation-summary { max-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.moderation-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}
.moderation-pending { background: #fef3c7; color: #b45309; }
.moderation-approved { background: #dcfce7; color: #15803d; }
.moderation-rejected { background: #fee2e2; color: #dc2626; }
.moderation-none { background: #f1f5f9; color: #64748b; }
.moderation-done { font-size: 0.75rem; color: var(--color-text-muted); }
.btn-approve { background: #dcfce7; color: #15803d; }
.btn-approve:hover:not(:disabled) { background: #bbf7d0; }
.btn-reject { background: #fee2e2; color: #dc2626; margin-left: 0.25rem; }
.btn-reject:hover:not(:disabled) { background: #fecaca; }

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
.panel-actions { margin-left: auto; display: flex; gap: 0.5rem; }
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }

.responses-accordion { display: flex; flex-direction: column; gap: 0.5rem; }

.response-block { border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }

.response-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-bg-page);
  border: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.response-trigger:hover { background: var(--color-accent-light); }

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

