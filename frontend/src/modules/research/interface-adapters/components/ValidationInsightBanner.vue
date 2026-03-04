<template>
  <div v-if="insight" :class="['validation-insight', `validation-insight--${insight.type}`]">
    <div class="vi-icon" aria-hidden="true">
      <svg v-if="insight.type === 'mixed'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <svg v-else-if="insight.type === 'confirmed'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
    <div class="vi-body">
      <p class="vi-title">{{ insight.title }}</p>
      <p class="vi-text">{{ insight.body }}</p>
      <p class="vi-next-step">
        <span class="vi-next-label">Next step:</span>
        {{ insight.nextStep }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../../comments/types';
import type { CommentPatternsPresenter } from '../../../comments/interface-adapters/presenters/comment-patterns.presenter';
import type { CommentPatternAnalysis } from '../../../comments/domain/entities/comment-pattern-analysis.entity';

type AssessmentStatus = 'confirmed' | 'need_more' | 'not_supported' | 'not_testable' | 'disproven';

interface AssumptionAssessment {
  readonly assumptionId: string;
  readonly status: string;
  readonly evidence: string | null;
}

interface Props {
  projectId: string;
  assumptionAssessments?: ReadonlyArray<AssumptionAssessment> | null;
}

const props = defineProps<Props>();

const analysis = ref<CommentPatternAnalysis | null>(null);
const loading = ref(false);

const presenter = container.get<CommentPatternsPresenter>(COMMENT_TYPES.CommentPatternsPresenter);

async function loadAnalysis(): Promise<void> {
  if (!props.projectId) return;
  loading.value = true;
  try {
    const { analysis: a } = await presenter.loadAnalysis(props.projectId);
    analysis.value = a;
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadAnalysis());
watch(() => props.projectId, (id) => { if (id) loadAnalysis(); });

function normalizeStatus(raw: string): AssessmentStatus | null {
  const s = String(raw).toLowerCase().trim().replace(/-/g, '_');
  if (s === 'confirmed' || s.startsWith('support')) return 'confirmed';
  if (s.includes('need_more') || s.includes('more data') || s === 'needs_more_data') return 'need_more';
  if (s === 'not_supported' || s === 'rejected' || s.includes('not_support')) return 'not_supported';
  if (s.includes('disproven')) return 'disproven';
  if (s.includes('not_testable') || s.includes('not testable')) return 'not_testable';
  return null;
}

type InsightType = 'mixed' | 'confirmed' | 'needs_pivot';

interface Insight {
  type: InsightType;
  title: string;
  body: string;
  nextStep: string;
}

const insight = computed<Insight | null>(() => {
  const assessments = props.assumptionAssessments;
  const a = analysis.value;

  // Need at least some data to show anything
  if (!assessments?.length && !a) return null;

  // Count assessment statuses
  const statusCounts = { confirmed: 0, need_more: 0, not_supported: 0, disproven: 0, not_testable: 0 };
  for (const item of assessments ?? []) {
    const s = normalizeStatus(item.status);
    if (s) statusCounts[s]++;
  }
  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  // Count direct patterns (those that support the hypothesis)
  const directCount = (a?.patterns ?? []).filter(
    (p) => !p.evidenceType || p.evidenceType === 'direct'
  ).length;
  const contradictoryCount = (a?.patterns ?? []).filter(
    (p) => p.evidenceType === 'contradictory'
  ).length;
  const validationScore = a?.validationScore ?? 0;

  // --- Case 1: Strong patterns confirm the problem, but assessments say need_more ---
  // This is the "mixed signal" case: Reddit proves pain, but can't test purchase intent
  const patternStrength = directCount >= 2 || validationScore >= 30;
  const mostlyNeedMore = total > 0 && statusCounts.need_more >= Math.ceil(total * 0.4);
  const fewConfirmed = statusCounts.confirmed < statusCounts.need_more;

  if (patternStrength && mostlyNeedMore && fewConfirmed && statusCounts.disproven === 0) {
    return {
      type: 'mixed',
      title: 'Problem validated — solution needs direct testing',
      body: `Community patterns confirm the problem exists (${directCount} supporting pattern${directCount !== 1 ? 's' : ''}${validationScore > 0 ? `, ${validationScore}% validation score` : ''}). However, Reddit data alone can't measure willingness to pay, adoption intent, or pricing sensitivity.`,
      nextStep: 'Conduct 5–10 user interviews or launch a smoke-test landing page to validate purchase intent and solution viability.',
    };
  }

  // --- Case 2: Both patterns and assessments confirm the hypothesis ---
  if (statusCounts.confirmed >= Math.ceil(total * 0.5) && validationScore >= 50) {
    return {
      type: 'confirmed',
      title: 'Strong validation signal',
      body: `Assumption assessments and community patterns align: ${statusCounts.confirmed} assumption${statusCounts.confirmed !== 1 ? 's' : ''} confirmed, validation score ${validationScore}%.`,
      nextStep: 'Consider moving to an MVP or a paid pilot to test real adoption.',
    };
  }

  // --- Case 3: Assessments show "not supported" or "disproven" with weak patterns ---
  const mostlyNegative = statusCounts.not_supported + statusCounts.disproven >= Math.ceil(total * 0.4);
  const weakPatterns = directCount < 2 && validationScore < 30;

  if (mostlyNegative && weakPatterns && total > 0) {
    return {
      type: 'needs_pivot',
      title: 'Low validation signal — consider refining the hypothesis',
      body: `${statusCounts.not_supported + statusCounts.disproven} assumption${statusCounts.not_supported + statusCounts.disproven !== 1 ? 's' : ''} not supported by available data, and patterns show limited problem evidence${contradictoryCount > 0 ? ` (${contradictoryCount} contradictory signal${contradictoryCount !== 1 ? 's' : ''})` : ''}.`,
      nextStep: 'Review your core assumption, narrow the target audience, or shift to a different problem space before collecting more data.',
    };
  }

  return null;
});
</script>

<style scoped>
.validation-insight {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  border-left-width: 3px;
  background: var(--color-bg);
  margin-top: 0.75rem;
}

.validation-insight--mixed {
  border-left-color: var(--color-warning, #d97706);
  background: color-mix(in srgb, var(--color-warning, #d97706) 5%, var(--color-bg));
}

.validation-insight--confirmed {
  border-left-color: var(--color-success, #059669);
  background: color-mix(in srgb, var(--color-success, #059669) 5%, var(--color-bg));
}

.validation-insight--needs_pivot {
  border-left-color: var(--color-error, #dc2626);
  background: color-mix(in srgb, var(--color-error, #dc2626) 4%, var(--color-bg));
}

.vi-icon {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.1rem;
}

.validation-insight--mixed .vi-icon { color: var(--color-warning, #d97706); }
.validation-insight--confirmed .vi-icon { color: var(--color-success, #059669); }
.validation-insight--needs_pivot .vi-icon { color: var(--color-error, #dc2626); }

.vi-icon svg {
  width: 100%;
  height: 100%;
}

.vi-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.vi-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.vi-text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, var(--color-text-muted));
  line-height: 1.5;
}

.vi-next-step {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text);
  line-height: 1.5;
}

.vi-next-label {
  font-weight: 600;
  margin-right: 0.25rem;
}
</style>
