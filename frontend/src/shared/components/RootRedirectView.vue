<template>
  <div class="root-redirect">
    <LoadingSpinner />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import LoadingSpinner from './LoadingSpinner.vue';

const router = useRouter();

// Immediate redirect on component creation
onBeforeMount(() => {
  // Simple check for auth data
  const sessionData = localStorage.getItem('validatey_user_id');
  const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('validatey_auth');

  if (sessionData || hasAuthCookie) {
    // Direct redirect to avoid router issues
    window.location.replace('/workspaces');
  } else {
    window.location.replace('/login');
  }
});

onMounted(() => {
  console.log('🔄 RootRedirectView: onMounted');
});
</script>

<style scoped>
.root-redirect {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
