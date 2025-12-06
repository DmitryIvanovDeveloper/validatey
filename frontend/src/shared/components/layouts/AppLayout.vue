<template>
  <div class="app-layout">
    <nav class="navbar" v-if="showNavbar">
      <div class="navbar-content">
        <router-link to="/" class="logo">Validatey</router-link>
        <div class="nav-links">
          <router-link to="/projects">Проекты</router-link>
          <router-link to="/projects/new">Создать проект</router-link>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const showNavbar = computed(() => {
  return route.meta.hideNavbar !== true;
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #2d3748;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
</style>
