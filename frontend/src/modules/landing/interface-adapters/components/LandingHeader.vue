<template>
  <header class="landing-header">
    <div class="container">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">V</div>
          <span class="logo-text">Validatey</span>
        </div>
        
        <nav class="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#validation-types">Validation Types</a>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.landing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border, #cbd5e1);
  height: 4rem;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
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

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  background: var(--color-accent, #0d9488);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
}

.nav-links {
  display: none;
  align-items: center;
  gap: 2rem;
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

.nav-links a {
  color: var(--color-text-muted, #475569);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--color-accent, #0d9488);
}

</style>
