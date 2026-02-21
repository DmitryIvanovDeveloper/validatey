<template>
  <div class="landing-page">
    <LandingHeader />
    <div class="philosophy-banner">
      <p class="philosophy-text">
        We don't do the work for you. Together, we learn to create ideas that truly matter
      </p>
    </div>
    <LandingHero />
    <LandingProblem />
    <LandingSolution />
    <LandingHowItWorks />
    <LandingValidationTypes />
    <LandingWhoItsFor />
    <LandingSocialProof />
    <LandingFinalCTA />
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import LandingHeader from '../components/LandingHeader.vue';
import LandingHero from '../components/LandingHero.vue';
import LandingProblem from '../components/LandingProblem.vue';
import LandingSolution from '../components/LandingSolution.vue';
import LandingHowItWorks from '../components/LandingHowItWorks.vue';
import LandingValidationTypes from '../components/LandingValidationTypes.vue';
import LandingWhoItsFor from '../components/LandingWhoItsFor.vue';
import LandingSocialProof from '../components/LandingSocialProof.vue';
import LandingFinalCTA from '../components/LandingFinalCTA.vue';
import LandingFooter from '../components/LandingFooter.vue';
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background-color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.philosophy-banner {
  margin-top: 4rem;
  padding: 1rem 1.5rem;
  background-color: var(--color-bg-subtle, #e2e8f0);
  border-bottom: 1px solid var(--color-border, #cbd5e1);
  text-align: center;
}

.philosophy-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text, #0f172a);
  line-height: 1.5;
  max-width: 48rem;
  margin: 0 auto;
  font-style: italic;
}

@media (min-width: 640px) {
  .philosophy-banner {
    padding: 1.25rem 2rem;
  }
  
  .philosophy-text {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .philosophy-text {
    font-size: 1.125rem;
  }
}
</style>
