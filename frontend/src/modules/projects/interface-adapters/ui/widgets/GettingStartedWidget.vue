<template>
  <div v-if="showWidget" class="getting-started-widget">
    <div class="getting-started-header">
      <div class="getting-started-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="getting-started-content">
        <h3 class="getting-started-title">{{ labels.title }}</h3>
        <p class="getting-started-subtitle">{{ labels.subtitle }}</p>
      </div>
      <button
        type="button"
        class="getting-started-close"
        @click="dismissWidget"
        :aria-label="labels.dismissAria"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="getting-started-steps">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="getting-started-step"
        :class="{ completed: step.completed, active: step.active }"
      >
        <div class="step-indicator">
          <svg v-if="step.completed" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description">{{ step.description }}</div>
          <router-link
            v-if="step.actionHref && !step.completed"
            :to="step.actionHref"
            class="step-action"
          >
            {{ step.actionText }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export interface GettingStartedLabels {
  title: string;
  subtitle: string;
  dismissAria: string;
  step1Title: string;
  step1Description: string;
  step1Action: string;
  step2Title: string;
  step2Description: string;
  step2Action: string;
  step3Title: string;
  step3Description: string;
  step3Action: string;
}

const DEFAULT_LABELS: GettingStartedLabels = {
  title: 'Getting Started',
  subtitle: 'Follow these steps to validate your hypothesis',
  dismissAria: 'Dismiss getting started guide',
  step1Title: 'Start Research',
  step1Description: 'Get AI-powered market and competitive research for your hypothesis',
  step1Action: 'Start Research',
  step2Title: 'Collect Comments',
  step2Description: 'Fetch real feedback from Reddit, Hacker News, and LinkedIn',
  step2Action: 'Go to Comments',
  step3Title: 'Analyze Results',
  step3Description: 'Review validation insights and make data-driven decisions',
  step3Action: 'View Overview',
};

interface Props {
  projectId: string;
  hasResearch?: boolean;
  hasComments?: boolean;
  /** Labels for all text. If not provided, default English labels are used. */
  labels?: GettingStartedLabels;
}

const props = withDefaults(defineProps<Props>(), {
  hasResearch: false,
  hasComments: false,
  labels: undefined,
});

const labels = computed(() => props.labels ?? DEFAULT_LABELS);

const route = useRoute();
const workspaceId = computed(() => route.params.workspaceId as string);
const dismissed = ref(false);

const STORAGE_KEY = 'validatey_getting_started_dismissed';

onMounted(() => {
  const dismissedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  dismissed.value = dismissedProjects.includes(props.projectId);
});

const showWidget = computed(() => {
  if (dismissed.value) return false;
  return !(props.hasResearch && props.hasComments);
});

const steps = computed(() => [
  {
    title: labels.value.step1Title,
    description: labels.value.step1Description,
    actionText: labels.value.step1Action,
    actionHref: `#start-research`,
    completed: props.hasResearch,
    active: !props.hasResearch,
  },
  {
    title: labels.value.step2Title,
    description: labels.value.step2Description,
    actionText: labels.value.step2Action,
    actionHref: `/workspaces/${workspaceId.value}/projects/${props.projectId}/comments`,
    completed: props.hasComments,
    active: props.hasResearch && !props.hasComments,
  },
  {
    title: labels.value.step3Title,
    description: labels.value.step3Description,
    actionText: labels.value.step3Action,
    actionHref: `/workspaces/${workspaceId.value}/projects/${props.projectId}`,
    completed: props.hasResearch && props.hasComments,
    active: false,
  },
]);

const dismissWidget = () => {
  dismissed.value = true;
  const dismissedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!dismissedProjects.includes(props.projectId)) {
    dismissedProjects.push(props.projectId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedProjects));
  }
};
</script>

<style scoped>
.getting-started-widget {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.getting-started-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.getting-started-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: #0ea5e9;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.getting-started-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.getting-started-content {
  flex: 1;
}

.getting-started-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0 0 0.25rem 0;
}

.getting-started-subtitle {
  font-size: 0.875rem;
  color: #075985;
  margin: 0;
}

.getting-started-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.getting-started-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #334155;
}

.getting-started-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.getting-started-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.getting-started-step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-indicator {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #cbd5e1;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
}

.getting-started-step.active .step-indicator {
  background: #0ea5e9;
  color: white;
}

.getting-started-step.completed .step-indicator {
  background: #10b981;
  color: white;
}

.step-indicator svg {
  width: 1.25rem;
  height: 1.25rem;
}

.step-content {
  flex: 1;
  padding-top: 0.25rem;
}

.step-title {
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.step-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #0ea5e9;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.step-action:hover {
  color: #0284c7;
}

.step-action svg {
  width: 1rem;
  height: 1rem;
}

.getting-started-step.completed .step-title {
  color: #059669;
}

.getting-started-step.completed .step-description {
  color: #6b7280;
}
</style>
