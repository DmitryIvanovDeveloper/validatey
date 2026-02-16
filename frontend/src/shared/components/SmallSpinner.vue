<template>
  <svg class="small-spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle
      class="small-spinner-track"
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.2"
      stroke-width="2"
    />
    <circle
      class="small-spinner-head"
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      transform="rotate(-90 12 12)"
      :stroke-dasharray="dasharray"
      :stroke-dashoffset="dashoffset"
    />
  </svg>
</template>

<script setup lang="ts">
// Calculate dasharray and dashoffset for spinner effect
const circumference = 2 * Math.PI * 10; // 2πr where r=10
const dasharray = `${circumference}px`;
const dashoffset = `${circumference * 0.75}px`; // 75% of circumference for visible part
</script>

<style scoped>
.small-spinner {
  width: 1rem;
  height: 1rem;
  transform-origin: center;
  animation: rotate 1s linear infinite;
  flex-shrink: 0;
}

.small-spinner-track,
.small-spinner-head {
  transform-origin: center;
  transition: all 0.2s ease;
}

.small-spinner-head {
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: calc(var(--circumference) * 0.75);
  }
  50% {
    stroke-dashoffset: calc(var(--circumference) * 0.25);
    transform: rotate(180deg);
  }
  100% {
    stroke-dashoffset: calc(var(--circumference) * 0.75);
    transform: rotate(360deg);
  }
}
</style>