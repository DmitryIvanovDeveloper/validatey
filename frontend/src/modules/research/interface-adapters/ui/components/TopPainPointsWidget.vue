<template>
  <div class="top-pain-points-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <div class="section-title-row">
          <h3 class="section-title">Top Pain Points</h3>
          <SectionHintButton
            text="Quotes and pains from comments; use for landing copy and interviews."
            aria-label="Hint: Top Pain Points"
          />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <LoadingSpots message="Loading..." size="md" />
      </div>

      <div v-else-if="painPoints?.length" class="signals-content">
        <div class="pain-points-list">
          <div
            v-for="(pain, index) in painPoints"
            :key="index"
            class="pain-point-item"
          >
            <p class="pain-point-text">{{ pain }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-text">No pain points identified yet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import SectionHintButton from '../../../../../shared/components/SectionHintButton.vue';
import LoadingSpots from '../../../../../shared/components/LoadingSpots.vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../../presenters/research.presenter';
import { TYPES } from '../../../infrastructure/bootstrap/types';

interface Props {
  projectId?: string;
  externalLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
  externalLoading: false,
});

const route = useRoute();
const projectId = props.projectId || route.params.projectId as string;

const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

const painPoints = ref<string[]>([]);
const internalLoading = ref(true);
const error = ref<string | null>(null);

// Combined loading state that considers both internal and external loading
const loading = computed(() => internalLoading.value || props.externalLoading);

const loadPainPoints = async () => {
  try {
    internalLoading.value = true;
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
    internalLoading.value = false;
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

defineExpose({
  reload: loadPainPoints
});
</script>

<style scoped>
.top-pain-points-widget {
  width: 100%;
}

.section-card {
  background: var(--color-bg-page);
  border-radius: 0.5rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  padding: 1rem;
}

.section-card-header {
  margin-bottom: 1rem;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}


.loading-state {
  padding: 1rem 0;
}

.pain-points-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pain-point-item {
  border-radius: 0.375rem;
  border: none;
  padding: 0;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
  padding-bottom: 0.75rem;
}

.pain-point-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.pain-point-text {
  margin: 0;
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.4;
}

.empty-state {
  padding: 1rem 0;
}

.empty-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>