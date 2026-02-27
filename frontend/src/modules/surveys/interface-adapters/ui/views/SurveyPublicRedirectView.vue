<template>
  <div class="survey-public-redirect">
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>
    <div v-else class="loading-state">
      <p>Loading survey...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_CONFIG } from '../../../../../infrastructure/config/api.config';

const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);

onMounted(async () => {
  const slug = route.params.slug as string;
  if (!slug) {
    error.value = 'Invalid survey link';
    return;
  }
  try {
    const url = API_CONFIG.ENDPOINTS.SURVEY_PUBLIC(slug);
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error.value = data?.error || `Survey not available (${res.status})`;
      return;
    }
    const data = await res.json();
    const token = data?.invitation?.token;
    if (!token) {
      error.value = 'Invalid response from server';
      return;
    }
    router.replace({ path: `/survey/${token}` });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load survey';
  }
});
</script>

<style scoped>
.survey-public-redirect {
  padding: 2rem;
  text-align: center;
}
.loading-state,
.error-state {
  margin: 1rem 0;
}
.error-state { color: var(--color-error, #dc2626); }
</style>
