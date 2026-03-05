<template>
  <button
    class="smart-action-btn"
    @click="handleSendReminders"
    :disabled="isLoading || pendingCount === 0"
  >
    <Send class="smart-action-icon" />
    <div class="smart-action-content">
      <div class="smart-action-label">Send reminders</div>
      <div class="smart-action-description">
        <span v-if="isLoading">Sending...</span>
        <span v-else-if="pendingCount > 0">{{ pendingCount }} respondents haven't completed the survey</span>
        <span v-else>All respondents have completed</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Send } from 'lucide-vue-next';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as INVITATION_TYPES } from '../../infrastructure/bootstrap/types';
import type { InvitationPresenter } from '../presenters/invitation.presenter';

interface Props {
  projectId: string;
  invitations: Array<{ id: string; email: string; status: string }>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  remindersSent: [result: { sent: number; failed: number; errors?: string[] }];
}>();

const invitationPresenter = container.get<InvitationPresenter>(INVITATION_TYPES.InvitationPresenter);
const isLoading = ref(false);

// Calculate pending invitations (sent but not completed)
const pendingCount = computed(() => {
  return props.invitations.filter(inv =>
    inv.status === 'sent' ||
    inv.status === 'pending' ||
    inv.status === 'delivered'
  ).length;
});

const handleSendReminders = async () => {
  if (isLoading.value || pendingCount.value === 0) return;

  isLoading.value = true;
  try {
    // Get IDs of pending invitations
    const pendingInvitationIds = props.invitations
      .filter(inv => inv.status === 'sent' || inv.status === 'pending' || inv.status === 'delivered')
      .map(inv => inv.id);

    const result = await invitationPresenter.sendInvitations(props.projectId, pendingInvitationIds);
    emit('remindersSent', result);
  } catch (error) {
    console.error('Failed to send reminders:', error);
    emit('remindersSent', {
      sent: 0,
      failed: pendingCount.value,
      errors: ['Failed to send reminders']
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
@reference "tailwindcss";

.smart-action-btn {
  @apply w-full flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.smart-action-icon {
  @apply w-5 h-5 text-blue-600 mr-3 flex-shrink-0;
}

.smart-action-content {
  @apply flex-1 text-left;
}

.smart-action-label {
  @apply font-medium text-gray-900 text-sm;
}

.smart-action-description {
  @apply text-xs text-gray-600 mt-1;
}
</style>