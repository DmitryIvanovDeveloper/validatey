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
          <label class="checkbox-row">
            <input v-model="captchaEnabled" type="checkbox" :disabled="publicSaving" class="checkbox-input" />
            <span>Enable CAPTCHA</span>
          </label>
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

    <Modal v-model="showInviteModal" title="Send invitations" :closable="true">
      <div class="invite-form">
        <div class="form-group">
          <label for="invite-emails" class="label">Email addresses (one per line)</label>
          <textarea
            id="invite-emails"
            v-model="inviteEmails"
            rows="6"
            class="input textarea"
            placeholder="user1@example.com&#10;user2@example.com"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="showInviteModal = false">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="sending" @click="sendInvitations">
          <span v-if="sending" class="btn-spinner" aria-hidden="true"></span>
          {{ sending ? 'Sending…' : 'Send' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import Modal from '@/shared/components/Modal.vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '@/modules/projects/infrastructure/bootstrap/types';
import type { InvitationPresenter } from '../../interface-adapters/presenters/invitation.presenter';
import type { InvitationListItem } from '../../interface-adapters/presenters/invitation.presenter';
import { ProjectPresenter } from '@/modules/projects/interface-adapters/presenters/project.presenter';

const route = useRoute();
const projectId = route.params.projectId as string;

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
const sendingPending = ref(false);
const sendPendingResult = ref('');

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
  return `${base}/survey/public/${publicSlug.value}`;
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

onMounted(() => {
  loadInvitations();
  loadProject();
});
</script>

<style scoped>
.invitation-manager-view {
  padding: 0;
  max-width: var(--content-max-width, 56rem);
}

/* Section cards */
.section-card {
  margin-bottom: 1.5rem;
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

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
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
</style>

