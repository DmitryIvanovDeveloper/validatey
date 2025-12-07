<template>
  <div class="empty-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Пустой layout для страниц без навигации (например, форма респондента)
</script>

<style scoped>
.empty-layout {
  min-height: 100vh;
  width: 100%;
}
</style>

