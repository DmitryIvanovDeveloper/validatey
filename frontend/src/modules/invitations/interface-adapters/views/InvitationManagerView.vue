<template>
  <div class="invitation-manager-view">
    <div class="manager-header">
      <h1>Управление приглашениями</h1>
      <button @click="showInviteModal = true" class="btn btn-primary">
        + Отправить приглашения
      </button>
    </div>

    <!-- Invitations List -->
    <Card title="Список приглашений">
      <div class="invitations-table">
        <div class="table-header">
          <div class="col-email">Email</div>
          <div class="col-status">Статус</div>
          <div class="col-sent">Отправлено</div>
          <div class="col-responded">Отвечено</div>
          <div class="col-actions">Действия</div>
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
              Повторить
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Invite Modal -->
    <Modal v-model="showInviteModal" title="Отправить приглашения">
      <div class="invite-form">
        <div class="form-group">
          <label>Email адреса (по одному на строку)</label>
          <textarea
            v-model="inviteEmails"
            rows="8"
            class="form-input"
            placeholder="user1@example.com&#10;user2@example.com&#10;..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showInviteModal = false" class="btn btn-secondary">Отмена</button>
        <button @click="sendInvitations" class="btn btn-primary" :disabled="sending">
          {{ sending ? 'Отправка...' : 'Отправить' }}
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
    pending: 'Ожидает',
    sent: 'Отправлено',
    responded: 'Отвечено',
    expired: 'Истекло',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit' });
};

const sendInvitations = async () => {
  const emails = inviteEmails.value
    .split('\n')
    .map(e => e.trim())
    .filter(e => e && e.includes('@'));
  
  if (emails.length === 0) {
    alert('Пожалуйста, введите хотя бы один email');
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
  padding: 2rem 0;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.manager-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.invitations-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background: #edf2f7;
  color: #4a5568;
}

.status-sent {
  background: #bee3f8;
  color: #2c5282;
}

.status-responded {
  background: #c6f6d5;
  color: #22543d;
}

.status-expired {
  background: #fed7d7;
  color: #c53030;
}

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
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
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
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

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

