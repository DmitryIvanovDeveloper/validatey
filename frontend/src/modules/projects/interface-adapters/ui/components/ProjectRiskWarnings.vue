<template>
  <div v-if="loading || risks.length > 0" class="risk-warnings">
    <!-- Loading state -->
    <div v-if="loading" class="risk-warnings-loading">
      <LoadingSpots message="Analyzing for failure patterns..." size="sm" />
    </div>

    <!-- Risk warnings list -->
    <template v-else-if="risks.length > 0">
      <div class="risk-warnings-header">
        <svg class="risk-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span class="risk-header-title">Prevention Insights</span>
        <span class="risk-score-badge" :class="scoreBadgeClass">{{ scoreLabel }}</span>
      </div>

      <div class="risk-items">
        <div
          v-for="(risk, idx) in sortedRisks"
          :key="idx"
          class="risk-item"
          :class="`risk-item--${risk.level}`"
        >
          <div class="risk-item-level">
            <span class="risk-level-dot" :class="`risk-level-dot--${risk.level}`"></span>
            <span class="risk-level-label">{{ levelLabel(risk.level) }}</span>
          </div>
          <div class="risk-item-body">
            <p class="risk-pattern-name">{{ risk.patternName }}</p>
            <p class="risk-message">{{ risk.message }}</p>
            <p class="risk-suggestion">
              <svg class="risk-suggestion-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.318A3.75 3.75 0 0112 20.25a3.75 3.75 0 01-2.79-1.232l-.347-.318z" />
              </svg>
              {{ risk.suggestion }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LoadingSpots from '@/shared/components/LoadingSpots.vue';
import type { ProjectRisk, RiskLevel } from '../../../domain/entities/project-risk.entity';

interface Props {
  risks: ProjectRisk[];
  loading: boolean;
  overallRiskScore?: number;
}

const props = withDefaults(defineProps<Props>(), {
  risks: () => [],
  loading: false,
  overallRiskScore: 0,
});

const sortedRisks = computed(() => {
  const order: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  return [...props.risks].sort((a, b) => order[a.level] - order[b.level]);
});

const scoreBadgeClass = computed(() => {
  if (props.overallRiskScore >= 60) return 'risk-score-badge--high';
  if (props.overallRiskScore >= 30) return 'risk-score-badge--medium';
  return 'risk-score-badge--low';
});

const scoreLabel = computed(() => {
  if (props.overallRiskScore >= 60) return 'HIGH RISK';
  if (props.overallRiskScore >= 30) return 'MEDIUM RISK';
  return 'LOW RISK';
});

function levelLabel(level: RiskLevel): string {
  return { high: 'High', medium: 'Medium', low: 'Low' }[level];
}
</script>

<style scoped>
.risk-warnings {
  margin-top: 1rem;
  border-radius: 8px;
  border: var(--border-width) var(--border-style) #fde68a;
  background: #fffbeb;
  overflow: hidden;
}

.risk-warnings-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #92400e;
  font-size: 0.8125rem;
}

.risk-warnings-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-bottom: var(--border-width) var(--border-style) #fde68a;
  background: #fef3c7;
}

.risk-header-icon {
  width: 1rem;
  height: 1rem;
  color: #d97706;
  flex-shrink: 0;
}

.risk-header-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
  flex: 1;
}

.risk-score-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 100px;
  letter-spacing: 0.04em;
}

.risk-score-badge--high { background: #fee2e2; color: #991b1b; }
.risk-score-badge--medium { background: #fde68a; color: #92400e; }
.risk-score-badge--low { background: #d1fae5; color: #065f46; }

.risk-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.risk-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: var(--border-width) var(--border-style) #fde68a;
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-item--high { background: #fff7f7; }
.risk-item--medium { background: #fffbeb; }
.risk-item--low { background: #f9fafb; }

.risk-item-level {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 2px;
  min-width: 44px;
}

.risk-level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.risk-level-dot--high { background: #ef4444; }
.risk-level-dot--medium { background: #f59e0b; }
.risk-level-dot--low { background: #10b981; }

.risk-level-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.risk-item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.risk-pattern-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.risk-message {
  font-size: 0.8125rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

.risk-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
  font-style: italic;
  line-height: 1.4;
}

.risk-suggestion-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 1px;
  color: #9ca3af;
}
</style>
