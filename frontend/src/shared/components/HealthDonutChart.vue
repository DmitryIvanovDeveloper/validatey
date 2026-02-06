<template>
  <div class="health-donut-wrap" :class="scoreClass" :style="wrapStyle">
    <div class="health-donut-canvas" :style="canvasWrapStyle">
      <Doughnut
        :data="chartData"
        :options="chartOptions"
      />
    </div>
    <div class="health-donut-center" aria-hidden="true">
      <span class="health-donut-value">{{ score }}</span>
      <span class="health-donut-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement } from 'chart.js';

ChartJS.register(ArcElement);

const props = withDefaults(
  defineProps<{
    score: number;
    scoreClass?: 'health-good' | 'health-warn' | 'health-low';
    label?: string;
    size?: number;
  }>(),
  {
    scoreClass: 'health-low',
    label: 'Project Health',
    size: 80,
  }
);

const size = computed(() => props.size ?? 80);
const wrapStyle = computed(() => ({
  width: size.value + 'px',
  height: size.value + 'px',
  minWidth: size.value + 'px',
  minHeight: size.value + 'px',
}));
const canvasWrapStyle = computed(() => ({
  width: size.value + 'px',
  height: size.value + 'px',
  position: 'absolute' as const,
  top: 0,
  left: 0,
}));

const fillColor = computed(() => {
  switch (props.scoreClass) {
    case 'health-good':
      return '#15803d';
    case 'health-warn':
      return '#a16207';
    default:
      return '#b91c1c';
  }
});

const chartData = computed(() => ({
  labels: ['Score', 'Remaining'],
  datasets: [
    {
      data: [Math.min(100, Math.max(0, props.score)), Math.max(0, 100 - props.score)],
      backgroundColor: [fillColor.value, '#94a3b8'],
      borderWidth: 0,
      hoverBorderWidth: 0,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1,
  layout: { padding: 0 },
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}));
</script>

<style scoped>
.health-donut-wrap {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.health-donut-canvas {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.health-donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  z-index: 1;
  pointer-events: none;
}
.health-donut-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}
.health-donut-wrap.health-good .health-donut-value {
  color: #15803d;
}
.health-donut-wrap.health-warn .health-donut-value {
  color: #a16207;
}
.health-donut-wrap.health-low .health-donut-value {
  color: #b91c1c;
}
.health-donut-label {
  font-size: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #64748b);
  line-height: 1;
}
</style>
