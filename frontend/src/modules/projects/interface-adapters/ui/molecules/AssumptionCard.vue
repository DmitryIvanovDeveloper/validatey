<template>
  <li
    :class="['assumption-card', status ? `assumption-card--${status}` : 'assumption-card--pending']"
  >
    <div class="assumption-card-inner">
      <div class="assumption-card-header">
        <p class="assumption-label" v-html="labelHtml"></p>
        <AssumptionStatusBadge :status="status" />
      </div>
      <div v-if="evidenceHtml" class="assumption-evidence-wrap">
        <button
          type="button"
          class="assumption-evidence-toggle"
          :aria-expanded="expanded"
          @click="$emit('toggle')"
        >
          {{ evidenceLabel }}
        </button>
        <div v-if="expanded" class="assumption-evidence-content">
          <p class="assumption-evidence-text formatted-text" v-html="evidenceHtml"></p>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import AssumptionStatusBadge from '../atoms/AssumptionStatusBadge.vue';

type Status = 'confirmed' | 'need_more' | 'not_supported' | null;

defineProps<{
  labelHtml: string;
  status: Status;
  evidenceHtml: string | null;
  evidenceLabel: string;
  expanded: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
.assumption-card {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}
.assumption-card--confirmed { border-left: 2px solid var(--color-success); }
.assumption-card--need_more { border-left: 2px solid var(--color-warning); }
.assumption-card--not_supported { border-left: 2px solid var(--color-error); }
.assumption-card--pending { border-left: 2px solid var(--color-border); }

.assumption-card-inner {
  padding: 0.625rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.assumption-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.assumption-label {
  margin: 0;
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.5;
}

.assumption-evidence-wrap { margin-top: 0.125rem; }

.assumption-evidence-toggle {
  display: inline-flex;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-accent);
  text-align: left;
}

.assumption-evidence-toggle:hover { text-decoration: underline; }

.assumption-evidence-content { padding: 0.25rem 0; }
.assumption-evidence-text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.assumption-evidence-text.formatted-text {
  background: none;
  padding: 0;
  border: none;
  box-shadow: none;
}
</style>
