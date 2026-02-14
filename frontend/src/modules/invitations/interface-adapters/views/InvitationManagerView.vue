<template>
  <div class="invitation-manager-view">
    <PageHeader
      title="Invitations"
      subtitle="Send and track survey invitations by email or share a single link."
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: `/projects/${projectId}` },
        { label: 'Invitations' }
      ]"
    >
      <template #actions>
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">
          <span class="btn-icon" aria-hidden="true">←</span> Back
        </router-link>
        <button type="button" class="btn btn-primary btn-cta" @click="showInviteModal = true">
          <span class="btn-icon" aria-hidden="true">+</span> Send invitations
        </button>
      </template>
    </PageHeader>

    <div v-if="route.query.onboarding === '1'" class="onboarding-hint" role="status">
      <span class="onboarding-hint-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      </span>
      <span>Share your link to start collecting responses. Enable public access below or generate a personal link.</span>
    </div>

    <nav class="invitations-tabs" role="tablist">
      <button type="button" role="tab" :class="{ active: invitationsTab === 'public' }" @click="invitationsTab = 'public'">Public link</button>
      <button type="button" role="tab" :class="{ active: invitationsTab === 'personal' }" @click="invitationsTab = 'personal'">Personal invitations</button>
      <button type="button" role="tab" :class="{ active: invitationsTab === 'consent' }" @click="invitationsTab = 'consent'">Survey consent</button>
    </nav>

    <div v-show="invitationsTab === 'public'" class="invitations-tab-panel">
    <!-- Public link -->
    <Card class="section-card public-link-card">
      <template #header>
        <div class="section-card-header">
          <span class="section-icon section-icon-globe" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </span>
          <div>
            <h3 class="section-title">Public link</h3>
            <p class="section-subtitle">One link, many respondents. Limit and moderate responses.</p>
      </div>
        </div>
      </template>
      <div v-if="projectLoadError" class="msg msg-error" role="alert">{{ projectLoadError }}</div>
      <div v-else class="public-link-form">
        <label class="switch-row">
          <input
            v-model="publicAccessEnabled"
            type="checkbox"
            :disabled="publicSaving"
            class="switch-input"
          />
          <span class="switch-track"></span>
          <span class="switch-label">Enable public access</span>
        </label>
        <template v-if="publicAccessEnabled">
          <div v-if="publicSlug" class="input-group">
            <label class="label">Public survey URL</label>
            <div class="input-with-action">
              <input :value="publicSurveyFullUrl" readonly class="input input-readonly" aria-label="Public survey URL" />
              <button
                type="button"
                class="btn btn-primary btn-copy"
                :aria-label="publicCopyFeedback ? 'Copied' : 'Copy public link'"
                @click="copyPublicLink"
              >
                <span v-if="publicCopyFeedback" class="copy-check" aria-hidden="true">✓</span>
                {{ publicCopyFeedback ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
          <div class="input-group input-group-inline">
            <label class="label" for="max-public-responses">Max responses</label>
            <input
              id="max-public-responses"
              v-model.number="maxPublicResponsesInput"
              type="number"
              min="1"
              class="input input-narrow"
              placeholder="No limit"
            />
          </div>
          <label class="checkbox-row">
            <input v-model="requirePublicEmail" type="checkbox" :disabled="publicSaving" class="checkbox-input" />
            <span>Require email for public respondents</span>
          </label>
          <!-- Captcha disabled for now
          <label class="checkbox-row">
            <input v-model="captchaEnabled" type="checkbox" :disabled="publicSaving" class="checkbox-input" />
            <span>Enable CAPTCHA</span>
          </label>
          -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="publicSaving"
              @click="savePublicSettings"
            >
              <span v-if="publicSaving" class="btn-spinner" aria-hidden="true"></span>
              {{ publicSaving ? 'Saving…' : 'Save settings' }}
            </button>
            <span v-if="publicSaveResult" :class="['form-feedback', publicSaveError ? 'error' : 'success']">
              {{ publicSaveResult }}
            </span>
          </div>
        </template>
      </div>
    </Card>

    <!-- Share survey link -->
    <Card class="section-card share-card">
      <template #header>
        <div class="section-card-header">
          <span class="section-icon section-icon-link" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </span>
          <div>
            <h3 class="section-title">Share survey link</h3>
            <p class="section-subtitle">Generate a new unique link for each respondent. One link — one response.</p>
        </div>
        </div>
      </template>
      <div class="share-actions">
        <div v-if="shareLinkUrl" class="share-link-block">
          <div class="input-with-action">
            <input :value="shareLinkUrl" readonly class="input input-readonly" aria-label="Survey share link" />
            <button
              type="button"
              class="btn btn-primary btn-copy"
              :aria-label="copyFeedback ? 'Copied' : 'Copy link'"
              @click="copyShareLink"
            >
              <span v-if="copyFeedback" class="copy-check" aria-hidden="true">✓</span>
              {{ copyFeedback ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-generate-another"
            :disabled="shareLinkLoading"
            @click="createShareLink"
          >
            <span v-if="shareLinkLoading" class="btn-spinner" aria-hidden="true"></span>
            {{ shareLinkLoading ? 'Generating…' : 'Generate another link' }}
          </button>
        </div>
        <template v-else>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="shareLinkLoading"
            @click="createShareLink"
          >
            <span v-if="shareLinkLoading" class="btn-spinner" aria-hidden="true"></span>
            {{ shareLinkLoading ? 'Generating…' : 'Generate new link' }}
          </button>
        </template>
        <p v-if="shareLinkError" class="msg msg-error" role="alert">{{ shareLinkError }}</p>
      </div>
    </Card>
    </div>

    <div v-show="invitationsTab === 'personal'" class="invitations-tab-panel">
    <!-- Invitations list -->
    <Card class="section-card list-card">
      <template #header>
        <div class="list-card-header">
          <div class="section-card-header">
            <span class="section-icon section-icon-list" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </span>
            <div>
              <h3 class="section-title">Invitations list</h3>
              <p class="section-subtitle">{{ invitations.length }} invitation{{ invitations.length === 1 ? '' : 's' }}</p>
          </div>
          </div>
          <div v-if="pendingCount > 0" class="header-actions-inline">
            <span class="pending-badge">{{ pendingCount }} pending</span>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="sendingPending"
              @click="sendPendingInvitations"
            >
              <span v-if="sendingPending" class="btn-spinner" aria-hidden="true"></span>
              {{ sendingPending ? 'Sending…' : 'Send pending' }}
            </button>
            <span v-if="sendPendingResult" class="form-feedback success">{{ sendPendingResult }}</span>
          </div>
        </div>
      </template>
      <div v-if="loading" class="state state-loading">
        <span class="spinner" aria-hidden="true"></span>
        <span>Loading invitations…</span>
      </div>
      <div v-else-if="loadError" class="state state-error" role="alert">
        <span class="state-icon" aria-hidden="true">⚠</span>
        {{ loadError }}
      </div>
      <div v-else-if="invitations.length === 0" class="state state-empty">
        <p class="state-title">No invitations yet</p>
        <p class="state-desc">Send invitations by email or create a share link above.</p>
      </div>
      <div v-else class="table-wrap">
        <table class="invitations-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th class="th-date">Sent</th>
              <th class="th-date">Responded</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invitation in invitations" :key="invitation.id" class="table-row">
              <td class="col-email">{{ invitation.email }}</td>
              <td>
                <span :class="['badge', `badge-${invitation.status}`]">
                  {{ getStatusLabel(invitation.status) }}
                </span>
              </td>
              <td class="col-date">{{ formatDate(invitation.sentAt) }}</td>
              <td class="col-date">{{ formatDate(invitation.respondedAt) }}</td>
              <td class="col-actions">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  :disabled="sendingPending || invitation.status !== 'pending'"
                  @click="resendInvitation(invitation.id)"
                >
                  Resend
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
    </div>

    <Modal v-model="showInviteModal" title="Send invitations" :closable="true">
      <div class="invite-form">
        <div class="invite-methods">
        <div class="form-group">
            <label for="invite-emails" class="label">Paste email addresses (one per line)</label>
          <textarea
              id="invite-emails"
            v-model="inviteEmails"
              rows="5"
              class="input textarea"
              placeholder="user1@example.com&#10;user2@example.com"
            />
          </div>
          <div class="form-group invite-import-row">
            <label class="label">Or import from file</label>
            <input
              ref="csvFileInput"
              type="file"
              accept=".csv"
              class="input-file-hidden"
              aria-label="Choose CSV file"
              @change="onCsvFileSelected"
            />
            <button type="button" class="btn btn-secondary" @click="triggerCsvInput">
              Import CSV
            </button>
            <p v-if="csvPreviewCount !== null" class="csv-preview">
              {{ csvPreviewCount }} email{{ csvPreviewCount === 1 ? '' : 's' }} found
              <template v-if="csvPreviewEmails.length"> (e.g. {{ csvPreviewEmails.slice(0, 3).join(', ') }}{{ csvPreviewEmails.length > 3 ? '…' : '' }})</template>
            </p>
            <p v-if="csvParseError" class="msg msg-error" role="alert">{{ csvParseError }}</p>
          </div>
          <div class="form-group hubspot-row">
            <template v-if="hubspotConnected">
              <label class="label">Import from HubSpot</label>
              <div class="hubspot-import-row">
                <select v-model="hubspotSegment" class="input input-narrow">
                  <option value="all">All contacts</option>
                  <option value="recent">Contacts (last 30 days)</option>
                </select>
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="hubspotImportLoading"
                  @click="importFromHubSpot"
                >
                  <span v-if="hubspotImportLoading" class="btn-spinner" aria-hidden="true"></span>
                  {{ hubspotImportLoading ? 'Loading…' : 'Import' }}
                </button>
              </div>
              <p v-if="hubspotImportError" class="msg msg-error" role="alert">{{ hubspotImportError }}</p>
            </template>
            <template v-else>
              <button
                type="button"
                class="btn btn-ghost"
                :class="{ 'btn-disabled': !hubspotConfigured }"
                :disabled="!hubspotConfigured || hubspotConnectLoading"
                :title="hubspotConfigured ? 'Connect your HubSpot account' : 'HubSpot integration is not configured by the administrator'"
                @click="connectHubSpot"
              >
                <span v-if="hubspotConnectLoading" class="btn-spinner" aria-hidden="true"></span>
                {{ hubspotConfigured ? 'Connect HubSpot' : 'Connect HubSpot (not configured)' }}
              </button>
            </template>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="showInviteModal = false">Cancel</button>
        <button
          v-if="csvPreviewCount !== null && csvPreviewCount > 0"
          type="button"
          class="btn btn-primary"
          :disabled="sending"
          @click="createInvitationsFromCsv"
        >
          <span v-if="sending" class="btn-spinner" aria-hidden="true"></span>
          {{ sending ? 'Adding…' : `Add ${csvPreviewCount} invitation${csvPreviewCount === 1 ? '' : 's'}` }}
        </button>
        <button type="button" class="btn btn-primary" :disabled="sending" @click="sendInvitations">
          <span v-if="sending" class="btn-spinner" aria-hidden="true"></span>
          {{ sending ? 'Sending…' : 'Send' }}
        </button>
      </template>
    </Modal>

    <div v-show="invitationsTab === 'consent'" class="invitations-tab-panel">
    <!-- Survey Consent Settings -->
    <Card class="section-card consent-card">
      <template #header>
        <div class="section-card-header">
          <span class="section-icon section-icon-consent" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 3 3-3v7c0 5.55-3.84 9.74-9 11-5.16-1.26-9-5.45-9-11V2l3 3 3-3"/><circle cx="12" cy="11" r="2"/><path d="m9 11 2 2 4-4"/></svg>
          </span>
          <div>
            <h3 class="section-title">Survey Consent</h3>
            <p class="section-subtitle">Configure GDPR consent text and privacy settings for your survey.</p>
          </div>
        </div>
      </template>

      <div class="consent-form">
        <div v-if="projectLoadError" class="msg msg-error" role="alert">{{ projectLoadError }}</div>
        <div v-else>
          <!-- Consent Toggle -->
          <div class="consent-toggle-section">
            <div class="switch-row">
              <div class="switch-content">
                <div class="switch-label">
                  Enable GDPR Consent
                  <span v-if="consentRecommendation === 'required'" class="recommendation-badge required">
                    <AlertCircle size="14" />
                    Required
                  </span>
                  <span v-else-if="consentRecommendation === 'recommended'" class="recommendation-badge recommended">
                    <Info size="14" />
                    Recommended
                  </span>
                  <span v-else class="recommendation-badge optional">
                    <CheckCircle size="14" />
                    Optional
                  </span>
                </div>
                <div class="switch-description">{{ getRecommendationText(consentRecommendation) }}</div>
              </div>
              <label class="switch">
                <input
                  v-model="consentEnabled"
                  type="checkbox"
                  :disabled="consentRecommendation === 'required'"
                  :title="consentRecommendation === 'required' ? 'Consent is required for this configuration' : undefined"
                />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Recommendation reasons -->
            <div v-if="getRecommendationReasons().length > 0" class="consent-reasons">
              <div class="reasons-title">
                <HelpCircle size="16" class="help-icon" />
                Why this recommendation:
              </div>
              <ul class="reasons-list">
                <li v-for="reason in getRecommendationReasons()" :key="reason">{{ reason }}</li>
              </ul>
            </div>
          </div>

          <!-- Consent Settings (shown when enabled) -->
          <div v-if="consentEnabled" class="form-group">
            <label for="consent-text" class="form-label">
              <FileText class="label-icon" size="16" />
              Consent Text
              <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <textarea
                id="consent-text"
                v-model="consentText"
                rows="6"
                placeholder="I consent to participate in this survey and understand that my responses will be collected and processed according to the privacy policy."
                class="form-input enhanced-textarea"
                :class="{ error: consentText.trim() === '', 'has-content': consentText.trim() }"
              ></textarea>
              <div class="input-icon">
                <Edit3 size="16" />
              </div>
            </div>
            <p class="form-hint">This text will be shown to respondents before they start the survey. Be clear about data collection and usage.</p>
          </div>

          <!-- URL Fields Grid -->
          <div v-if="consentEnabled" class="url-fields-grid">
            <div class="form-group">
              <label for="privacy-policy-url" class="form-label">
                <Shield class="label-icon" size="16" />
                Privacy Policy URL
                <span class="form-optional">(optional)</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="privacy-policy-url"
                  v-model="privacyPolicyUrl"
                  type="url"
                  placeholder="https://example.com/privacy-policy"
                  class="form-input enhanced-input"
                  :class="{ 'has-content': privacyPolicyUrl.trim() }"
                />
                <div class="input-icon">
                  <Link size="16" />
                </div>
              </div>
              <p class="form-hint">Link to your privacy policy</p>
            </div>

            <div class="form-group">
              <label for="terms-of-service-url" class="form-label">
                <ScrollText class="label-icon" size="16" />
                Terms of Service URL
                <span class="form-optional">(optional)</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="terms-of-service-url"
                  v-model="termsOfServiceUrl"
                  type="url"
                  placeholder="https://example.com/terms-of-service"
                  class="form-input enhanced-input"
                  :class="{ 'has-content': termsOfServiceUrl.trim() }"
                />
                <div class="input-icon">
                  <Link size="16" />
                </div>
              </div>
              <p class="form-hint">Link to your terms of service</p>
            </div>
          </div>

          <!-- Consent Preview -->
          <div v-if="consentEnabled && consentText.trim()" class="consent-preview">
            <h4 class="preview-title">Preview</h4>
            <div class="preview-card">
              <div class="preview-consent-text">{{ consentText }}</div>
              <div v-if="privacyPolicyUrl || termsOfServiceUrl" class="preview-links">
                <div v-if="privacyPolicyUrl" class="preview-link">
                  <a :href="privacyPolicyUrl" target="_blank" rel="noopener">📋 Privacy Policy</a>
                </div>
                <div v-if="termsOfServiceUrl" class="preview-link">
                  <a :href="termsOfServiceUrl" target="_blank" rel="noopener">📄 Terms of Service</a>
                </div>
              </div>
              <div class="preview-actions">
                <button class="btn btn-secondary">Decline</button>
                <button class="btn btn-primary">Accept & Continue</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="savingConsent || (consentEnabled && !consentText.trim())"
              @click="saveConsentSettings"
            >
              <span v-if="savingConsent" class="btn-spinner" aria-hidden="true"></span>
              {{ savingConsent ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </div>
    </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { FileText, Shield, ScrollText, Link, Edit3, AlertCircle, Info, CheckCircle, HelpCircle } from 'lucide-vue-next';
import Card from '../../../../shared/components/Card.vue';
import Modal from '../../../../shared/components/Modal.vue';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import { SendRemindersButton, ResponsePaceCard } from './components';
import { container } from '../../../../infrastructure/bootstrap/container';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { userContextService } from '../../../../shared/services/user-context.service';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import type { InvitationPresenter } from '../presenters/invitation.presenter';
import type { InvitationListItem } from '../presenters/invitation.presenter';
import { ProjectPresenter } from '../../../projects/interface-adapters/presenters/project.presenter';
import type { Response } from '../../../projects/domain/entities/response.entity';

const route = useRoute();
const projectId = route.params.projectId as string;
const invitationsTab = ref<'public' | 'personal' | 'consent'>('public');

// Audience collection method (for consent recommendations)
const audienceChoice = ref<'survey' | 'email' | 'panel'>('survey');

// Consent settings
const consentText = ref('');
const privacyPolicyUrl = ref('');
const termsOfServiceUrl = ref('');
const savingConsent = ref(false);
const consentEnabled = ref(false);

// Consent recommendation logic
const consentRecommendation = computed(() => {
  // Factor 1: Collecting personal data (email, names, etc.)
  const collectsPersonalData = requirePublicEmail.value ||
                              audienceChoice.value === 'email' ||
                              hubspotConfigured.value;

  // Factor 2: Public access to survey
  const hasPublicAccess = publicAccessEnabled.value;

  // Factor 3: Research type requiring detailed consent
  const requiresDetailedConsent = false; // Can be extended based on template type

  // Factor 4: Using tools with automatic processing
  const usesProcessingTools = hubspotConfigured.value;

  // Factor 5: Any external integrations or data sharing
  const hasExternalIntegrations = hubspotConfigured.value;

  if (collectsPersonalData || requiresDetailedConsent) {
    return 'required';
  } else if (hasPublicAccess || usesProcessingTools || hasExternalIntegrations) {
    return 'recommended';
  } else {
    return 'optional';
  }
});

const getRecommendationText = (level) => {
  switch (level) {
    case 'required':
      return 'Required for legal compliance and data protection.';
    case 'recommended':
      return 'Recommended for ethical data collection practices.';
    case 'optional':
      return 'Optional for anonymous surveys without personal data.';
    default:
      return 'Show consent form before survey starts.';
  }
};

const getRecommendationReasons = () => {
  const reasons = [];

  if (requirePublicEmail.value) {
    reasons.push('You collect email addresses');
  }
  if (audienceChoice.value === 'email') {
    reasons.push('You send personal invitations');
  }
  if (hubspotConfigured.value) {
    reasons.push('You use CRM integration');
  }
  if (publicAccessEnabled.value) {
    reasons.push('Public survey access enabled');
  }

  return reasons;
};

const invitationPresenter = container.get<InvitationPresenter>(TYPES.InvitationPresenter);
const projectPresenter = container.get<ProjectPresenter>(PROJECT_TYPES.ProjectPresenter);

/** Parse API error message for display (e.g. extract .error from HTTP 400 body) */
function parseApiError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    const colonSpace = msg.indexOf(': ');
    if (colonSpace !== -1) {
      try {
        const body = JSON.parse(msg.slice(colonSpace + 2));
        if (typeof body?.error === 'string') return body.error;
      } catch {
        // not JSON
      }
    }
    return msg;
  }
  return 'Something went wrong';
}

const invitations = ref<InvitationListItem[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);

const showInviteModal = ref(false);
const inviteEmails = ref('');
const sending = ref(false);
const csvFileInput = ref<HTMLInputElement | null>(null);
const csvPreviewCount = ref<number | null>(null);
const csvPreviewEmails = ref<string[]>([]);
const csvParseError = ref('');
const sendingPending = ref(false);
const sendPendingResult = ref('');

const hubspotConnected = ref(false);
const hubspotConfigured = ref(false);
const hubspotConnectLoading = ref(false);
const hubspotSegment = ref<'all' | 'recent'>('all');
const hubspotImportLoading = ref(false);
const hubspotImportError = ref('');

const pendingCount = computed(() =>
  invitations.value.filter(
    (inv) => inv.status === 'pending' && inv.email && !inv.email.startsWith('share-')
  ).length
);

const shareLinkUrl = ref('');
const shareLinkLoading = ref(false);
const shareLinkError = ref('');
const copyFeedback = ref(false);
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

// Public link (project settings)
const projectLoadError = ref<string | null>(null);
const publicAccessEnabled = ref(false);
const publicSlug = ref<string | null>(null);
const maxPublicResponsesInput = ref<number | ''>('');
const requirePublicEmail = ref(false);
const captchaEnabled = ref(false);
const publicSaving = ref(false);
const publicSaveResult = ref('');
const publicSaveError = ref(false);
const publicCopyFeedback = ref(false);
let publicCopyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

const publicSurveyFullUrl = computed(() => {
  if (!publicSlug.value) return '';
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/s/${publicSlug.value}`;
});

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    sent: 'Sent',
    opened: 'Opened',
    completed: 'Responded',
    responded: 'Responded',
    expired: 'Expired',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit' });
};

/** Parse a single CSV line respecting quoted fields (e.g. "a,b",c). */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        const next = line.indexOf('"', end);
        if (next === -1) break;
        if (line[next + 1] === '"') {
          end = next + 2;
          continue;
        }
        result.push(line.slice(i + 1, next).replace(/""/g, '"').trim());
        end = next + 1;
        break;
      }
      i = line.indexOf(',', end);
      i = i === -1 ? line.length : i + 1;
      continue;
    }
    const comma = line.indexOf(',', i);
    const token = (comma === -1 ? line.slice(i) : line.slice(i, comma)).trim();
    result.push(token);
    i = comma === -1 ? line.length : comma + 1;
  }
  return result;
}

/** Extract email column from CSV text. Expects header row with "email" (case-insensitive). */
function parseCsvForEmails(text: string): { emails: string[]; error?: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { emails: [], error: 'CSV must have a header row and at least one data row' };
  }
  const headers = parseCsvLine(lines[0]);
  const emailIdx = headers.findIndex(h => h.toLowerCase().trim() === 'email');
  if (emailIdx === -1) {
    return { emails: [], error: 'CSV must have an "email" column' };
  }
  const emails: string[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]);
    const val = cells[emailIdx]?.trim();
    if (val && val.includes('@')) emails.push(val);
  }
  return { emails };
}

function triggerCsvInput() {
  csvParseError.value = '';
  csvPreviewCount.value = null;
  csvPreviewEmails.value = [];
  csvFileInput.value?.click();
}

async function onCsvFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  csvParseError.value = '';
  csvPreviewCount.value = null;
  csvPreviewEmails.value = [];
  try {
    const text = await file.text();
    const { emails, error } = parseCsvForEmails(text);
    if (error) {
      csvParseError.value = error;
      return;
    }
    if (emails.length === 0) {
      csvParseError.value = 'No valid email addresses found in the file';
      return;
    }
    csvPreviewEmails.value = emails;
    csvPreviewCount.value = emails.length;
  } catch {
    csvParseError.value = 'Failed to read file';
  }
  input.value = '';
}

async function createInvitationsFromCsv() {
  if (csvPreviewEmails.value.length === 0) return;
  sending.value = true;
  try {
    const result = await invitationPresenter.createInvitations(projectId, csvPreviewEmails.value);
    if (result.error) {
      alert(result.error);
      return;
    }
    showInviteModal.value = false;
    csvPreviewCount.value = null;
    csvPreviewEmails.value = [];
    invitations.value = [...invitations.value, ...result.invitations];
  } catch (error) {
    console.error('Failed to create invitations from CSV:', error);
    alert(parseApiError(error));
  } finally {
    sending.value = false;
  }
}

watch(showInviteModal, (open) => {
  if (!open) {
    csvPreviewCount.value = null;
    csvPreviewEmails.value = [];
    csvParseError.value = '';
  }
});

const sendInvitations = async () => {
  const emails = inviteEmails.value
    .split('\n')
    .map(e => e.trim())
    .filter(e => e && e.includes('@'));
  
  if (emails.length === 0) {
    alert('Please enter at least one email address');
    return;
  }

  sending.value = true;
  try {
    const result = await invitationPresenter.createInvitations(projectId, emails);
    if (result.error) {
      alert(result.error);
      return;
    }
    showInviteModal.value = false;
    inviteEmails.value = '';
    invitations.value = [...invitations.value, ...result.invitations];
  } catch (error) {
    console.error('Failed to send invitations:', error);
    alert(parseApiError(error));
  } finally {
    sending.value = false;
  }
};

const sendPendingInvitations = async () => {
  if (!projectId) return;
  sendingPending.value = true;
  sendPendingResult.value = '';
  try {
    const result = await invitationPresenter.sendInvitations(projectId);
    if (result.error) {
      sendPendingResult.value = result.error;
      return;
    }
    sendPendingResult.value = `Sent: ${result.sent}, failed: ${result.failed}`;
    if (result.errors?.length) {
      sendPendingResult.value += ' — ' + result.errors.slice(0, 2).join('; ');
    }
    await loadInvitations();
  } finally {
    sendingPending.value = false;
  }
};

const resendInvitation = async (invitationId: string) => {
  if (!projectId) return;
  sendingPending.value = true;
  sendPendingResult.value = '';
  try {
    const result = await invitationPresenter.sendInvitations(projectId, [invitationId]);
    if (result.error) {
      sendPendingResult.value = result.error;
      return;
    }
    sendPendingResult.value = result.sent ? 'Sent' : result.failed ? 'Failed' : '';
    await loadInvitations();
  } finally {
    sendingPending.value = false;
  }
};

const loadInvitations = async () => {
  if (!projectId) return;
  loading.value = true;
  loadError.value = null;
  try {
    const result = await invitationPresenter.loadInvitations(projectId);
    if (result.error) {
      loadError.value = result.error;
      invitations.value = [];
    } else {
      invitations.value = result.invitations;
      const shareInv = result.invitations.find(
        (inv) => inv.email && inv.email.startsWith(`share-${projectId}@`)
      );
      if (shareInv && shareInv.token) {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        shareLinkUrl.value = `${base}/survey/${shareInv.token}`;
      }
    }
  } finally {
    loading.value = false;
  }
};

const createShareLink = async () => {
  if (!projectId) return;
  shareLinkLoading.value = true;
  shareLinkError.value = '';
  try {
    const result = await invitationPresenter.createShareLink(projectId);
    if (result.error) {
      shareLinkError.value = parseApiError(new Error(result.error));
      return;
    }
    shareLinkUrl.value = result.url ?? '';
    await loadInvitations();
  } catch (err) {
    shareLinkError.value = parseApiError(err);
  } finally {
    shareLinkLoading.value = false;
  }
};

const copyShareLink = async () => {
  if (!shareLinkUrl.value) return;
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  try {
    await navigator.clipboard.writeText(shareLinkUrl.value);
    copyFeedback.value = true;
    copyFeedbackTimer = setTimeout(() => {
      copyFeedback.value = false;
      copyFeedbackTimer = null;
    }, 2000);
  } catch {
    shareLinkError.value = 'Could not copy to clipboard';
  }
};

const loadProject = async () => {
  if (!projectId) return;
  projectLoadError.value = null;
  const result = await projectPresenter.getProject(projectId);
  if (result.error || !result.project) {
    if (import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mockPublicLink') === '1') {
      publicAccessEnabled.value = true;
      publicSlug.value = 'demo';
      maxPublicResponsesInput.value = 100;
      requirePublicEmail.value = false;
      captchaEnabled.value = false;
      return;
    }
    projectLoadError.value = result.error ?? 'Failed to load project';
    return;
  }
  const p = result.project;
  publicAccessEnabled.value = p.publicAccessEnabled;
  publicSlug.value = p.publicSlug;
  maxPublicResponsesInput.value = p.maxPublicResponses ?? '';
  requirePublicEmail.value = p.requirePublicEmail;
  captchaEnabled.value = p.captchaEnabled;

  // Load consent settings
  consentText.value = p.consentText ?? '';
  privacyPolicyUrl.value = p.privacyPolicyUrl ?? '';
  termsOfServiceUrl.value = p.termsOfServiceUrl ?? '';

  // Auto-enable consent if already configured, otherwise let recommendation handle it
  consentEnabled.value = !!p.consentText?.trim();
};

const savePublicSettings = async () => {
  if (!projectId) return;
  publicSaving.value = true;
  publicSaveResult.value = '';
  publicSaveError.value = false;
  try {
    const maxVal = maxPublicResponsesInput.value === '' ? undefined : Number(maxPublicResponsesInput.value);
    if (maxVal !== undefined && (Number.isNaN(maxVal) || maxVal < 1)) {
      publicSaveResult.value = 'Max responses must be at least 1';
      publicSaveError.value = true;
      return;
    }
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
      undefined,
      undefined,
      undefined,
      undefined,
      publicAccessEnabled.value,
      publicSlug.value ?? undefined,
      maxVal ?? null,
      requirePublicEmail.value,
      captchaEnabled.value
    );
    if (result.ok) {
      publicSaveResult.value = 'Saved';
      const proj = result.project;
      if (proj) {
        publicAccessEnabled.value = proj.publicAccessEnabled ?? publicAccessEnabled.value;
        publicSlug.value = proj.publicSlug ?? publicSlug.value;
        maxPublicResponsesInput.value = proj.maxPublicResponses ?? maxPublicResponsesInput.value;
        requirePublicEmail.value = proj.requirePublicEmail ?? requirePublicEmail.value;
        captchaEnabled.value = proj.captchaEnabled ?? captchaEnabled.value;
      } else {
        await loadProject();
      }
    } else {
      publicSaveResult.value = result.error ?? 'Save failed';
      publicSaveError.value = true;
    }
  } catch (err) {
    publicSaveResult.value = parseApiError(err);
    publicSaveError.value = true;
  } finally {
    publicSaving.value = false;
  }
};

const copyPublicLink = async () => {
  const url = publicSurveyFullUrl.value;
  if (!url) return;
  if (publicCopyFeedbackTimer) clearTimeout(publicCopyFeedbackTimer);
  try {
    await navigator.clipboard.writeText(url);
    publicCopyFeedback.value = true;
    publicCopyFeedbackTimer = setTimeout(() => {
      publicCopyFeedback.value = false;
      publicCopyFeedbackTimer = null;
    }, 2000);
  } catch {
    publicSaveResult.value = 'Could not copy to clipboard';
    publicSaveError.value = true;
  }
};

const loadHubspotStatus = async () => {
  try {
    const userId = userContextService.getOrCreateUserId();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HUBSPOT_STATUS}`;
    const res = await fetch(url, { headers: { 'x-user-id': userId } });
    const data = await res.json().catch(() => ({}));
    hubspotConnected.value = !!data.connected;
    hubspotConfigured.value = !!data.configured;
  } catch {
    hubspotConnected.value = false;
    hubspotConfigured.value = false;
  }
};

const connectHubSpot = async () => {
  if (!hubspotConfigured.value) return;
  hubspotConnectLoading.value = true;
  hubspotImportError.value = '';
  try {
    const userId = userContextService.getOrCreateUserId();
    const returnTo = `/projects/${projectId}/invitations`;
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HUBSPOT_AUTHORIZE(returnTo)}&json=1`;
    const res = await fetch(url, { headers: { 'x-user-id': userId } });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    hubspotImportError.value = data.error || data.message || 'Failed to start HubSpot connection';
  } catch (e) {
    hubspotImportError.value = e instanceof Error ? e.message : 'Failed to connect';
  } finally {
    hubspotConnectLoading.value = false;
  }
};

const importFromHubSpot = async () => {
  if (!projectId) return;
  hubspotImportLoading.value = true;
  hubspotImportError.value = '';
  try {
    const userId = userContextService.getOrCreateUserId();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HUBSPOT_CONTACTS(hubspotSegment.value)}`;
    const res = await fetch(url, { headers: { 'x-user-id': userId } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      hubspotImportError.value = data.error || data.message || `Request failed (${res.status})`;
      return;
    }
    const emails = (data.emails || []).filter((e: string) => e && e.trim());
    if (emails.length === 0) {
      hubspotImportError.value = 'No contacts with email found in HubSpot.';
      return;
    }
    const result = await invitationPresenter.createInvitations(projectId, emails);
    if (result.error) {
      hubspotImportError.value = result.error;
      return;
    }
    await loadInvitations();
    hubspotImportError.value = '';
  } catch (e) {
    hubspotImportError.value = e instanceof Error ? e.message : 'Import failed';
  } finally {
    hubspotImportLoading.value = false;
  }
};

const saveConsentSettings = async () => {
  if (!projectId) return;

  savingConsent.value = true;
  try {
    await projectPresenter.updateProject(
      projectId,
      undefined, // name
      undefined, // segmentDescription
      undefined, // segmentDemographics
      undefined, // hypothesisDescription
      undefined, // hypothesisAssumptions
      undefined, // status
      undefined, // marketContext
      undefined, // scenarioTemplateSlug
      consentEnabled.value ? (consentText.value || null) : null, // consentText
      undefined, // dataUsageText
      privacyPolicyUrl.value || null, // privacyPolicyUrl
      termsOfServiceUrl.value || null, // termsOfServiceUrl
      undefined, // publicAccessEnabled
      undefined, // publicSlug
      undefined, // maxPublicResponses
      undefined, // requirePublicEmail
      undefined // captchaEnabled
    );

    // Reload project to get updated data
    await loadProject();
  } catch (e) {
    console.error('Failed to save consent settings:', e);
  } finally {
    savingConsent.value = false;
  }
};

// Auto-enable consent when it becomes required
watch(consentRecommendation, (newRecommendation) => {
  if (newRecommendation === 'required' && !consentEnabled.value) {
    consentEnabled.value = true;
  }
});

watch(showInviteModal, (open) => {
  if (open) loadHubspotStatus();
});

onMounted(() => {
  loadInvitations();
  loadProject();
  loadHubspotStatus();
});
</script>

<style scoped>
.invitation-manager-view {
  padding: 0;
  max-width: var(--content-max-width, 56rem);
}

.onboarding-hint {
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: var(--color-accent-bg, #ccfbf1);
  color: var(--color-accent-dark, #0f766e);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
}

.invitations-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.invitations-tabs button {
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.invitations-tabs button:hover {
  color: var(--color-text);
}

.invitations-tabs button.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.invitations-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section cards */
.section-card {
  margin-bottom: 0;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card :deep(.card-header) {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0.5rem;
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
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

.section-icon-globe {
  background: rgba(13, 148, 136, 0.1);
}

.section-icon-link {
  background: rgba(13, 148, 136, 0.1);
}

.section-icon-list {
  background: rgba(13, 148, 136, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.15rem 0;
  letter-spacing: -0.01em;
}


/* Switch (toggle) */
.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  width: 44px;
  height: 24px;
  border-radius: 9999px;
  background: var(--color-border, #e2e8f0);
  position: relative;
  transition: background 0.2s;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.switch-input:checked + .switch-track {
  background: var(--color-accent, #0d9488);
}

.switch-input:checked + .switch-track::after {
  transform: translateX(20px);
}

.switch-input:disabled + .switch-track {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-label {
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--color-text, #0f172a);
}

/* Form */
.public-link-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.label {
  display: block;
  font-weight: 500;
  font-size: 0.8125rem;
  color: var(--color-text, #334155);
  margin-bottom: 0.375rem;
}

.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg, #fff);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.input-readonly {
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text-muted, #64748b);
}

.input-narrow {
  max-width: 8rem;
}

.input-group {
  margin-bottom: 0;
}

.input-group-inline {
  max-width: 12rem;
}

.input-with-action {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-action .input {
  flex: 1;
  min-width: 0;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-accent, #0d9488);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-feedback {
  font-size: 0.8125rem;
}

.form-feedback.success {
  color: var(--color-success, #16a34a);
}

.form-feedback.error {
  color: var(--color-error, #dc2626);
}

.msg {
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
}

.msg-error {
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-error, #dc2626);
}

.share-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.share-link-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-generate-another {
  align-self: flex-start;
}

/* List card header */
.list-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pending-badge {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  font-weight: 500;
}

/* States */
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  font-size: 0.9375rem;
}

.state-loading {
  color: var(--color-text-muted, #64748b);
}

.state-error {
  color: var(--color-error, #dc2626);
}

.state-icon {
  font-size: 1.25rem;
}

.state-empty {
  flex-direction: column;
  text-align: center;
  gap: 0.25rem;
}

.state-title {
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0;
}

.state-desc {
  color: var(--color-text-muted, #64748b);
  margin: 0;
  font-size: 0.875rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border, #e2e8f0);
  border-top-color: var(--color-accent, #0d9488);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.invitations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.invitations-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  background: var(--color-bg-subtle, #f8fafc);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.invitations-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text);
  vertical-align: middle;
}

.invitations-table tbody tr:last-child td {
  border-bottom: none;
}

.invitations-table tbody tr:hover {
  background: var(--color-bg-subtle, #f8fafc);
}

.col-email {
  word-break: break-all;
  font-weight: 500;
}

.col-date {
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
}

.th-date,
.th-actions {
  width: 1%;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-pending {
  background: #f1f5f9;
  color: #64748b;
}

.badge-sent {
  background: #eff6ff;
  color: #2563eb;
}

.badge-opened {
  background: #fef3c7;
  color: #d97706;
}

.badge-responded,
.badge-completed {
  background: #ecfdf5;
  color: #059669;
}

.badge-expired {
  background: #fef2f2;
  color: #dc2626;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  border: none;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
}

.btn-icon {
  font-size: 1.1em;
  line-height: 1;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.btn-cta {
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
}

.btn-primary {
  background: var(--color-accent, #0d9488);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-copy {
  flex-shrink: 0;
}

.copy-check {
  margin-right: 0.25rem;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted, #64748b);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--color-text, #0f172a);
  background: var(--color-bg-subtle, #f1f5f9);
}

.btn-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: -0.15em;
  margin-right: 0.35rem;
}

/* Modal form */
.invite-form {
  padding: 0.25rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.textarea {
  min-height: 140px;
  resize: vertical;
}

.invite-methods {
    display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invite-import-row .label,
.hubspot-row .label {
  display: block;
  margin-bottom: 0.5rem;
}

.hubspot-import-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.input-file-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.invite-import-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.invite-import-row .btn {
  flex-shrink: 0;
}

.csv-preview {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  width: 100%;
}

.hubspot-row .btn-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .invitations-table .th-date,
  .invitations-table .col-date {
    display: none;
  }

  .section-card-header {
    gap: 0.75rem;
  }

  .section-icon {
    width: 36px;
    height: 36px;
  }

  .input-with-action {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-copy {
    width: 100%;
  }
}

/* Survey Consent Styles */
.consent-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.consent-toggle-section {
  padding: 1.5rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.switch-content {
  flex: 1;
}

.switch-label {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.switch-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Recommendation badges */
.recommendation-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-left: 0.75rem;
}

.recommendation-badge.required {
  background: #fee2e2;
  color: #dc2626;
}

.recommendation-badge.required svg {
  color: #dc2626;
}

.recommendation-badge.recommended {
  background: #fef3c7;
  color: #d97706;
}

.recommendation-badge.recommended svg {
  color: #d97706;
}

.recommendation-badge.optional {
  background: #d1fae5;
  color: #059669;
}

.recommendation-badge.optional svg {
  color: #059669;
}

/* Consent reasons */
.consent-reasons {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.reasons-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.help-icon {
  color: var(--color-accent);
  opacity: 0.8;
}

.reasons-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.reasons-list li {
  position: relative;
  padding-left: 1rem;
  margin-bottom: 0.25rem;
}

.reasons-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
}

/* Switch Toggle */
.switch {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: 0.3s;
  border-radius: 1.5rem;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 1.125rem;
  width: 1.125rem;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.switch input:checked + .switch-slider {
  background-color: var(--color-accent);
}

.switch input:checked + .switch-slider:before {
  transform: translateX(1.5rem);
}

.switch input:disabled + .switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch input:disabled {
  cursor: not-allowed;
}


.url-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .url-fields-grid {
    grid-template-columns: 1fr;
  }
}

.form-optional {
  font-weight: normal;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.consent-preview {
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
}

.preview-card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.preview-consent-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.preview-links {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.preview-link a {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-link a:hover {
  text-decoration: underline;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.preview-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Enhanced Form Styles */
.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.label-icon {
  opacity: 0.8;
  color: var(--color-accent);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .input-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.enhanced-input,
.enhanced-textarea {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  transition: all 0.2s ease;
  font-family: inherit;
}

.enhanced-input:focus,
.enhanced-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.enhanced-input:hover,
.enhanced-textarea:hover {
  border-color: var(--color-accent);
}

.enhanced-input.has-content + .input-icon,
.enhanced-textarea.has-content + .input-icon {
  opacity: 1;
  color: var(--color-accent);
}

.enhanced-input.error,
.enhanced-textarea.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.enhanced-input.error:focus,
.enhanced-textarea.error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
}

.enhanced-textarea {
  resize: vertical;
  min-height: 120px;
  padding-right: 0.75rem;
}

.enhanced-textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.7;
}

.enhanced-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.7;
}

/* Form hints enhancement */
.form-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.375rem;
  line-height: 1.4;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .enhanced-input,
  .enhanced-textarea {
    font-size: 1rem; /* Prevent zoom on iOS */
  }

  .input-wrapper .input-icon {
    right: 0.5rem;
  }

  .enhanced-input,
  .enhanced-textarea {
    padding: 0.625rem 2rem 0.625rem 0.625rem;
  }
}
</style>

