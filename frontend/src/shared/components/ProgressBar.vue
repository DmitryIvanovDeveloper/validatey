<template>
  <div
    class="progress-bar"
    :class="[sizeClass, { 'progress-bar--with-label': showLabel }]"
    :data-progress-value="String(clampedPercent)"
    data-progress-unit="percent"
  >
    <div class="progress-bar__track" data-progress-track>
      <div
        class="progress-bar__fill"
        :class="variantClass"
        :style="fillStyle"
        :data-progress-fill-width="String(clampedPercent)"
        role="progressbar"
        :aria-valuenow="roundedPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span class="progress-bar__fill-texture" aria-hidden="true" />
      </div>
    </div>
    <span v-if="showLabel" class="progress-bar__label">
      <slot name="label">{{ labelText }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * ProgressBar: fill width = percentage% of track.
 * To verify on site: inspect .progress-bar__track (full width) and .progress-bar__fill (filled part).
 * Check: fill.getBoundingClientRect().width / track.getBoundingClientRect().width ≈ data-progress-fill-width/100.
 * Attributes: data-progress-value (0–100), data-progress-fill-width (same), data-progress-track on track.
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Percentage 0–100 (takes precedence over current/total) */
    percentage?: number;
    /** Current value when using current/total */
    current?: number;
    /** Total value when using current/total */
    total?: number;
    /** Fill color variant */
    variant?: 'default' | 'excellent' | 'good' | 'low';
    /** Override fill color (CSS color, e.g. var(--color-warning) or #hex) */
    fillColor?: string;
    /** Show label (percentage or custom) */
    showLabel?: boolean;
    /** Custom label when showLabel and no slot */
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    percentage: undefined,
    current: 0,
    total: 0,
    variant: 'default',
    fillColor: undefined,
    showLabel: false,
    label: '',
    size: 'md',
  }
);

const percentageFromCurrentTotal = computed(() => {
  if (props.total <= 0) return 0;
  return Math.round(((props.current ?? 0) / props.total) * 100);
});

// Raw value for fill width (keep decimals so e.g. 25.3% matches displayed 25.3%)
const computedPercent = computed(() => {
  if (props.percentage !== undefined && props.percentage !== null) {
    const n = Number(props.percentage);
    return Number.isFinite(n) ? n : 0;
  }
  return percentageFromCurrentTotal.value;
});

const clampedPercent = computed(() => {
  const v = computedPercent.value;
  return Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
});

// Integer for label and aria (e.g. "25%" when value is 25.3)
const roundedPercent = computed(() => Math.round(clampedPercent.value));

const labelText = computed(() => {
  if (props.label) return props.label;
  return `${roundedPercent.value}%`;
});

const sizeClass = computed(() => `progress-bar--${props.size}`);
const variantClass = computed(() => `progress-bar__fill--${props.variant}`);

// Fill width = percentage% of track; when >0 but small, ensure a visible minimum so the bar color is seen
const fillStyle = computed(() => {
  const pct = clampedPercent.value;
  const style: Record<string, string> = { width: `${pct}%` };
  if (pct > 0 && pct < 6) style.minWidth = '14px';
  if (props.fillColor) style['--progress-fill-color'] = props.fillColor;
  return style;
});
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.progress-bar__track {
  flex: 1;
  min-width: 0;
  height: 0.5rem;
  min-height: 0.5rem;
  box-sizing: border-box;
  background-color: transparent;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar--sm .progress-bar__track {
  height: 0.4375rem;
  min-height: 0.4375rem;
}

.progress-bar--lg .progress-bar__track {
  height: 0.625rem;
  min-height: 0.625rem;
}

.progress-bar__fill {
  height: 100%;
  min-width: 0;
  border-radius: 9999px;
  /* Smooth fill animation when percentage changes */
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  /* Solid vivid color so the bar is clearly visible on the page */
  background-color: var(--progress-fill-color);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}

/* Light texture overlay only; base color does the work */
.progress-bar__fill-texture {
  position: absolute;
  inset: 0;
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cdefs%3E%3Cpattern id='h' patternUnits='userSpaceOnUse' width='10' height='10'%3E%3Cline x1='0' y1='10' x2='10' y2='0' stroke='%23000' stroke-width='0.5' opacity='0.12'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23h)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
}

/* Strong, saturated colors so the bar is unmistakably visible */
.progress-bar__fill--default {
  --progress-fill-color: var(--color-accent, #0f766e);
}

.progress-bar__fill--excellent {
  --progress-fill-color: #047857;
}

.progress-bar__fill--good {
  --progress-fill-color: #1d4ed8;
}

.progress-bar__fill--low {
  --progress-fill-color: #b45309;
}

.progress-bar__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: right;
}
</style>
