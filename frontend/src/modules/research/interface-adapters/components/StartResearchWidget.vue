<template>
  <div class="start-research-widget">
    <button
      @click="handleStartResearch"
      :disabled="loading"
      class="btn-research-primary"
    >
      <span class="btn-icon" v-if="loading" aria-hidden="true">
        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      <span class="btn-icon" v-else aria-hidden="true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </span>
      {{ loading ? 'Researching...' : 'Start Research' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { container } from '@infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES as RESEARCH_TYPES } from '@modules/research/infrastructure/bootstrap/types';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);

const loading = ref(false);

const handleStartResearch = async () => {
  loading.value = true;
  emit('researchStarted');

  try {
    // TODO: Add research settings if needed
    const result = await researchPresenter.collectResearchData(props.projectId, {
      hypothesis: 'Product hypothesis',
    });

    if (result.error) {
      console.error('Failed to start research:', result.error);
    } else {
      // Research data collected successfully
      console.log('Research data collected successfully');

      // Now generate synthesis automatically
      try {
        console.log('Generating synthesis...');
        const synthesisResult = await researchPresenter.generateSynthesis(props.projectId);

        if (synthesisResult.error) {
          console.error('Failed to generate synthesis:', synthesisResult.error);
        } else {
          console.log('Synthesis generated successfully');
        }
      } catch (synthesisError) {
        console.error('Exception during synthesis generation:', synthesisError);
      }

      emit('researchCompleted');
    }
  } catch (error) {
    console.error('Exception during research start:', error);
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits<{
  researchStarted: [];
  researchCompleted: [];
}>();
</script>

<style scoped>
.start-research-widget {
  width: 100%;
}

.btn-research-primary {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: #fff;
  border: none;
  padding: 2rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}

.btn-research-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}

.btn-research-primary:active {
  transform: translateY(0);
}

.btn-research-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>