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
      <!-- 1. RESPONSE RATE ACCELERATOR -->
      <section class="block accelerator-block" aria-labelledby="accelerator-heading">
        <h2 id="accelerator-heading" class="block-title">Response Rate Accelerator</h2>
        <div class="accelerator-row">
          <div class="accelerator-metrics">
            <div class="progress-visual progress-visual--inline">
              <div class="progress-ring" :style="{ '--p': responseRate }">
                <span class="progress-value">{{ responseRate }}%</span>
              </div>
            </div>
            <div class="accelerator-badges">
              <span class="badge-pill">Response rate: {{ responseRate }}%</span>
              <span class="badge-pill badge-pill--goal">Goal: {{ responseRateGoal }}%</span>
              <span class="badge-pill">Days left: {{ daysLeft }}</span>
            </div>
          </div>
          <div class="accelerator-need">
            <p class="accelerator-need-text">Need <strong>{{ needForSignificance }}</strong> more responses for statistical significance</p>
            <p v-if="responsesPerDay > 0" class="accelerator-tempo">Current pace: {{ responsesPerDay }} responses/day → on track</p>
          </div>
        </div>
        <div class="quick-wins">
          <h3 class="quick-wins-title">Quick actions to improve</h3>
          <ul class="quick-wins-list">
            <li class="quick-win" :class="{ done: quickWins.personalizeDone }">
              <span class="quick-win-check">{{ quickWins.personalizeDone ? '✓' : '○' }}</span>
              <router-link v-if="!quickWins.personalizeDone" :to="`/projects/${projectId}/invitations`">Personalize invitations (AI can rewrite)</router-link>
              <span v-else>Personalize invitations (AI can rewrite)</span>
            </li>
            <li class="quick-win" :class="{ done: quickWins.remindersDone }">
              <span class="quick-win-check">{{ quickWins.remindersDone ? '✓' : '○' }}</span>
              <span>Send reminders to {{ nonRespondedCount }} who haven’t responded</span>
              <router-link v-if="nonRespondedCount > 0" :to="`/projects/${projectId}/invitations`" class="quick-win-action">Send reminders</router-link>
            </li>
            <li class="quick-win" :class="{ done: quickWins.shareLinkDone }">
              <span class="quick-win-check">{{ quickWins.shareLinkDone ? '✓' : '○' }}</span>
              <span>Share public link (e.g. LinkedIn)</span>
              <router-link v-if="projectId" :to="`/projects/${projectId}`" class="quick-win-action">Get link</router-link>
            </li>
            <li class="quick-win" :class="{ done: quickWins.rewardDone }">
              <span class="quick-win-check">{{ quickWins.rewardDone ? '✓' : '○' }}</span>
              <span>Increase reward (e.g. +$5 → predicted +15% RR)</span>
            </li>
          </ul>
        </div>
        <div v-if="invitationStats.sent > 0 && responseRate < responseRateGoal" class="predicted-impact">
          <strong>Predicted impact:</strong> If you do the quick wins → ~{{ predictedRate }}% by tomorrow. Need {{ needForSignificance }} more responses for significance.
        </div>
      </section>

      <!-- 2. PROJECT HEALTH -->
      <section class="block health-block" aria-labelledby="health-heading">
        <h2 id="health-heading" class="block-title">Project Health</h2>
        <div class="health-cards">
          <div class="health-card">
            <span class="health-card-label">Data Quality</span>
            <span class="health-card-value">{{ qualityScore.toFixed(1) }}/10</span>
            <router-link :to="`/projects/${projectId}/responses`" class="health-card-action">Improve</router-link>
          </div>
          <div class="health-card">
            <span class="health-card-label">Segment Balance</span>
            <span class="health-card-value">{{ segmentBalanceLabel }}</span>
            <router-link :to="`/projects/${projectId}/invitations`" class="health-card-action">View</router-link>
          </div>
          <div class="health-card">
            <span class="health-card-label">Time Efficiency</span>
            <span class="health-card-value">{{ timeEfficiency }}%</span>
            <span class="health-card-action">On track</span>
          </div>
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
          <!-- 3. Early Signals with confidence -->
          <section class="panel signals-panel" aria-labelledby="signals-heading">
            <h3 id="signals-heading" class="panel-title">Early Signals with confidence</h3>
            <p class="panel-desc">AI insights from respondent feedback</p>
            <div v-if="earlySignals.length === 0" class="panel-empty">
              No signals yet. Responses with comments will be analyzed automatically.
            </div>
            <div v-else class="signals-by-confidence">
              <div v-if="signalsByConfidence.high.length" class="signal-confidence-group confidence-high">
                <h4 class="signal-confidence-label">🔴 High confidence (≥80%)</h4>
                <ul class="signal-confidence-list">
                  <li v-for="s in signalsByConfidence.high" :key="s.id" class="signal-card" :class="`signal-${s.type}`">
                    <span class="signal-icon">{{ getSignalIcon(s.type) }}</span>
                    <strong class="signal-title">{{ s.title }}</strong>
                    <span class="signal-meta">({{ responses.length }} responses)</span>
                    <p class="signal-desc">{{ s.description }}</p>
                  </li>
                </ul>
              </div>
              <div v-if="signalsByConfidence.medium.length" class="signal-confidence-group confidence-medium">
                <h4 class="signal-confidence-label">🟡 Medium confidence (50–80%)</h4>
                <ul class="signal-confidence-list">
                  <li v-for="s in signalsByConfidence.medium" :key="s.id" class="signal-card" :class="`signal-${s.type}`">
                    <span class="signal-icon">{{ getSignalIcon(s.type) }}</span>
                    <strong class="signal-title">{{ s.title }}</strong>
                    <p class="signal-desc">{{ s.description }}</p>
                  </li>
                </ul>
              </div>
              <div v-if="signalsByConfidence.needMore.length" class="signal-confidence-group confidence-need">
                <h4 class="signal-confidence-label">⚪ Need more data</h4>
                <ul class="signal-confidence-list">
                  <li v-for="s in signalsByConfidence.needMore" :key="s.id" class="signal-card signal-neutral">
                    <span class="signal-icon">ℹ</span>
                    <strong class="signal-title">{{ s.title }}</strong>
                    <p class="signal-desc">{{ s.description }}</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Responses (collapsible) -->
          <section class="panel responses-panel" aria-labelledby="responses-heading">
            <div class="panel-head">
              <h3 id="responses-heading" class="panel-title">Responses</h3>
              <span v-if="responses.length > 0" class="panel-count">{{ responses.length }} total</span>
              <div v-if="responses.length > 0" class="panel-actions">
                <router-link :to="`/projects/${projectId}/responses`" class="btn btn-secondary btn-sm">View Responses Table</router-link>
                <button type="button" class="btn btn-export btn-sm" :disabled="exportLoading" @click="exportResponses('json')">
                  {{ exportLoading ? 'Exporting…' : 'Export JSON' }}
                </button>
                <button type="button" class="btn btn-export btn-sm" :disabled="exportLoading" @click="exportResponses('csv')">
                  Export CSV
                </button>
              </div>
            </div>
            <p class="panel-desc">Individual answers by respondent. Open the Responses tab for filters, search, and full table.</p>
            <div v-if="responses.length > 0" class="latest-responses-preview">
              <h4 class="preview-title">Latest {{ Math.min(5, responses.length) }} responses</h4>
              <ul class="preview-list">
                <li v-for="(r, idx) in latestFiveResponses" :key="r.id" class="preview-item">
                  <span class="preview-num">#{{ idx + 1 }}</span>
                  <span class="preview-snippet">{{ responsePreviewSnippet(r) }}</span>
                </li>
              </ul>
            </div>
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

          <!-- 4. Response Moderation & Quality -->
          <section class="panel quality-panel" aria-labelledby="quality-heading">
            <h3 id="quality-heading" class="panel-title">Response Quality Dashboard</h3>
            <div class="quality-score-row">
              <span class="quality-score-label">Quality score</span>
              <span class="quality-score-value">{{ qualityScore.toFixed(1) }}/10</span>
            </div>
            <div v-if="qualityIssues.length > 0" class="quality-issues">
              <p class="quality-issues-title">Issues detected:</p>
              <ul class="quality-issues-list">
                <li v-for="(issue, i) in qualityIssues" :key="i" class="quality-issue" :class="issue.severity">
                  {{ issue.icon }} {{ issue.text }}
                </li>
              </ul>
            </div>
            <p v-else-if="responses.length > 0" class="quality-ok">✅ {{ responses.length }} responses meet quality bar.</p>
            <div class="quality-actions">
              <router-link :to="`/projects/${projectId}/responses`" class="btn btn-secondary btn-sm">Check low-quality responses</router-link>
              <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-ghost btn-sm">Request clarifications</router-link>
            </div>
          </section>

          <section class="panel moderation-panel" aria-labelledby="moderation-heading">
            <div class="panel-head">
              <h3 id="moderation-heading" class="panel-title">Moderation</h3>
              <span class="panel-count">{{ responses.length }} responses · {{ moderationPendingCount }} pending · {{ qualityLowCount }} low quality</span>
              <div class="panel-actions">
                <select v-model="moderationFilter" class="moderation-filter" @change="loadModerationResponses">
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select v-model="qualityFilter" class="moderation-filter">
                  <option value="">All quality</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="moderationLoading" @click="loadModerationResponses">
                  {{ moderationLoading ? 'Loading…' : 'Refresh' }}
                </button>
              </div>
            </div>
            <p class="panel-desc">Approve or reject responses from the public link. Filter by quality to review problematic answers.</p>
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
        </main>
      </div>

      <!-- 5. Real-time Insights Feed -->
      <section class="block insights-feed-block" aria-labelledby="insights-feed-heading">
        <h2 id="insights-feed-heading" class="block-title">Real-time insights feed</h2>
        <ul class="insights-feed-list">
          <li v-for="(item, i) in insightsFeed" :key="i" class="insight-item" :class="item.type">
            <span class="insight-time">{{ item.timeAgo }}</span>
            <span class="insight-text">{{ item.text }}</span>
          </li>
        </ul>
        <p v-if="insightsFeed.length === 0" class="insights-feed-empty">No recent events. New responses and trends will appear here.</p>
      </section>

      <!-- 6. What's Next -->
      <section class="block whats-next-block" aria-labelledby="whats-next-heading">
        <h2 id="whats-next-heading" class="block-title">What's next</h2>
        <ol class="whats-next-list">
          <li v-for="(rec, i) in whatsNextRecommendations" :key="i" class="whats-next-item">
            <span class="whats-next-num">{{ i + 1 }}</span>
            <span class="whats-next-text">{{ rec }}</span>
          </li>
        </ol>
        <p v-if="whatsNextRecommendations.length === 0" class="whats-next-empty">Collect more responses to get AI recommendations.</p>
      </section>

      <!-- Consent & deletion (existing) -->
      <div class="progress-footer">
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
import PageHeader from '../../../../shared/components/PageHeader.vue';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner.vue';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog.vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../infrastructure/bootstrap/types';
import type { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import type { ProjectRepositoryPort } from '../../application/ports/project-repository.port';
import { ProjectPresenter } from '../presenters/project.presenter';
import { InvitationStatus } from '../../../invitations/domain/entities/invitation.entity';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { CONSENT_TEMPLATES, CONSENT_TEMPLATE_OPTIONS } from '../constants/consent-templates';
import type { ConsentTemplateId } from '../constants/consent-templates';

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
  answers: Record<string, unknown>;
  audioUrl: string | null;
  transcript: string | null;
  createdAt: string;
  updatedAt: string;
}>>([]);

type ModerationResponseItem = {
  id: string;
  invitationId: string;
  projectId: string;
  answers: Record<string, unknown>;
  audioUrl: string | null;
  transcript: string | null;
  moderationStatus: 'pending' | 'approved' | 'rejected' | null;
  createdAt: string;
  updatedAt: string;
};
const moderationResponses = ref<ModerationResponseItem[]>([]);
const moderationLoading = ref(false);
const moderationFilter = ref('pending');
const qualityFilter = ref('');
const moderatingId = ref<string | null>(null);

const responseRateGoal = 50;
const SIGNIFICANCE_TARGET = 20;
const DEFAULT_DAYS_LEFT = 7;

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

const daysLeft = computed(() => DEFAULT_DAYS_LEFT);
const nonRespondedCount = computed(() => Math.max(0, invitationStats.value.sent - invitationStats.value.responded));
const needForSignificance = computed(() => Math.max(0, SIGNIFICANCE_TARGET - invitationStats.value.responded));
const responsesPerDay = computed(() => {
  if (responses.value.length < 2) return responses.value.length;
  const sorted = [...responses.value].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const first = new Date(sorted[0].createdAt).getTime();
  const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
  const days = (last - first) / (24 * 60 * 60 * 1000) || 1;
  return Math.round((responses.value.length / days) * 10) / 10;
});
const quickWins = computed(() => ({
  personalizeDone: invitationStats.value.sent > 0 && responseRate.value >= 30,
  remindersDone: nonRespondedCount.value === 0,
  shareLinkDone: responseRate.value >= 50,
  rewardDone: false,
}));
const predictedRate = computed(() => Math.min(responseRate.value + 17, 95));

function responseWordCount(r: typeof responses.value[0]): number {
  let words = 0;
  Object.values(r.answers || {}).forEach((v) => {
    const s = typeof v === 'string' ? v : typeof v === 'object' && v && 'text' in v ? String((v as { text: string }).text) : JSON.stringify(v);
    words += s.trim().split(/\s+/).filter(Boolean).length;
  });
  if (r.transcript) words += r.transcript.trim().split(/\s+/).filter(Boolean).length;
  return words;
}

const qualityScore = computed(() => {
  if (responses.value.length === 0) return 0;
  const scores = responses.value.map((r) => {
    const w = responseWordCount(r);
    if (w < 10) return 4;
    if (w < 30) return 6;
    if (w < 80) return 8;
    return 9;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
});

const qualityIssues = computed(() => {
  const issues: Array<{ text: string; severity: string; icon: string }> = [];
  const short = responses.value.filter((r) => responseWordCount(r) < 10);
  if (short.length > 0) {
    issues.push({ text: `${short.length} response(s) too short (<10 words)`, severity: 'warn', icon: '⚠' });
  }
  const highQuality = responses.value.filter((r) => responseWordCount(r) >= 30).length;
  if (highQuality > 0 && responses.value.length > 0) {
    issues.push({ text: `${highQuality} high-quality response(s)`, severity: 'ok', icon: '✅' });
  }
  return issues;
});

const qualityLowCount = computed(() => responses.value.filter((r) => responseWordCount(r) < 10).length);
const moderationPendingCount = computed(() => moderationResponses.value.filter((r) => r.moderationStatus === 'pending').length);
const segmentBalanceLabel = computed(() => (invitationStats.value.total >= 5 ? 'Good' : 'Need more'));
const timeEfficiency = computed(() => (responseRate.value >= 50 ? 85 : responseRate.value >= 25 ? 65 : 45));

const signalsByConfidence = computed(() => {
  const n = responses.value.length;
  const high: typeof earlySignals.value = [];
  const medium: typeof earlySignals.value = [];
  const needMore: typeof earlySignals.value = [];
  earlySignals.value.forEach((s) => {
    if (n >= 15 && (s.type === 'positive' || s.type === 'negative')) high.push(s);
    else if (n >= 5) medium.push(s);
    else needMore.push(s);
  });
  return { high, medium, needMore };
});

const insightsFeed = computed(() => {
  const items: Array<{ timeAgo: string; text: string; type: string }> = [];
  if (responses.value.length > 0) {
    const last = responses.value[0];
    const created = new Date(last.createdAt);
    const minAgo = Math.floor((Date.now() - created.getTime()) / 60000);
    const timeAgo = minAgo < 60 ? `${minAgo} min ago` : `${Math.floor(minAgo / 60)} hour(s) ago`;
    items.push({ timeAgo, text: `New response received`, type: 'response' });
  }
  if (responseRate.value > 0 && responseRate.value < 50) {
    items.push({ timeAgo: '—', text: `Response rate ${responseRate.value}%. Send reminders to improve.`, type: 'tip' });
  }
  if (qualityLowCount.value > 0) {
    items.push({ timeAgo: '—', text: `Quality alert: ${qualityLowCount.value} response(s) under 10 words.`, type: 'alert' });
  }
  return items.slice(0, 5);
});

const whatsNextRecommendations = computed(() => {
  const recs: string[] = [];
  if (needForSignificance.value > 0) {
    recs.push(`Collect ${needForSignificance.value} more responses for statistical significance`);
  }
  if (responseRate.value < responseRateGoal && nonRespondedCount.value > 0) {
    recs.push(`Send reminders to ${nonRespondedCount.value} non-respondents`);
  }
  if (responses.value.length >= 10 && earlySignals.value.length > 0) {
    recs.push('Generate interim report for the team');
  }
  if (responses.value.length >= 5) {
    recs.push('Review early signals and update hypothesis if needed');
  }
  return recs.slice(0, 4);
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

const latestFiveResponses = computed(() => responses.value.slice(0, 5));

function responsePreviewSnippet(r: typeof responses.value[0]): string {
  const keys = Object.keys(r.answers || {});
  if (keys.length === 0) return r.transcript ? r.transcript.slice(0, 60) + '…' : '—';
  const first = r.answers[keys[0]];
  const str = typeof first === 'object' ? JSON.stringify(first) : String(first);
  return str.length > 60 ? str.slice(0, 60) + '…' : str;
}

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
        answers: Record<string, unknown>;
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
/* --- Modern Progress: layout & vars --- */
.project-progress-view {
  --progress-bg: #f8fafc;
  --progress-card: #ffffff;
  --progress-border: #e2e8f0;
  --progress-text: #0f172a;
  --progress-muted: #64748b;
  --progress-accent: var(--color-accent, #0d9488);
  --progress-accent-soft: rgba(13, 148, 136, 0.08);
  --progress-radius: 16px;
  --progress-radius-sm: 12px;
  --progress-shadow: 0 1px 3px rgba(0,0,0,0.06);
  --progress-shadow-lg: 0 4px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
}

/* --- Buttons --- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 10px;
  text-decoration: none;
  transition: transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.btn:active { transform: scale(0.98); }

.btn-primary {
  background: var(--progress-accent);
  color: white;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.35);
}
.btn-primary:hover {
  background: var(--color-accent-hover, #0f766e);
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
}

.btn-secondary {
  background: var(--progress-card);
  color: var(--progress-text);
  border: 1px solid var(--progress-border);
}
.btn-secondary:hover {
  background: var(--progress-bg);
  border-color: #cbd5e1;
}

.btn-ghost {
  background: transparent;
  color: var(--progress-muted);
}
.btn-ghost:hover { color: var(--progress-accent); background: var(--progress-accent-soft); }

/* --- Loading / Error --- */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--progress-muted);
}
.error-text { color: #dc2626; font-weight: 500; }

/* --- Blocks: section titles --- */
.block {
  margin-bottom: 2rem;
}
.block-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 1rem;
  color: var(--progress-text);
}

/* --- 1. Response Rate Accelerator (hero card) --- */
.accelerator-block {
  padding: 1.75rem 2rem;
  background: var(--progress-card);
  border-radius: var(--progress-radius);
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow-lg);
  position: relative;
  overflow: hidden;
}
.accelerator-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--progress-accent), #2dd4bf);
  opacity: 0.9;
}
.accelerator-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.accelerator-metrics {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.progress-visual--inline .progress-ring {
  width: 80px;
  height: 80px;
}
.progress-visual--inline .progress-value { font-size: 1.125rem; font-weight: 800; }
.accelerator-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.badge-pill {
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  background: var(--progress-bg);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--progress-text);
  border: 1px solid var(--progress-border);
}
.badge-pill--goal {
  background: var(--progress-accent-soft);
  color: var(--progress-accent);
  border-color: rgba(13, 148, 136, 0.25);
}
.accelerator-need-text { margin: 0 0 0.25rem; font-size: 0.9375rem; font-weight: 500; color: var(--progress-text); }
.accelerator-tempo { margin: 0; font-size: 0.8125rem; color: var(--progress-muted); }
.quick-wins-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--progress-muted);
  margin: 0 0 0.75rem;
}
.quick-wins-list { list-style: none; padding: 0; margin: 0; }
.quick-win {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  border-radius: var(--progress-radius-sm);
  transition: background 0.15s ease;
}
.quick-win:hover { background: var(--progress-bg); }
.quick-win.done { color: var(--progress-muted); }
.quick-win-check {
  font-weight: 700;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  background: var(--progress-border);
  color: var(--progress-card);
}
.quick-win.done .quick-win-check {
  background: var(--progress-accent);
  color: white;
}
.quick-win-action { margin-left: auto; font-size: 0.8125rem; font-weight: 500; }
.predicted-impact {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--progress-border);
  font-size: 0.875rem;
  color: var(--progress-muted);
}

/* --- 2. Project Health cards --- */
.health-block { padding: 0; }
.health-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.health-card {
  padding: 1.25rem;
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.health-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border-color: #cbd5e1;
}
.health-card-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--progress-muted);
}
.health-card-value { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--progress-text); }
.health-card-action {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--progress-accent);
  text-decoration: none;
  margin-top: 0.25rem;
}
.health-card-action:hover { text-decoration: underline; }

/* --- Quality panel --- */
.quality-panel {
  margin-top: 1rem;
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
}
.quality-score-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.quality-score-label { font-weight: 600; font-size: 0.875rem; color: var(--progress-text); }
.quality-score-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--progress-accent);
  letter-spacing: -0.02em;
}
.quality-issues-title { font-size: 0.8125rem; font-weight: 600; margin: 0 0 0.35rem; color: var(--progress-text); }
.quality-issues-list { list-style: none; padding: 0; margin: 0 0 0.75rem; }
.quality-issue { font-size: 0.875rem; padding: 0.25rem 0; }
.quality-issue.warn { color: #b45309; }
.quality-issue.ok { color: #059669; }
.quality-ok { margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--progress-muted); }
.quality-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* --- Signals by confidence --- */
.signals-by-confidence { display: flex; flex-direction: column; gap: 1.25rem; }
.signal-confidence-group { margin: 0; }
.signal-confidence-label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 0.5rem;
  color: var(--progress-text);
}
.signal-confidence-list { list-style: none; padding: 0; margin: 0; }
.signal-confidence-list .signal-card {
  display: block;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--progress-radius-sm);
  background: var(--progress-bg);
  border: 1px solid var(--progress-border);
}
.signal-meta { font-size: 0.75rem; color: var(--progress-muted); margin-left: 0.35rem; }

/* --- Insights feed & What's next --- */
.insights-feed-block {
  padding: 1.25rem 1.5rem;
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
}
.insights-feed-list { list-style: none; padding: 0; margin: 0; }
.insight-item {
  display: flex;
  gap: 1rem;
  padding: 0.6rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--progress-border);
  align-items: flex-start;
}
.insight-item:last-child { border-bottom: none; }
.insight-time {
  flex-shrink: 0;
  color: var(--progress-muted);
  font-size: 0.75rem;
  font-weight: 500;
}
.insight-item.alert .insight-text { color: #b45309; font-weight: 500; }
.insights-feed-empty { margin: 0; font-size: 0.875rem; color: var(--progress-muted); }

.whats-next-block {
  padding: 1.25rem 1.5rem;
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
}
.whats-next-list { list-style: none; padding: 0; margin: 0; }
.whats-next-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--progress-text);
}
.whats-next-num {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 8px;
  background: var(--progress-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.whats-next-empty { margin: 0; font-size: 0.875rem; color: var(--progress-muted); }

.progress-footer { margin-top: 2.5rem; }

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

/* Progress ring (modern) */
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
  background: conic-gradient(
    var(--progress-accent) calc(var(--p, 0) * 3.6deg),
    var(--progress-border) 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 5px var(--progress-card), 0 4px 14px rgba(13, 148, 136, 0.15);
}

.progress-ring::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: var(--progress-card);
}

.progress-value {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--progress-accent);
  position: relative;
  z-index: 1;
}

.hero-stats { flex: 1; min-width: 0; }
.hero-stat { margin-bottom: 0.25rem; }
.hero-stat-value { font-size: 1.5rem; font-weight: 700; color: var(--progress-accent); }
.hero-stat-label { font-size: 0.9375rem; color: var(--progress-muted); margin-left: 0.25rem; }
.hero-hint { font-size: 0.9375rem; color: var(--progress-muted); margin: 0.5rem 0 0; }
.hero-hint.success { color: #059669; font-weight: 500; }

/* Two-column layout */
.two-col {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
  .health-cards { grid-template-columns: 1fr; }
}

.col-operations { position: sticky; top: 1rem; }

/* Metrics card (sidebar) */
.metrics-compact {
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.metric-label { color: var(--progress-muted); font-weight: 500; }
.metric-value { font-weight: 700; color: var(--progress-text); letter-spacing: -0.02em; }

/* Panels (cards) */
.panel {
  background: var(--progress-card);
  border-radius: var(--progress-radius-sm);
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--progress-border);
  box-shadow: var(--progress-shadow);
}

.panel + .panel { margin-top: 1rem; }

.panel-title {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--progress-text);
  margin: 0 0 0.25rem;
}

.panel-desc {
  font-size: 0.8125rem;
  color: var(--progress-muted);
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

.consent-form .form-row { margin-bottom: 1rem; }
.consent-form .form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--progress-text);
  margin-bottom: 0.35rem;
}
.consent-form .form-select,
.consent-form .form-input {
  width: 100%;
  max-width: 28rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--progress-border);
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.consent-form .form-select:focus,
.consent-form .form-input:focus {
  outline: none;
  border-color: var(--progress-accent);
  box-shadow: 0 0 0 3px var(--progress-accent-soft);
}
.consent-form .form-textarea {
  width: 100%;
  max-width: 36rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--progress-border);
  border-radius: 10px;
  resize: vertical;
  transition: border-color 0.2s ease;
}
.consent-form .form-textarea:focus {
  outline: none;
  border-color: var(--progress-accent);
}
.consent-form .form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.consent-form .consent-save-message { font-size: 0.875rem; }
.consent-form .consent-save-message.success { color: #059669; font-weight: 500; }
.consent-form .consent-save-message.error { color: #dc2626; }

.panel-empty {
  font-size: 0.875rem;
  color: var(--progress-muted);
  padding: 0.75rem 0;
}

.invitation-list { list-style: none; padding: 0; margin: 0; }

.invitation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--progress-border);
  font-size: 0.8125rem;
}

.invitation-row:last-child { border-bottom: none; }

.inv-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
  color: var(--progress-text);
}

.inv-status {
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.status-pending { background: #f1f5f9; color: #475569; }
.status-sent { background: #dbeafe; color: #1d4ed8; }
.status-responded,
.status-completed { background: #dcfce7; color: #15803d; }
.status-expired { background: #fee2e2; color: #dc2626; }

.btn-danger { color: #dc2626; }
.btn-danger:hover { background: #fef2f2; color: #b91c1c; }

.deletion-requests-panel { margin-bottom: 1.5rem; }
.deletion-requests-table-wrap { overflow-x: auto; border-radius: var(--progress-radius-sm); border: 1px solid var(--progress-border); }
.deletion-requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.deletion-requests-table th,
.deletion-requests-table td {
  padding: 0.65rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--progress-border);
}
.deletion-requests-table th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--progress-muted);
  background: var(--progress-bg);
}
.deletion-status {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.deletion-done { color: var(--progress-muted); }

/* Moderation */
.moderation-panel { margin-bottom: 1.5rem; }
.moderation-filter {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
  border: 1px solid var(--progress-border);
  border-radius: 8px;
  background: var(--progress-card);
  color: var(--progress-text);
}
.moderation-table-wrap {
  overflow-x: auto;
  border-radius: var(--progress-radius-sm);
  border: 1px solid var(--progress-border);
}
.moderation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.moderation-table th,
.moderation-table td {
  padding: 0.65rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--progress-border);
}
.moderation-table th {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--progress-muted);
  background: var(--progress-bg);
}
.moderation-summary { max-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.moderation-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.moderation-pending { background: #fef3c7; color: #b45309; }
.moderation-approved { background: #dcfce7; color: #15803d; }
.moderation-rejected { background: #fee2e2; color: #dc2626; }
.moderation-none { background: var(--progress-bg); color: var(--progress-muted); }
.moderation-done { font-size: 0.75rem; color: var(--progress-muted); }
.btn-approve {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #dcfce7;
  color: #15803d;
  border: none;
  cursor: pointer;
}
.btn-approve:hover:not(:disabled) { background: #bbf7d0; }
.btn-reject {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  cursor: pointer;
  margin-left: 0.35rem;
}
.btn-reject:hover:not(:disabled) { background: #fecaca; }

.col-insights { min-width: 0; }

.signals-panel,
.responses-panel { margin-bottom: 1.5rem; }

.latest-responses-preview {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--progress-bg);
  border-radius: 10px;
  border: 1px solid var(--progress-border);
}
.preview-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--progress-muted);
  margin: 0 0 0.5rem 0;
}
.preview-list { list-style: none; padding: 0; margin: 0; }
.preview-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem 0;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--progress-border);
}
.preview-item:last-child { border-bottom: none; }
.preview-num { flex-shrink: 0; color: var(--progress-muted); font-weight: 500; }
.preview-snippet { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--progress-text); }

.signals-grouped { display: flex; flex-direction: column; gap: 1rem; }

.signal-group-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
  color: var(--progress-muted);
}

.label-positive { color: #15803d; }
.label-negative { color: #dc2626; }
.label-neutral { color: #0369a1; }

.signal-group-items { display: flex; flex-direction: column; gap: 0.5rem; }

.signal-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--progress-border);
  background: var(--progress-card);
  box-shadow: var(--progress-shadow);
}

.signal-card.signal-positive { background: #f0fdf4; border-left: 4px solid #22c55e; }
.signal-card.signal-negative { background: #fef2f2; border-left: 4px solid #ef4444; }
.signal-card.signal-neutral { background: #f0f9ff; border-left: 4px solid #0ea5e9; }

.signal-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  background: rgba(255,255,255,0.9);
}

.signal-body { flex: 1; min-width: 0; }

.signal-title { font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.25rem; color: var(--progress-text); }

.signal-desc { font-size: 0.8125rem; color: var(--progress-muted); margin: 0; line-height: 1.5; }

.panel-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.panel-count { font-size: 0.75rem; font-weight: 500; color: var(--progress-muted); }
.panel-actions { margin-left: auto; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.btn-sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 8px;
}
.btn-export {
  background: var(--progress-bg);
  border: 1px solid var(--progress-border);
  color: var(--progress-text);
  cursor: pointer;
  border-radius: 8px;
}
.btn-export:hover:not(:disabled) {
  background: var(--progress-border);
}

.responses-accordion { display: flex; flex-direction: column; gap: 0.5rem; }

.response-block {
  border: 1px solid var(--progress-border);
  border-radius: var(--progress-radius-sm);
  overflow: hidden;
  box-shadow: var(--progress-shadow);
  transition: box-shadow 0.2s ease;
}
.response-block:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }

.response-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--progress-card);
  border: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.response-trigger:hover { background: var(--progress-bg); }

.response-num { font-weight: 600; color: var(--progress-muted); min-width: 2ch; }

.response-date { flex: 1; color: var(--progress-text); font-weight: 500; }

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--progress-bg);
  color: var(--progress-muted);
  border: 1px solid var(--progress-border);
}

.response-chevron {
  font-size: 1rem;
  color: var(--progress-muted);
  font-weight: 400;
}

.response-body {
  padding: 1.25rem;
  background: var(--progress-bg);
  border-top: 1px solid var(--progress-border);
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
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--progress-muted);
  margin: 0;
}

.answer-a {
  font-size: 0.875rem;
  color: var(--progress-text);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.response-transcript {
  padding-top: 1rem;
  border-top: 1px solid var(--progress-border);
}

.transcript-label { font-size: 0.75rem; font-weight: 600; color: var(--progress-muted); display: block; margin-bottom: 0.35rem; }

.transcript-text { font-size: 0.875rem; color: var(--progress-text); margin: 0; line-height: 1.6; white-space: pre-wrap; }

.response-audio {
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--progress-border);
}

.audio-player { width: 100%; max-width: 100%; border-radius: 8px; }

</style>

