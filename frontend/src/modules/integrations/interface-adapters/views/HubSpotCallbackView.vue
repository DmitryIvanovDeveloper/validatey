<template>
  <div class="hubspot-callback">
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <router-link to="/projects" class="btn btn-primary">Back to Projects</router-link>
    </div>
    <div v-else class="loading-state">
      <p>Connecting HubSpot…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { userContextService } from '../../../../shared/services/user-context.service';

const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);

onMounted(async () => {
  const code = (route.query.code as string)?.trim();
  const state = (route.query.state as string)?.trim() || '/projects';
  if (!code) {
    error.value = 'Missing authorization code from HubSpot.';
    return;
  }
  const userId = userContextService.getOrCreateUserId();
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HUBSPOT_CALLBACK}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.value = data?.error || data?.message || `Connection failed (${res.status})`;
      return;
    }
    router.replace(state.startsWith('/') ? state : `/${state}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to connect HubSpot';
  }
});
</script>

<style scoped>
.hubspot-callback {
  padding: 3rem 2rem;
  text-align: center;
}
.loading-state p,
.error-state p {
  margin-bottom: 1rem;
}
.error-state .btn {
  margin-top: 0.5rem;
}
</style>
