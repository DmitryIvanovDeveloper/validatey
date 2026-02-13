<template>
  <div class="wizard">
    <div class="wizard-header">
      <div class="steps-indicator">
        <div
          v-for="(step, index) in steps"
          :key="index"
          :class="[
            'step-indicator',
            {
              'step-completed': index < currentStep,
              'step-active': index === currentStep,
              'step-pending': index > currentStep,
            },
          ]"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
          <div v-if="index < steps.length - 1" class="step-connector"></div>
        </div>
      </div>
    </div>
    <div class="wizard-content">
      <slot :step="currentStep" :steps="steps" :goToStep="goToStep" :nextStep="nextStep" :prevStep="prevStep" />
    </div>
    <div class="wizard-footer">
      <button v-if="currentStep > 0" @click="prevStep" class="btn btn-secondary">Back</button>
      <div class="spacer"></div>
      <button v-if="currentStep < steps.length - 1" @click="nextStep" class="btn btn-primary">Next</button>
      <button v-else @click="handleComplete" class="btn btn-primary" :disabled="props.loading">
        {{ props.loading ? 'Creating...' : 'Complete' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

export interface WizardStep {
  label: string;
  component?: string;
}

const props = defineProps<{
  steps: WizardStep[];
  initialStep?: number;
  loading?: boolean;
  canProceed?: (currentStep: number) => boolean;
  canComplete?: () => boolean;
}>();

const emit = defineEmits<{
  complete: [];
  stepChange: [step: number];
}>();

const currentStep = ref(props.initialStep || 0);

const goToStep = (step: number) => {
  if (step >= 0 && step < props.steps.length) {
    currentStep.value = step;
    emit('stepChange', step);
  }
};

const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    // Check if we can proceed to next step
    if (props.canProceed && !props.canProceed(currentStep.value)) {
      return;
    }
    currentStep.value++;
    emit('stepChange', currentStep.value);
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    emit('stepChange', currentStep.value);
  }
};

const handleComplete = () => {
  // Check if we can complete
  if (props.canComplete && !props.canComplete()) {
    return;
  }
  emit('complete');
};

watch(() => props.initialStep, (newStep) => {
  if (newStep !== undefined) {
    currentStep.value = newStep;
  }
});

defineExpose({ currentStep, goToStep, nextStep, prevStep });
</script>

<style scoped>
.wizard {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.wizard-header {
  margin-bottom: 2rem;
}

.steps-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-indicator .step-number {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: 600;
  margin-bottom: 0.5rem;
  transition: all 0.3s;
  flex-shrink: 0;
}

.step-label {
  font-size: 0.875rem;
  text-align: center;
  color: #718096;
  transition: color 0.3s;
}

.step-connector {
  position: absolute;
  top: 20px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.step-completed .step-number {
  background: #48bb78;
  color: white;
}

.step-completed .step-label {
  color: #2d3748;
}

.step-active .step-number {
  background: #4299e1;
  color: white;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2);
}

.step-active .step-label {
  color: #4299e1;
  font-weight: 600;
}

.step-pending .step-number {
  background: #e2e8f0;
  color: #a0aec0;
}

.step-completed .step-connector {
  background: #48bb78;
}

.wizard-content {
  flex: 1;
  padding: 2rem 0;
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}

.spacer {
  flex: 1;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

@media (max-width: 768px) {
  .step-label {
    font-size: 0.75rem;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}
</style>


