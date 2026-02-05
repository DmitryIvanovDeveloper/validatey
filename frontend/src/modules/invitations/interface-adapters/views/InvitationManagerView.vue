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
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back</router-link>
        <button type="button" class="btn btn-primary" @click="showInviteModal = true">
          + Send invitations
        </button>
      </template>
    </PageHeader>

    <!-- Public link (one link, many respondents) -->
    <Card class="public-link-card">
      <template #header>
        <div class="public-link-card-header">
          <span class="public-link-icon" aria-hidden="true">🌐</span>
          <h3 class="card-title">Public link</h3>
        </div>
      </template>
      <p class="public-link-desc">Create a single link anyone can use. Responses can be limited and moderated.</p>
      <div v-if="projectLoadError" class="public-link-error" role="alert">{{ projectLoadError }}</div>
      <div v-else class="public-link-form">
        <label class="toggle-row">
          <input
            v-model="publicAccessEnabled"
            type="checkbox"
            :disabled="publicSaving"
            class="toggle-input"
          />
          <span class="toggle-label">Enable public access</span>
        </label>
        <template v-if="publicAccessEnabled">
          <div v-if="publicSlug" class="public-url-row">
            <label class="field-label">Public survey URL</label>
            <div class="public-url-input-row">
              <input :value="publicSurveyFullUrl" readonly class="share-link-input" aria-label="Public survey URL" />
              <button
                type="button"
                class="btn btn-primary"
                :aria-label="publicCopyFeedback ? 'Copied' : 'Copy public link'"
                @click="copyPublicLink"
              >
                {{ publicCopyFeedback ? 'Copied!' : 'Copy link' }}
              </button>
            </div>
          </div>
          <div class="field-row">
            <label class="field-label" for="max-public-responses">Max responses (leave empty for no limit)</label>
            <input
              id="max-public-responses"
              v-model.number="maxPublicResponsesInput"
              type="number"
              min="1"
              class="form-input field-input"
              placeholder="No limit"
            />
          </div>
          <label class="checkbox-row">
            <input v-model="requirePublicEmail" type="checkbox" :disabled="publicSaving" />
            <span>Require email for public respondents</span>
          </label>
          <label class="checkbox-row">
            <input v-model="captchaEnabled" type="checkbox" :disabled="publicSaving" />
            <span>Enable CAPTCHA</span>
          </label>
          <div class="public-link-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="publicSaving"
              @click="savePublicSettings"
            >
              <span v-if="publicSaving" class="btn-spinner" aria-hidden="true"></span>
              {{ publicSaving ? 'Saving…' : 'Save settings' }}
            </button>
            <span v-if="publicSaveResult" :class="['public-save-result', publicSaveError ? 'error' : '']">
              {{ publicSaveError || publicSaveResult }}
            </span>
          </div>
        </template>
      </div>
    </Card>

    <!-- Share survey link -->
    <Card class="share-card">
      <template #header>
        <div class="share-card-header">
          <span class="share-icon" aria-hidden="true">🔗</span>
          <h3 class="card-title">Share survey link</h3>
        </div>
      </template>
      <p class="share-desc">Anyone with this link can take the survey — ideal for social media or communities.</p>
      <div v-if="shareLinkUrl" class="share-link-row">
        <input :value="shareLinkUrl" readonly class="share-link-input" aria-label="Survey share link" />
        <button
          type="button"
          class="btn btn-primary"
          :aria-label="copyFeedback ? 'Copied' : 'Copy link'"
          @click="copyShareLink"
        >
          {{ copyFeedback ? 'Copied!' : 'Copy link' }}
        </button>
      </div>
      <div v-else class="share-link-actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="shareLinkLoading"
          @click="createShareLink"
        >
          <span v-if="shareLinkLoading" class="btn-spinner" aria-hidden="true"></span>
          {{ shareLinkLoading ? 'Creating link…' : 'Create share link' }}
        </button>
        <p v-if="shareLinkError" class="share-link-error" role="alert">{{ shareLinkError }}</p>
      </div>
    </Card>

    <!-- Invitations list -->
    <Card class="list-card">
      <template #header>
        <div class="list-card-header">
          <h3 class="card-title">Invitations list</h3>
          <div v-if="pendingCount > 0" class="send-pending-inline">
            <span class="send-pending-label">{{ pendingCount }} pending</span>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="sendingPending"
              @click="sendPendingInvitations"
            >
              <span v-if="sendingPending" class="btn-spinner" aria-hidden="true"></span>
              {{ sendingPending ? 'Sending…' : 'Send pending' }}
            </button>
            <span v-if="sendPendingResult" class="send-pending-result">{{ sendPendingResult }}</span>
          </div>
        </div>
      </template>
      <div v-if="loading" class="loading-state">
        <span class="loading-dot" aria-hidden="true"></span>
        <span>Loading invitations…</span>
      </div>
      <div v-else-if="loadError" class="error-state" role="alert">
        <span class="error-icon" aria-hidden="true">⚠</span>
        {{ loadError }}
      </div>
      <div v-else-if="invitations.length === 0" class="empty-state">
        <p>No invitations yet. Send invitations by email or create a share link above.</p>
      </div>
      <div v-else class="invitations-table">
        <div class="table-header">
          <div class="col-email">Email</div>
          <div class="col-status">Status</div>
          <div class="col-sent">Sent</div>
          <div class="col-responded">Responded</div>
          <div class="col-actions">Actions</div>
        </div>
        <div
          v-for="invitation in invitations"
          :key="invitation.id"
          class="table-row"
        >
          <div class="col-email">{{ invitation.email }}</div>
          <div class="col-status">
            <span :class="['status-badge', `status-${invitation.status}`]">
              {{ getStatusLabel(invitation.status) }}
            </span>
          </div>
          <div class="col-sent">{{ formatDate(invitation.sentAt) }}</div>
          <div class="col-responded">{{ formatDate(invitation.respondedAt) }}</div>
          <div class="col-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="sendingPending || invitation.status !== 'pending'"
              @click="resendInvitation(invitation.id)"
            >
              Resend
            </button>
          </div>
        </div>
      </div>
    </Card>

    <Modal v-model="showInviteModal" title="Send invitations" :closable="true">
      <div class="invite-form">
        <div class="form-group">
          <label for="invite-emails">Email addresses (one per line)</label>
          <textarea
            id="invite-emails"
            v-model="inviteEmails"
            rows="6"
            class="form-input"
            placeholder="user1@example.com&#10;user2@example.com"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showInviteModal = false">Cancel</button>
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

.public-link-card {
  margin-bottom: 1.5rem;
}

.public-link-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.public-link-icon {
  font-size: 1.25rem;
}

.public-link-desc {
  color: var(--color-text-muted);
  font-size: var(--text-sm, 0.875rem);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.public-link-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin: 0.5rem 0 0;
}

.public-link-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-input {
  width: 1.125rem;
  height: 1.125rem;
}

.toggle-label {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.public-url-row .field-label,
.field-row .field-label {
  display: block;
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.public-url-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.public-url-input-row .share-link-input {
  flex: 1;
  min-width: 0;
}

.field-input {
  max-width: 12rem;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-row input {
  width: 1rem;
  height: 1rem;
}

.public-link-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.public-save-result {
  font-size: var(--text-sm);
  color: var(--color-success, #16a34a);
}

.public-save-result.error {
  color: var(--color-error);
}

.share-card {
  margin-bottom: 1.5rem;
}

.share-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.share-icon {
  font-size: 1.25rem;
}

.share-desc {
  color: var(--color-text-muted);
  font-size: var(--text-sm, 0.875rem);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.share-link-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.share-link-input {
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text);
}

.share-link-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.share-link-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin: 0.5rem 0 0;
}

.list-card {
  margin-bottom: 1.5rem;
}

.list-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.send-pending-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.send-pending-label {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.send-pending-result {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.loading-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-error);
  font-size: var(--text-sm);
}

.error-icon {
  font-size: 1.25rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.empty-state p {
  margin: 0;
}

.invitations-table {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-subtle);
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  font-size: var(--text-sm);
  background: var(--color-bg);
}

.table-row:last-child {
  border-bottom: none;
}

.col-email {
  color: var(--color-text);
  word-break: break-word;
}

.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.status-pending {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.status-sent {
  background: var(--color-info-bg, #eff6ff);
  color: var(--color-info, #2563eb);
}

.status-responded,
.status-completed {
  background: var(--color-success-bg, #f0fdf4);
  color: var(--color-success, #16a34a);
}

.status-expired {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  transition: background 0.2s, box-shadow 0.2s;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover {
  color: var(--color-text);
  background: var(--color-bg-subtle);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.invite-form {
  padding: 0.25rem 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--color-text);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

@media (max-width: 640px) {
  .table-header,
  .table-row {
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .col-sent,
  .col-responded {
    display: none;
  }
}
</style>

