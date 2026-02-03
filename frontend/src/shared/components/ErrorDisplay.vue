<template>
  <div v-if="error" class="error-display">
    <div class="error-icon">⚠️</div>
    <div class="error-content">
      <h3>{{ title || 'Error' }}</h3>
      <p>{{ error }}</p>
    </div>
    <button v-if="dismissible" @click="$emit('dismiss')" class="dismiss-button">×</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  error: string | null;
  title?: string;
  dismissible?: boolean;
}>();

defineEmits<{
  dismiss: [];
}>();
</script>

<style scoped>
.error-display {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 0.5rem;
  color: #c33;
}

.error-icon {
  font-size: 1.5rem;
}

.error-content {
  flex: 1;
}

.error-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.error-content p {
  margin: 0;
  font-size: 0.875rem;
}

.dismiss-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #c33;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dismiss-button:hover {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}
</style>



