<template>
  <Badge
    v-if="finalStatus"
    :variant="finalStatus"
    size="md"
    :label="statusLabel"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import Badge from '@/shared/components/atoms/Badge.vue';

type HypothesisStatus = 'confirmed' | 'need_more' | 'not_supported' | null;

interface Props {
  // Либо передаем готовый статус
  status?: HypothesisStatus;
  // Либо projectId для самостоятельного получения статуса
  projectId?: string;
}

const props = defineProps<Props>();

// Внутренний статус, получаемый из API
const internalStatus = ref<HypothesisStatus>(null);

// Финальный статус: либо из props, либо из внутреннего состояния
const finalStatus = computed(() => props.status ?? internalStatus.value);

// Получаем статус из research presenter
const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);

const loadStatus = async () => {
  if (!props.projectId || props.status !== undefined) return;

  try {
    const result = await researchPresenter.getHypothesisStatus(props.projectId);
    internalStatus.value = result;
  } catch (error) {
    console.warn('Failed to load hypothesis status:', error);
    internalStatus.value = null;
  }
};

// Следим за изменениями projectId
watch(() => props.projectId, () => {
  if (props.projectId) {
    loadStatus();
  }
}, { immediate: true });

const statusLabel = computed(() => {
  switch (finalStatus.value) {
    case 'confirmed':
      return 'Confirmed';
    case 'need_more':
      return 'Need more';
    case 'not_supported':
      return 'Not supported';
    default:
      return '';
  }
});
</script>