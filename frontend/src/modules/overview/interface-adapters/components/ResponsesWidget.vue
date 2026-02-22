<template>
  <div class="responses-widget">
    <div v-if="loading" class="widget-loading">...</div>
    <div v-else-if="error" class="widget-error">{{ error }}</div>
    <div v-else class="widget-content">
      <span class="widget-label">Responses</span>
      <span class="widget-value">{{ responded }}/{{ sent }}</span>
      <span v-if="responseRatePct !== null" class="widget-rate">{{ responseRatePct }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const responded = ref<number>(0);
const sent = ref<number>(0);
const responseRatePct = ref<number | null>(null);

const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const loadResponses = async () => {
  try {
    loading.value = true;
    error.value = null;
    const url = API_CONFIG.ENDPOINTS.OVERVIEW(props.projectId);
    const data = await httpClient.get<{
      executiveSummary: {
        responded: number;
        sent: number;
        responseRatePct: number;
      };
    }>(url);
    
    if (data?.executiveSummary) {
      responded.value = data.executiveSummary.responded ?? 0;
      sent.value = data.executiveSummary.sent ?? 0;
      responseRatePct.value = data.executiveSummary.responseRatePct ?? null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load responses';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadResponses();
});
</script>

<style scoped>
.responses-widget {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.widget-loading,
.widget-error {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.widget-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget-label {
  color: var(--color-text-muted);
}

.widget-value {
  font-weight: 600;
  color: var(--color-text);
}

.widget-rate {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
