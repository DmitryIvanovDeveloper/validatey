<template>
  <section class="final-cta-section">
    <div class="cta-background"></div>
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">Stop guessing. Start building what people actually want.</h2>
        <p class="cta-subtitle">Join thousands of founders who validated their ideas before writing code.</p>

        <div class="cta-benefits">
          <div class="benefit-item">
            <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div class="benefit-item">
            <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>5-minute setup</span>
          </div>
          <div class="benefit-item">
            <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Results in 2-3 days</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.final-cta-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background: var(--color-accent, #0d9488);
  position: relative;
  overflow: hidden;
}

.cta-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.3;
}


.container {
  max-width: 896px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 10;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

.cta-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  line-height: 1.1;
}

@media (min-width: 640px) {
  .cta-title {
    font-size: 3rem;
  }
}

@media (min-width: 1024px) {
  .cta-title {
    font-size: 3.75rem;
  }
}

.cta-subtitle {
  font-size: 1.25rem;
  color: #bfdbfe;
  max-width: 42rem;
  margin: 0 auto;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  background-color: white;
  color: var(--color-accent, #0d9488);
  text-decoration: none;
  border-radius: var(--radius-md, 0.625rem);
  font-size: 1.125rem;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
  width: fit-content;
  margin: 0 auto;
}

.cta-button:hover {
  background-color: #f3f4f6;
  transform: translateY(-2px);
}

.icon-arrow {
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.5rem;
}


.cta-benefits {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: #bfdbfe;
}

@media (min-width: 640px) {
  .cta-benefits {
    flex-direction: row;
  }
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.icon-check {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
