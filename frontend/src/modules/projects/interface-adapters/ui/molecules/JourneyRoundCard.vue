<template>
  <component
    :is="link ? 'router-link' : 'div'"
    :to="link"
    class="journey-round block"
    :class="{ 'no-underline': !!link }"
  >
    <div class="flex items-center gap-2 mb-1">
      <span :class="['journey-status', `journey-status-${round.status}`]">{{ round.status }}</span>
      <span class="journey-type">{{ round.type }}</span>
    </div>
    <div class="journey-title">{{ round.title }}</div>
    <div v-if="round.keyFinding" class="journey-finding">{{ round.keyFinding }}</div>
    <div v-if="link" class="journey-open-hint">Open round →</div>
  </component>
</template>

<script setup lang="ts">
defineProps<{
  round: { id?: string; title: string; type: string; status: string; keyFinding?: string | null };
  /** When set, card is a router-link to this path. */
  link?: string;
}>();
</script>

<style scoped>
.journey-round {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: inherit;
  display: block;
}

.journey-round.no-underline { text-decoration: none; }

.journey-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: inline-block;
}

.journey-status-draft { color: #94a3b8; background: rgba(148, 163, 184, 0.1); }
.journey-status-active { color: #0891b2; background: rgba(8, 145, 178, 0.1); }
.journey-status-completed { color: #166534; background: rgba(22, 163, 74, 0.1); }

.journey-type { font-size: 0.8125rem; color: #64748b; font-weight: 500; }
.journey-title { font-size: 1.125rem; font-weight: 700; margin: 0.5rem 0 0.5rem 0; color: #1e293b; }
.journey-finding { font-size: 0.875rem; color: #64748b; margin: 0; line-height: 1.5; }
.journey-open-hint { font-size: 0.75rem; color: var(--color-accent); margin-top: 0.25rem; }
</style>
