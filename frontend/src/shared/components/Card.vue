<template>
  <div :class="['card', { 'card-hover': hover, 'card-clickable': clickable }]" @click="handleClick">
    <div v-if="title || $slots.header" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  hover?: boolean;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

const handleClick = () => {
  emit('click');
};
</script>

<style scoped>
.card {
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}

.card-hover:hover {
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
  transform: translateY(-3px);
  border-color: rgba(13, 148, 136, 0.3);
}

.card-clickable {
  cursor: pointer;
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.card-body {
  color: var(--color-text-muted);
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>