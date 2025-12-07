<template>
  <div class="project-progress-view">
    <div class="progress-header">
      <router-link :to="`/projects/${projectId}`" class="back-link">← Back to Project</router-link>
      <h1>Project Progress</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Loading data...</p>
    </div>

    <div v-else class="progress-content">
      <!-- Invitation Statistics -->
      <div class="stats-grid">
        <Card title="Total Invitations">
          <div class="stat-value">{{ invitationStats.total }}</div>
        </Card>
        <Card title="Sent">
          <div class="stat-value text-blue">{{ invitationStats.sent }}</div>
        </Card>
        <Card title="Responded">
          <div class="stat-value text-green">{{ invitationStats.responded }}</div>
        </Card>
        <Card title="Response Rate">
          <div class="stat-value text-purple">{{ responseRate }}%</div>
        </Card>
      </div>

      <!-- Invitation Statuses -->
      <Card title="Invitation Statuses" class="invitations-card">
        <div class="invitations-list">
          <div
            v-for="invitation in invitations"
            :key="invitation.id"
            class="invitation-item"
          >
            <div class="invitation-info">
              <span class="invitation-email">{{ invitation.email }}</span>
              <span :class="['invitation-status', `status-${invitation.status}`]">
                {{ getStatusLabel(invitation.status) }}
              </span>
            </div>
            <div class="invitation-meta">
              <span v-if="invitation.sentAt" class="meta-text">
                Sent: {{ formatDate(invitation.sentAt) }}
              </span>
              <span v-if="invitation.respondedAt" class="meta-text">
                Responded: {{ formatDate(invitation.respondedAt) }}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Early Signals -->
      <Card title="Early Signals" class="signals-card">
        <div class="signals-list">
          <div v-for="signal in earlySignals" :key="signal.id" class="signal-item">
            <div class="signal-icon" :class="`signal-${signal.type}`">
              {{ getSignalIcon(signal.type) }}
            </div>
            <div class="signal-content">
              <div class="signal-title">{{ signal.title }}</div>
              <div class="signal-description">{{ signal.description }}</div>
              <div class="signal-time">{{ formatTime(signal.timestamp) }}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
// TODO: Import InvitationStatus when available
type InvitationStatus = 'pending' | 'sent' | 'responded' | 'expired';

const route = useRoute();
const projectId = route.params.projectId as string;

const loading = ref(true);
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

const invitationStats = computed(() => {
  return {
    total: invitations.value.length,
    sent: invitations.value.filter(i => i.status === InvitationStatus.Sent || i.status === InvitationStatus.Responded).length,
    responded: invitations.value.filter(i => i.status === InvitationStatus.Responded).length,
  };
});

const responseRate = computed(() => {
  if (invitationStats.value.sent === 0) return 0;
  return Math.round((invitationStats.value.responded / invitationStats.value.sent) * 100);
});

const getStatusLabel = (status: InvitationStatus): string => {
  const labels: Record<InvitationStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    responded: 'Responded',
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

onMounted(async () => {
  // TODO: Загрузка данных через presenter
  setTimeout(() => {
    loading.value = false;
    // Заглушка данных
    invitations.value = [];
    earlySignals.value = [];
  }, 1000);
});
</script>

<style scoped>
.project-progress-view {
  padding: 2rem 0;
}

.progress-header {
  margin-bottom: 2rem;
}

.back-link {
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1rem;
  display: inline-block;
}

.progress-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #718096;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
}

.text-blue {
  color: #4299e1;
}

.text-green {
  color: #48bb78;
}

.text-purple {
  color: #9f7aea;
}

.invitations-card,
.signals-card {
  margin-bottom: 2rem;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invitation-item {
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.invitation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.invitation-email {
  font-weight: 500;
  color: #2d3748;
}

.invitation-status {
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

.invitation-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #718096;
}

.meta-text {
  display: block;
}

.signals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.signal-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border-left: 4px solid #e2e8f0;
}

.signal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.signal-positive {
  background: #c6f6d5;
  color: #22543d;
  border-left-color: #48bb78;
}

.signal-negative {
  background: #fed7d7;
  color: #c53030;
  border-left-color: #f56565;
}

.signal-neutral {
  background: #bee3f8;
  color: #2c5282;
  border-left-color: #4299e1;
}

.signal-content {
  flex: 1;
}

.signal-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.signal-description {
  color: #718096;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.signal-time {
  font-size: 0.75rem;
  color: #a0aec0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

