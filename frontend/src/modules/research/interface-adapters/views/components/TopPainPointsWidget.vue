<template>
  <div class="top-pain-points-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-signals" aria-hidden="true">
          <Frown class="w-5 h-5" />
        </span>
        <div>
          <h3 class="section-title">Top Pain Points</h3>
          <p class="section-subtitle">Key challenges identified from user feedback</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="loading-text">Analyzing user feedback...</p>
      </div>

      <div v-else-if="painPoints?.length" class="signals-content">
        <div class="pain-points-list">
          <div
            v-for="(pain, index) in painPoints"
            :key="index"
            class="pain-point-item"
          >
            <div class="pain-point-number">{{ index + 1 }}</div>
            <div class="pain-point-content">
              <p class="pain-point-text">{{ pain }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <span class="empty-icon" aria-hidden="true">
          <Frown class="w-8 h-8" />
        </span>
        <p class="empty-title">No pain points identified yet</p>
        <p class="empty-desc">Collect more responses to identify key user challenges.</p>
        <router-link
          :to="`/projects/${projectId}/responses`"
          class="btn btn-secondary"
        >
          View Responses
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Frown } from 'lucide-vue-next';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../../presenters/research.presenter';
import { TYPES } from '../../../infrastructure/bootstrap/types';

interface Props {
  projectId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
});

const route = useRoute();
const projectId = props.projectId || route.params.projectId as string;

const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

const painPoints = ref<string[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const loadPainPoints = async () => {
  try {
    loading.value = true;
    error.value = null;

    const result = await presenter.getResearchCanvas(projectId);

    if (result.canvas?.userInsights?.topPains) {
      painPoints.value = result.canvas.userInsights.topPains;
    } else {
      painPoints.value = [];
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load pain points';
    console.error('Failed to load top pain points:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPainPoints();
});

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    loadPainPoints();
  }
}, { immediate: false });
</script>

<style scoped>
.top-pain-points-widget {
  width: 100%;
}

.section-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  margin: 0;
}


.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-text {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.loading-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: loading-dots 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.pain-points-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pain-point-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-background-light);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-light);
}

.pain-point-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.pain-point-content {
  flex: 1;
}

.pain-point-text {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  gap: 1rem;
}

.empty-icon {
  color: var(--color-text-muted);
}

.empty-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
}

.empty-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-light);
}
</style>