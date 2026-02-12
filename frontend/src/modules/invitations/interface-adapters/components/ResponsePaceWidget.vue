<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Response Pace</h2>

    <div class="space-y-4">
      <!-- Current pace -->
      <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center">
          <Clock class="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <div class="text-sm font-medium text-gray-900">Daily Response Rate</div>
            <div class="text-xs text-gray-600">Last 7 days average</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-blue-600">{{ currentPace }}/day</div>
          <div class="text-xs text-gray-500">
            Target: {{ targetPace }}/day
          </div>
        </div>
      </div>

      <!-- Progress towards target -->
      <div v-if="targetPace > 0" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Progress to target</span>
          <span class="font-medium">{{ Math.round((currentPace / targetPace) * 100) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min((currentPace / targetPace) * 100, 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Response trend -->
      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="text-lg font-bold text-gray-900">{{ yesterdayResponses }}</div>
          <div class="text-xs text-gray-600">Yesterday</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="text-lg font-bold text-gray-900">{{ lastWeekAvg }}</div>
          <div class="text-xs text-gray-600">7-day avg</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="text-lg font-bold text-gray-900">{{ thisWeekTotal }}</div>
          <div class="text-xs text-gray-600">This week</div>
        </div>
      </div>

      <!-- Insights -->
      <div v-if="insights.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium text-gray-900">Insights</h3>
        <div class="space-y-2">
          <div
            v-for="insight in insights"
            :key="insight.id"
            class="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <AlertCircle class="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-yellow-800">{{ insight.message }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Clock, AlertCircle } from 'lucide-vue-next';

interface Props {
  projectId: string;
  invitations: Array<{
    id: string;
    email: string;
    status: string;
    sentAt: Date | null;
    respondedAt: Date | null;
  }>;
  targetPace?: number; // Target responses per day
}

const props = defineProps<Props>();

// Calculate current pace (responses per day over last 7 days)
const currentPace = computed(() => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentResponses = props.invitations.filter(inv => {
    if (!inv.respondedAt) return false;
    const responseDate = new Date(inv.respondedAt);
    return responseDate >= sevenDaysAgo;
  });

  return Math.round((recentResponses.length / 7) * 10) / 10; // Round to 1 decimal
});

// Calculate yesterday's responses
const yesterdayResponses = computed(() => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  return props.invitations.filter(inv => {
    if (!inv.respondedAt) return false;
    const responseDate = new Date(inv.respondedAt);
    return responseDate.toDateString() === yesterdayStr;
  }).length;
});

// Calculate 7-day average
const lastWeekAvg = computed(() => {
  return Math.round(currentPace.value * 10) / 10;
});

// Calculate this week's total responses
const thisWeekTotal = computed(() => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  return props.invitations.filter(inv => {
    if (!inv.respondedAt) return false;
    const responseDate = new Date(inv.respondedAt);
    return responseDate >= weekStart;
  }).length;
});

// Generate insights based on response pace
const insights = computed(() => {
  const insights = [];
  const target = props.targetPace || 5; // Default target of 5 responses per day

  if (currentPace.value < target * 0.5) {
    insights.push({
      id: 'low-pace',
      message: 'Response pace is below 50% of target. Consider sending reminders or extending the survey period.'
    });
  } else if (currentPace.value === 0 && props.invitations.some(inv => inv.status === 'sent')) {
    insights.push({
      id: 'no-responses',
      message: 'No responses received recently. Check if survey link is working or send reminders.'
    });
  }

  const pendingCount = props.invitations.filter(inv => inv.status === 'sent' || inv.status === 'pending').length;
  if (pendingCount > 20) {
    insights.push({
      id: 'high-pending',
      message: `${pendingCount} invitations are still pending. Consider follow-up reminders.`
    });
  }

  return insights;
});
</script>

<style scoped>
/* Component styles are already included in template classes */
</style>