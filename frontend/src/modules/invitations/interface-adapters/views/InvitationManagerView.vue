<template>
  <div class="invitation-manager-view">
    <header class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep">/</span>
        <router-link :to="`/projects/${projectId}`" class="breadcrumb-link">Project</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Invitations</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">Manage Invitations</h1>
        <div class="header-actions">
          <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">← Back</router-link>
          <button type="button" @click="showInviteModal = true" class="btn btn-primary">+ Send Invitations</button>
        </div>
      </div>
      <p class="page-subtitle">Send and track survey invitations</p>
    </header>

    <!-- Invitations List -->
    <Card title="Invitations List">
      <div class="invitations-table">
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
            <button @click="resendInvitation(invitation.id)" class="btn-small btn-secondary">
              Resend
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Invite Modal -->
    <Modal v-model="showInviteModal" title="Send Invitations">
      <div class="invite-form">
        <div class="form-group">
          <label>Email addresses (one per line)</label>
          <textarea
            v-model="inviteEmails"
            rows="8"
            class="form-input"
            placeholder="user1@example.com&#10;user2@example.com&#10;..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showInviteModal = false" class="btn btn-secondary">Cancel</button>
        <button @click="sendInvitations" class="btn btn-primary" :disabled="sending">
          {{ sending ? 'Sending...' : 'Send' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import Modal from '@/shared/components/Modal.vue';
// TODO: Import InvitationStatus when available
type InvitationStatus = 'pending' | 'sent' | 'responded' | 'expired';

const route = useRoute();
const projectId = route.params.projectId as string;

const invitations = ref<Array<{
  id: string;
  email: string;
  status: InvitationStatus;
  sentAt: Date | null;
  respondedAt: Date | null;
}>>([]);

const showInviteModal = ref(false);
const inviteEmails = ref('');
const sending = ref(false);

const getStatusLabel = (status: InvitationStatus): string => {
  const labels: Record<InvitationStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
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
    // TODO: Вызов presenter для отправки приглашений
    // await invitationPresenter.sendInvitations(projectId, emails);
    showInviteModal.value = false;
    inviteEmails.value = '';
    // Обновить список
  } catch (error) {
    console.error('Failed to send invitations:', error);
  } finally {
    sending.value = false;
  }
};

const resendInvitation = async (invitationId: string) => {
  // TODO: Реализация повторной отправки
};

onMounted(async () => {
  // TODO: Загрузка приглашений через presenter
});
</script>

<style scoped>
.invitation-manager-view {
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 0.5rem;
}

.breadcrumb-link {
  color: var(--color-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover { color: var(--color-accent); }
.breadcrumb-sep { opacity: 0.5; }
.breadcrumb-current { color: var(--color-text); font-weight: 600; }

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
  color: var(--color-text);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}


.invitations-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.table-row:last-child { border-bottom: none; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.status-sent { background: var(--color-info-bg); color: var(--color-info); }
.status-responded { background: var(--color-success-bg); color: var(--color-success); }
.status-expired { background: var(--color-error-bg); color: var(--color-error); }

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.invite-form {
  padding: 1rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 1px 3px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.btn-secondary:hover { background: var(--color-border); }

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover { color: var(--color-text); background: var(--color-bg-subtle); }

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .col-email,
  .col-status,
  .col-sent,
  .col-responded,
  .col-actions {
    display: flex;
    justify-content: space-between;
  }
}
</style>

