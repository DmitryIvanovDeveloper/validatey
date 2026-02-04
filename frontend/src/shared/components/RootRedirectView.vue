<template>
  <div class="root-redirect">
    <LoadingSpinner />
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue';
</script>

<style scoped>
.root-redirect {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
