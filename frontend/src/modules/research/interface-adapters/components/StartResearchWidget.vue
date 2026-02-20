<template>
  <div class="start-research-widget">
    <!-- Cooldown Notice -->
    <div v-if="!availability.available" class="cooldown-notice">
      <div class="cooldown-content">
        <Clock class="cooldown-icon" />
        <div class="cooldown-text">
          <div class="cooldown-title">Research Cooldown Active</div>
          <div class="cooldown-timer">{{ formatCountdown(availability.timeUntilNext) }}</div>
        </div>
      </div>
    </div>

    <!-- Research Button -->
    <button
      @click="handleStartResearch"
      :disabled="loading || !availability.available"
      class="btn-research-primary"
      :class="{ 'btn-disabled': !availability.available }"
    >
      <span class="btn-icon" v-if="loading" aria-hidden="true">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      <span class="btn-icon" v-else-if="availability.available" aria-hidden="true">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </span>
      <span class="btn-icon" v-else aria-hidden="true">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </span>
      {{
        loading ? 'Researching...' :
        !availability.available ? 'Cooldown Active' :
        'Start Research'
      }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { Clock } from 'lucide-vue-next';
import { container } from '@infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES as RESEARCH_TYPES } from '@modules/research/infrastructure/bootstrap/types';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';
import { ResearchCooldownError } from '../../domain/errors/research.error';

interface Props {
  projectId: string;
}

interface ResearchAvailability {
  available: boolean;
  timeUntilNext: number;
  nextAvailableAt: Date | null;
  formattedTimeRemaining: string;
}

interface EmitEvents {
  researchStarted: [];
  researchCompleted: [];
}

const props = defineProps<Props>();

const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);

const loading = ref<boolean>(false);
const countdownInterval = ref<NodeJS.Timeout | null>(null);

const availability = ref<ResearchAvailability>({
  available: true,
  timeUntilNext: 0,
  nextAvailableAt: null,
  formattedTimeRemaining: '',
});

// Check availability on component mount
onMounted(async () => {
  await checkAvailability();
  startCountdown();
});

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
});

// Progress bar calculation (24 hours = 100%)
const getProgressPercentage = (): number => {
  if (availability.value.available) return 100;
  const totalCooldown: number = 24 * 60 * 60 * 1000; // 24 hours in ms
  const elapsed: number = totalCooldown - availability.value.timeUntilNext;
  return Math.min(100, Math.max(0, (elapsed / totalCooldown) * 100));
};

const checkAvailability = async (): Promise<void> => {
  try {
    const result = await researchPresenter.checkResearchAvailability(props.projectId);
    if (result) {
      availability.value = {
        available: result.available,
        timeUntilNext: result.timeUntilNext,
        nextAvailableAt: result.nextAvailableAt,
        formattedTimeRemaining: result.formattedTimeRemaining || ''
      };
    }
  } catch (error) {
    console.error('Failed to check research availability:', error);
    // Fallback - assume available
    availability.value = {
      available: true,
      timeUntilNext: 0,
      nextAvailableAt: null,
      formattedTimeRemaining: ''
    } satisfies ResearchAvailability;
  }
};

const startCountdown = (): void => {
  if (availability.value.available || countdownInterval.value) return;

  countdownInterval.value = setInterval((): void => {
    const now: number = new Date().getTime();
    const nextTime: number = availability.value.nextAvailableAt?.getTime() ?? 0;
    const remaining: number = Math.max(0, nextTime - now);

    availability.value.timeUntilNext = remaining;

    if (remaining <= 0) {
      availability.value = {
        available: true,
        timeUntilNext: 0,
        nextAvailableAt: null,
        formattedTimeRemaining: ''
      } satisfies ResearchAvailability;

      if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
        countdownInterval.value = null;
      }
    } else {
      availability.value.formattedTimeRemaining = ResearchCooldownError.formatTimeRemaining(remaining);
    }
  }, 1000);
};

const formatCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) return '00:00:00';

  const hours: number = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes: number = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds: number = Math.floor((milliseconds % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const handleStartResearch = async (): Promise<void> => {
  loading.value = true;
  emit('researchStarted');

  try {
    // TODO: Add research settings if needed
    const result = await researchPresenter.collectResearchData(props.projectId, {
      hypothesis: 'Product hypothesis',
    });

    if (result.error) {
      // Check for cooldown error
      if (typeof result.error === 'object' && result.error && 'type' in result.error && result.error.type === 'COOLDOWN') {
        console.warn('Research cooldown active:', result.error);
        // Update local state with server response
        const cooldownError = result.error;
        availability.value = {
          available: false,
          timeUntilNext: cooldownError.timeUntilNext,
          nextAvailableAt: new Date(cooldownError.nextAvailableAt),
          formattedTimeRemaining: cooldownError.formattedTimeRemaining
        } satisfies ResearchAvailability;

        startCountdown();
        return;
      }

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

      // Refresh availability after successful completion
      await checkAvailability();
    }
  } catch (error: unknown) {
    console.error('Exception during research start:', error);
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits<EmitEvents>();
</script>

<style scoped>
.start-research-widget {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Cooldown Notice */
.cooldown-notice {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(13, 148, 136, 0.15);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 12px rgba(13, 148, 136, 0.08);
}

.cooldown-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cooldown-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #0d9488;
  flex-shrink: 0;
}

.cooldown-text {
  flex: 1;
  min-width: 0;
}

.cooldown-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.125rem;
}

.cooldown-timer {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0d9488;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

/* Research Button */
.btn-research-primary {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
  color: #fff;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
}

.btn-research-primary:hover:not(.btn-disabled) {
  background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}

.btn-research-primary:active:not(.btn-disabled) {
  transform: translateY(0);
}

.btn-research-primary:disabled,
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: #9ca3af;
  box-shadow: 0 1px 3px rgba(156, 163, 175, 0.25);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .cooldown-notice {
    padding: 0.875rem 1.25rem;
  }

  .cooldown-content {
    gap: 0.625rem;
  }

  .cooldown-title {
    font-size: 0.8125rem;
  }

  .cooldown-timer {
    font-size: 0.8125rem;
  }

  .btn-research-primary {
    padding: 0.875rem 1.25rem;
    font-size: 0.8125rem;
  }
}
</style>