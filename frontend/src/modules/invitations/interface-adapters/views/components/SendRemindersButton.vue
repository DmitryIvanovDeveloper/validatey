<template>
  <div v-if="nonRespondedCount > 0" class="send-reminders-section">
    <div class="send-reminders-info">
      <span>{{ nonRespondedCount }} people haven't responded yet</span>
      <router-link
        :to="`/projects/${projectId}/invitations`"
        class="send-reminders-action"
        @click="handleSendReminders"
      >
        Send reminders
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  projectId: string;
  nonRespondedCount: number;
  loading?: boolean;
}

const props = defineProps<Props>();

const handleSendReminders = () => {
  // Logic for sending reminders will be handled in the parent component
  // This component is just for display and navigation
};

defineEmits<{
  sendReminders: [];
}>();
</script>

<style scoped>
.send-reminders-section {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.send-reminders-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.send-reminders-info span {
  color: #374151;
  font-size: 0.875rem;
}

.send-reminders-action {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease-in-out;
}

.send-reminders-action:hover {
  background: #1d4ed8;
}

@media (max-width: 640px) {
  .send-reminders-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>